const { bearerToken } = require('./createOrderIntent');
const { tossPayments } = require('./tossPayments');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const pending = (res) => res.status(202).json({
  success: false,
  error: '결제 상태를 확인 중입니다. 잠시 후 같은 주문으로 다시 확인해 주세요.',
});

const confirmOrderHandler = ({ authClient, adminClient, secretKey, payments = tossPayments({ secretKey }) }) => async (req, res) => {
  const token = bearerToken(req.headers?.authorization);
  if (!token) return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });

  let userId;
  try {
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data?.user?.id) return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    userId = data.user.id;
  } catch (_error) {
    return res.status(503).json({ success: false, error: '로그인을 확인할 수 없습니다.' });
  }

  const { paymentKey, orderId, amount } = req.body || {};
  if (!UUID.test(orderId || '') || typeof paymentKey !== 'string' || !paymentKey || paymentKey.length > 200 ||
      !Number.isSafeInteger(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: '결제 정보가 올바르지 않습니다.' });
  }

  try {
    const { data: intent, error: readError } = await adminClient.from('order_intents')
      .select('id,user_id,amount,status,payment_key,confirmed_order_id,expires_at')
      .eq('id', orderId).eq('user_id', userId).maybeSingle();
    if (readError) throw readError;
    if (!intent) return res.status(404).json({ success: false, error: '주문 초안을 찾을 수 없습니다.' });
    if (intent.amount !== amount) {
      return res.status(409).json({ success: false, error: '결제 금액이 주문 금액과 다릅니다.' });
    }
    if (intent.payment_key && intent.payment_key !== paymentKey) {
      return res.status(409).json({ success: false, error: '다른 결제가 이미 연결된 주문입니다.' });
    }
    if (intent.status === 'confirmed' && intent.confirmed_order_id) {
      return res.json({ success: true, data: { orderId: intent.confirmed_order_id, amount: intent.amount } });
    }
    if (intent.status === 'created' && new Date(intent.expires_at).getTime() <= Date.now()) {
      return res.status(409).json({ success: false, error: '주문 초안이 만료되었습니다.' });
    }

    const { data: claim, error: claimError } = await adminClient.rpc('claim_order_intent', {
      p_intent_id: orderId, p_user_id: userId, p_payment_key: paymentKey,
    });
    if (claimError || !claim) {
      return res.status(409).json({ success: false, error: '주문 결제 상태를 확인할 수 없습니다.' });
    }
    if (claim.status === 'confirmed' && claim.confirmed_order_id) {
      return res.json({ success: true, data: { orderId: claim.confirmed_order_id, amount: intent.amount } });
    }

    // Only the request that acquired the claim sends POST /confirm. Retries
    // inspect Toss first, which also handles an ambiguous prior timeout.
    let result;
    try {
      result = claim.claimed ? await payments.confirm({ paymentKey, orderId, amount: intent.amount })
        : await payments.get(paymentKey);
    } catch (_error) {
      return pending(res);
    }
    if (!result.ok && claim.claimed) {
      // A failed POST response may follow a successful payment. Reconcile it.
      try { result = await payments.get(paymentKey); } catch (_error) { return pending(res); }
    }
    if (!result.ok) return pending(res);
    const payment = result.body;
    if (payment.paymentKey !== paymentKey || payment.orderId !== orderId ||
        payment.totalAmount !== intent.amount) {
      return res.status(409).json({ success: false, error: '토스 결제 정보가 주문과 다릅니다.' });
    }
    if (payment.status !== 'DONE') return pending(res);

    const { data: finalized, error: finalizeError } = await adminClient.rpc('finalize_paid_order', {
      p_intent_id: orderId, p_user_id: userId, p_payment_key: paymentKey,
    });
    if (finalizeError || !finalized) return pending(res);
    return res.json({ success: true, data: { orderId: finalized.order_id, orderNumber: finalized.order_number, amount: intent.amount } });
  } catch (_error) {
    return res.status(503).json({ success: false, error: '결제 상태를 확인할 수 없습니다.' });
  }
};

module.exports = { confirmOrderHandler };
