const { randomUUID } = require('node:crypto');
const { quoteCart, QuoteError } = require('./quoteCart');

const bearerToken = (header) => {
  if (typeof header !== 'string') return null;
  const match = /^Bearer ([^\s]+)$/i.exec(header);
  return match?.[1] || null;
};

const createOrderIntentHandler = ({ authClient, adminClient, enabled = false }) => async (req, res) => {
  if (!enabled || !adminClient) {
    return res.status(503).json({ success: false, error: '주문 기능을 점검하고 있습니다.' });
  }

  const token = bearerToken(req.headers?.authorization);
  if (!token) return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });

  let user;
  try {
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data?.user?.id) {
      return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    }
    user = data.user;
  } catch (_error) {
    return res.status(503).json({ success: false, error: '로그인을 확인할 수 없습니다.' });
  }

  const { cafeId, items, note = '' } = req.body || {};
  if (typeof note !== 'string' || note.length > 100) {
    return res.status(400).json({ success: false, error: '요청사항은 100자 이하여야 합니다.' });
  }

  let quote;
  try {
    quote = quoteCart({ cafeId, items });
  } catch (error) {
    if (error instanceof QuoteError) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: '견적을 계산할 수 없습니다.' });
  }

  try {
    const { data: cafe, error: cafeError } = await adminClient
      .from('cafes').select('id,name,is_open').eq('id', cafeId).single();
    if (cafeError || !cafe) {
      return res.status(503).json({ success: false, error: '카페 상태를 확인할 수 없습니다.' });
    }
    if (!cafe.is_open) {
      return res.status(409).json({ success: false, error: '현재 주문할 수 없는 카페입니다.' });
    }

    const orderId = randomUUID();
    const { data: intent, error: insertError } = await adminClient
      .from('order_intents')
      .insert({
        id: orderId,
        user_id: user.id,
        cafe_id: cafe.id,
        cafe_name: cafe.name,
        items: quote.items,
        amount: quote.totalPrice,
        note,
      })
      .select('id,amount,expires_at')
      .single();
    if (insertError || !intent) throw insertError || new Error('Missing intent');

    return res.status(201).json({
      success: true,
      data: { orderId: intent.id, amount: intent.amount, expiresAt: intent.expires_at },
    });
  } catch (_error) {
    return res.status(503).json({ success: false, error: '주문 초안을 저장할 수 없습니다.' });
  }
};

module.exports = { bearerToken, createOrderIntentHandler };
