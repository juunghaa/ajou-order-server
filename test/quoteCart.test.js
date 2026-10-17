const test = require('node:test');
const assert = require('node:assert/strict');
const { quoteCart, QuoteError } = require('../src/lib/quoteCart');
const { getMenuCatalog } = require('../src/lib/menuCatalog');

test('catalog prices and menu ids are valid within each cafe', () => {
  for (const cafeId of ['ajou-cafe-1', 'ajou-cafe-2', 'ajou-cafe-3', 'ajou-cafe-4']) {
    const catalog = getMenuCatalog(cafeId);
    assert.ok(catalog.menus.length > 0);
    assert.equal(new Set(catalog.menus.map((menu) => menu.id)).size, catalog.menus.length);
    for (const menu of catalog.menus) {
      assert.ok(Number.isSafeInteger(menu.price) && menu.price > 0);
      for (const option of [...(menu.options?.size || []), ...(menu.options?.extra || [])]) {
        assert.ok(Number.isSafeInteger(option.price) && option.price >= 0);
      }
    }
  }
});

test('every displayed menu can be quoted at its base price', () => {
  for (const cafeId of ['ajou-cafe-1', 'ajou-cafe-2', 'ajou-cafe-3', 'ajou-cafe-4']) {
    for (const menu of getMenuCatalog(cafeId).menus) {
      const options = {};
      if (menu.options?.temperature) options.temperature = menu.options.temperature[0];
      if (menu.options?.size) options.size = menu.options.size[0];
      const quote = quoteCart({ cafeId, items: [{ id: menu.id, quantity: 1, options }] });
      assert.equal(quote.totalPrice, menu.price + (options.size?.price || 0), `${cafeId}/${menu.id}`);
    }
  }
});

test('recalculates price from the server catalog despite client price tampering', () => {
  const quote = quoteCart({
    cafeId: 'ajou-cafe-3',
    items: [{
      id: 'ing-5', name: '가짜 이름', price: 1, quantity: 2,
      options: {
        temperature: 'ICE',
        size: { name: 'Venti', price: -5000 },
        extra: [{ name: '샷 추가', price: -5000 }],
      },
    }],
  });
  assert.equal(quote.totalPrice, 5000);
  assert.equal(quote.items[0].unitPrice, 2500);
  assert.equal(quote.items[0].name, 'ING VENTI 아메리카노');
});

test('rejects nonexistent menus, invalid options, duplicates and quantities', () => {
  const base = { cafeId: 'ajou-cafe-3', items: [{ id: 'ing-5', quantity: 1, options: { temperature: 'ICE', size: { name: 'Regular' } } }] };
  for (const items of [
    [{ id: 'pan-1', quantity: 1 }],
    [{ id: 'ing-5', quantity: 0 }],
    [{ id: 'ing-5', quantity: 1, options: { temperature: 'HOT', size: { name: 'Fake' } } }],
    [{ id: 'ing-5', quantity: 1, options: { temperature: 'ICE', size: { name: 'Regular' }, extra: ['샷 추가', '샷 추가'] } }],
  ]) {
    assert.throws(() => quoteCart({ ...base, items }), QuoteError);
  }
});

test('route handlers quote, list menus and keep order writes paused', () => {
  const ordersRouter = require('../src/routes/orders');
  const menusRouter = require('../src/routes/menus');
  const handler = (router, path) => router.stack.find((layer) => layer.route?.path === path).route.stack[0].handle;
  const response = () => ({
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  });

  const catalog = response();
  handler(menusRouter, '/:cafeId')({ params: { cafeId: 'ajou-cafe-3' } }, catalog);
  assert.equal(catalog.body.data.menus.length, 18);

  const quote = response();
  handler(ordersRouter, '/quote')({ body: { cafeId: 'ajou-cafe-3', items: [{ id: 'ing-8', quantity: 1, options: { temperature: 'ICE' } }] } }, quote);
  assert.equal(quote.body.data.totalPrice, 2700);

  const blocked = response();
  const pauseHandler = ordersRouter.stack.find((layer) => !layer.route).handle;
  pauseHandler({}, blocked);
  assert.equal(blocked.statusCode, 503);
});
