const test = require('node:test');
const assert = require('node:assert/strict');
const source = require('../src/data/menuCatalog.json');
const { quoteCart, QuoteError } = require('../src/lib/quoteCart');
const { getMenuCatalog } = require('../src/lib/menuCatalog');

const cafeSources = {
  'ajou-cafe-1': source.PANDOROSY_MENUS,
  'ajou-cafe-2': source.PANDOROSY_MENUS,
  'ajou-cafe-3': source.CAFE_ING_MENUS,
  'ajou-cafe-4': source.PANDOROSY_MENUS,
};

const clientFor = (cafeId) => ({
  from(table) {
    if (table === 'cafes') {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() {
          return { data: cafeSources[cafeId] ? { id: cafeId, name: cafeId } : null, error: null };
        },
      };
    }
    assert.equal(table, 'menus');
    return {
      select() { return this; },
      eq() { return this; },
      async order() {
        return {
          data: cafeSources[cafeId].menus.map((menu) => ({
            sku: menu.id,
            name: menu.name,
            name_en: menu.nameEn,
            price: menu.price,
            category: menu.category,
            image_url: menu.imageUrl,
            is_popular: menu.isPopular || false,
            is_new: menu.isNew || false,
            options: menu.options,
          })),
          error: null,
        };
      },
    };
  },
});

const load = (cafeId) => getMenuCatalog(cafeId, clientFor(cafeId));
const quote = (input) => quoteCart(input, load);

test('all 219 cafe menus retain their original prices, options and categories', async () => {
  let count = 0;
  for (const [cafeId, original] of Object.entries(cafeSources)) {
    const catalog = await load(cafeId);
    count += catalog.menus.length;
    assert.deepEqual(catalog.categories, original.categories);
    assert.equal(new Set(catalog.menus.map((menu) => menu.id)).size, catalog.menus.length);
    for (let i = 0; i < original.menus.length; i += 1) {
      const expected = original.menus[i];
      const actual = catalog.menus[i];
      assert.equal(actual.id, expected.id);
      assert.equal(actual.price, expected.price);
      assert.deepEqual(actual.options, expected.options);
      const options = {};
      if (actual.options?.temperature) options.temperature = actual.options.temperature[0];
      if (actual.options?.size) options.size = actual.options.size[0];
      const result = await quote({ cafeId, items: [{ id: actual.id, quantity: 1, options }] });
      assert.equal(result.totalPrice, actual.price + (options.size?.price || 0), `${cafeId}/${actual.id}`);
    }
  }
  assert.equal(count, 219);
});

test('recalculates price despite client price tampering', async () => {
  const result = await quote({
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
  assert.equal(result.totalPrice, 5000);
  assert.equal(result.items[0].unitPrice, 2500);
  assert.equal(result.items[0].name, 'ING VENTI 아메리카노');
});

test('rejects nonexistent menus, invalid options, duplicates and quantities', async () => {
  const base = { cafeId: 'ajou-cafe-3' };
  for (const items of [
    [{ id: 'pan-1', quantity: 1 }],
    [{ id: 'ing-5', quantity: 0 }],
    [{ id: 'ing-5', quantity: 1, options: { temperature: 'HOT', size: { name: 'Fake' } } }],
    [{ id: 'ing-5', quantity: 1, options: { temperature: 'ICE', size: { name: 'Regular' }, extra: ['샷 추가', '샷 추가'] } }],
  ]) {
    await assert.rejects(quote({ ...base, items }), QuoteError);
  }
});

test('unknown cafe and unavailable menu data fail closed', async () => {
  assert.equal(await load('missing'), null);
  await assert.rejects(quote({ cafeId: 'missing', items: [{ id: 'ing-1', quantity: 1 }] }), QuoteError);
  const failingClient = { from: () => ({ select() { return this; }, eq() { return this; }, async maybeSingle() { throw new Error('DB unavailable'); } }) };
  await assert.rejects(getMenuCatalog('ajou-cafe-3', failingClient), /DB unavailable/);
});

test('order writes remain paused', () => {
  const ordersRouter = require('../src/routes/orders');
  const blocked = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  const pauseHandler = ordersRouter.stack.find((layer) => !layer.route).handle;
  pauseHandler({}, blocked);
  assert.equal(blocked.statusCode, 503);
});
