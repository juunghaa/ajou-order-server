const test = require('node:test');
const assert = require('node:assert/strict');
const { confirmOrderHandler } = require('../src/lib/confirmOrder');
const { tossPayments } = require('../src/lib/tossPayments');

const intentId = '11111111-1111-4111-8111-111111111111';
const paidOrderId = '22222222-2222-4222-8222-222222222222';
const paymentKey = 'test-payment-key';
const payment = { paymentKey, orderId: intentId, totalAmount: 5000, status: 'DONE' };
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const request = (body = {}) => ({ headers: { authorization: 'Bearer user-token' }, body: { paymentKey, orderId: intentId, amount: 5000, ...body } });

const setup = ({ storedAmount = 5000, claim = { claimed: true, status: 'confirming' },
  confirm = { ok: true, body: payment }, get = { ok: true, body: payment },
  finalize = { order_id: paidOrderId, order_number: 101 }, validUser = true } = {}) => {
  const calls = [];
  const authClient = { auth: { async getUser() { return { data: { user: validUser ? { id: 'user-1' } : null } }; } } };
  const adminClient = {
    from(table) {
      assert.equal(table, 'order_intents');
      return { select() { return this; }, eq() { return this; }, async maybeSingle() {
        calls.push('read');
        return { data: { id: intentId, user_id: 'user-1', amount: storedAmount, status: 'created',
          payment_key: null, expires_at: '2099-01-01T00:00:00Z' } };
      } };
    },
    async rpc(name, args) {
      calls.push(name);
      assert.equal(args.p_user_id, 'user-1');
      return { data: name === 'claim_order_intent' ? claim : finalize };
    },
  };
  const payments = {
    async confirm(args) { calls.push('confirm'); assert.deepEqual(args, { paymentKey, orderId: intentId, amount: 5000 }); return confirm; },
    async get() { calls.push('get'); return get; },
  };
  return { handler: confirmOrderHandler({ authClient, adminClient, secretKey: 'test_sk_fake', payments }), calls };
};

test('confirms the stored amount and finalizes exactly once', async () => {
  const { handler, calls } = setup();
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.orderId, paidOrderId);
  assert.deepEqual(calls, ['read', 'claim_order_intent', 'confirm', 'finalize_paid_order']);
});

test('rejects a client amount mismatch before claiming or calling Toss', async () => {
  const { handler, calls } = setup();
  const res = response();
  await handler(request({ amount: 1 }), res);
  assert.equal(res.statusCode, 409);
  assert.deepEqual(calls, ['read']);
});

test('rejects unauthenticated requests before reading the intent', async () => {
  const { handler, calls } = setup({ validUser: false });
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(calls, []);
});

test('retries reconcile payment without sending a second Toss confirmation', async () => {
  const { handler, calls } = setup({ claim: { claimed: false, status: 'confirming' } });
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls, ['read', 'claim_order_intent', 'get', 'finalize_paid_order']);
});

test('does not save an unpaid or mismatched payment', async () => {
  for (const result of [
    { ...payment, status: 'WAITING_FOR_DEPOSIT' },
    { ...payment, totalAmount: 1 },
  ]) {
    const { handler, calls } = setup({ confirm: { ok: true, body: result } });
    const res = response();
    await handler(request(), res);
    assert.ok(res.statusCode === 202 || res.statusCode === 409);
    assert.ok(!calls.includes('finalize_paid_order'));
  }
});

test('Toss client sends Basic test secret, stored amount and idempotency key', async () => {
  let sent;
  const payments = tossPayments({ secretKey: 'test_sk_fake', fetchImpl: async (url, options) => {
    sent = { url, options };
    return { ok: true, status: 200, async json() { return payment; } };
  } });
  await payments.confirm({ paymentKey, orderId: intentId, amount: 5000 });
  assert.equal(sent.url, 'https://api.tosspayments.com/v1/payments/confirm');
  assert.equal(sent.options.headers.Authorization, `Basic ${Buffer.from('test_sk_fake:').toString('base64')}`);
  assert.equal(sent.options.headers['Idempotency-Key'], intentId);
  assert.deepEqual(JSON.parse(sent.options.body), { paymentKey, orderId: intentId, amount: 5000 });
  assert.throws(() => tossPayments({ secretKey: 'live_sk_nope' }));
});
