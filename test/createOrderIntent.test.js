const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrderIntentHandler } = require('../src/lib/createOrderIntent');

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const setup = ({ open = true, validToken = true, enabled = true } = {}) => {
  let saved;
  const authClient = {
    auth: { async getUser(token) {
      assert.equal(token, 'user-token');
      return validToken
        ? { data: { user: { id: 'verified-user' } }, error: null }
        : { data: { user: null }, error: new Error('invalid') };
    } },
  };
  const adminClient = {
    from(table) {
      if (table === 'cafes') {
        return {
          select() { return this; }, eq() { return this; },
          async single() { return { data: { id: 'ajou-cafe-3', name: 'CAFÉ ING', is_open: open }, error: null }; },
        };
      }
      assert.equal(table, 'order_intents');
      return {
        insert(record) { saved = record; return this; }, select() { return this; },
        async single() { return { data: { id: saved.id, amount: saved.amount, expires_at: '2026-10-17T07:00:00Z' }, error: null }; },
      };
    },
  };
  return { handler: createOrderIntentHandler({ authClient, adminClient, enabled }), saved: () => saved };
};

const request = () => ({
  headers: { authorization: 'Bearer user-token' },
  body: {
    cafeId: 'ajou-cafe-3', user_id: 'spoofed-user', total_price: 1,
    items: [{
      id: 'ing-5', name: '가짜 메뉴', price: 1, quantity: 2,
      options: { temperature: 'ICE', size: { name: 'Venti', price: 1 }, extra: [{ name: '샷 추가', price: 1 }] },
    }],
  },
});

test('stores a draft for the verified user at the server-calculated price', async () => {
  const { handler, saved } = setup();
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 201);
  assert.equal(saved().user_id, 'verified-user');
  assert.equal(saved().amount, 5000);
  assert.equal(saved().items[0].name, 'ING VENTI 아메리카노');
  assert.equal(saved().items[0].unitPrice, 2500);
  assert.equal(res.body.data.amount, 5000);
  assert.match(res.body.data.orderId, /^[0-9a-f-]{36}$/);
});

test('rejects requests without a valid login before any database write', async () => {
  const missing = setup();
  const noToken = request();
  delete noToken.headers.authorization;
  const res1 = response();
  await missing.handler(noToken, res1);
  assert.equal(res1.statusCode, 401);
  assert.equal(missing.saved(), undefined);

  const invalid = setup({ validToken: false });
  const res2 = response();
  await invalid.handler(request(), res2);
  assert.equal(res2.statusCode, 401);
  assert.equal(invalid.saved(), undefined);
});

test('rejects closed cafes and invalid menu options', async () => {
  const closed = setup({ open: false });
  const res1 = response();
  await closed.handler(request(), res1);
  assert.equal(res1.statusCode, 409);
  assert.equal(closed.saved(), undefined);

  const invalid = setup();
  const req = request();
  req.body.items[0].options.size.name = 'Not sold';
  const res2 = response();
  await invalid.handler(req, res2);
  assert.equal(res2.statusCode, 400);
  assert.equal(invalid.saved(), undefined);
});

test('keeps intent creation disabled unless explicitly enabled', async () => {
  const disabled = setup({ enabled: false });
  const res = response();
  await disabled.handler(request(), res);
  assert.equal(res.statusCode, 503);
  assert.equal(disabled.saved(), undefined);
});
