const test = require('node:test');
const assert = require('node:assert/strict');
const { createAdminRouter } = require('../src/routes/admin');

const cafes = [
  { id: 'ajou-cafe-1', name: '첫 카페', is_open: true },
  { id: 'ajou-cafe-2', name: '둘째 카페', is_open: false },
];

const fakeDb = (assignedIds) => ({
  from(table) {
    let filters = {};
    let includedIds = null;
    let update = null;
    const query = {
      select() { return this; },
      eq(column, value) { filters[column] = value; return this; },
      in(_column, values) { includedIds = values; return this; },
      update(values) { update = values; return this; },
      async order() {
        assert.equal(table, 'cafes');
        return { data: cafes.filter((cafe) => includedIds.includes(cafe.id)), error: null };
      },
      async maybeSingle() {
        if (table === 'admin_cafe_access') {
          const id = filters.cafe_id;
          return { data: assignedIds.includes(id) ? { cafe_id: id } : null, error: null };
        }
        const cafe = cafes.find((item) => item.id === filters.id && assignedIds.includes(item.id));
        if (cafe && update) Object.assign(cafe, update);
        return { data: cafe || null, error: null };
      },
      then(resolve, reject) {
        assert.equal(table, 'admin_cafe_access');
        return Promise.resolve({ data: assignedIds.map((cafeId) => ({ cafe_id: cafeId })), error: null }).then(resolve, reject);
      },
    };
    return query;
  },
});

test('admin API denies visitors and unassigned users, and scopes listing and updates', async () => {
  const router = createAdminRouter({
    verifyUser: async (token) => ['valid', 'unassigned'].includes(token)
      ? { data: { user: { id: 'manager-id' } }, error: null }
      : { data: { user: null }, error: new Error('invalid') },
    clientForToken: (token) => fakeDb(token === 'valid' ? ['ajou-cafe-1'] : []),
  });
  const auth = router.stack.find((layer) => !layer.route).handle;
  const getCafes = router.stack.find((layer) => layer.route?.path === '/cafes').route.stack[0].handle;
  const patchStatus = router.stack.find((layer) => layer.route?.path === '/cafes/:id/status').route.stack[0].handle;
  const request = async (handler, token, params = {}, body = {}) => {
    const req = { params, body, get: () => token ? `Bearer ${token}` : undefined };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
    };
    let authenticated = false;
    await auth(req, res, () => { authenticated = true; });
    if (authenticated) await handler(req, res);
    return { status: res.statusCode, body: res.body };
  };
  assert.equal((await request(getCafes)).status, 401);
  assert.equal((await request(getCafes, 'invalid')).status, 401);
  assert.equal((await request(getCafes, 'unassigned')).status, 403);
  const listing = await request(getCafes, 'valid');
  assert.equal(listing.status, 200);
  assert.deepEqual(listing.body.data.map((cafe) => cafe.id), ['ajou-cafe-1']);
  const patch = (id, isOpen) => request(patchStatus, 'valid', { id }, { isOpen });
  assert.equal((await patch('ajou-cafe-2', true)).status, 403);
  assert.equal(cafes[1].is_open, false);
  assert.equal((await patch('ajou-cafe-1', 'yes')).status, 400);
  const updated = await patch('ajou-cafe-1', false);
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.is_open, false);
});

