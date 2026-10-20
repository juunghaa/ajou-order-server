const { getMenuCatalog } = require('./menuCatalog');

class QuoteError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QuoteError';
  }
}

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const selectedName = (value) =>
  typeof value === 'string' ? value : isPlainObject(value) ? value.name : null;

const normalizeOptions = (menu, submittedOptions) => {
  if (!isPlainObject(submittedOptions)) throw new QuoteError('메뉴 옵션이 올바르지 않습니다.');

  const allowed = menu.options || {};
  if (Object.keys(submittedOptions).some((key) => !['temperature', 'size', 'extra'].includes(key))) {
    throw new QuoteError('지원하지 않는 메뉴 옵션이 있습니다.');
  }

  const options = {};
  let extraPrice = 0;

  if (allowed.temperature) {
    if (!allowed.temperature.includes(submittedOptions.temperature)) {
      throw new QuoteError('선택한 온도를 사용할 수 없습니다.');
    }
    options.temperature = submittedOptions.temperature;
  } else if (submittedOptions.temperature !== undefined) {
    throw new QuoteError('이 메뉴에는 온도 옵션이 없습니다.');
  }

  if (allowed.size) {
    const size = allowed.size.find((option) => option.name === selectedName(submittedOptions.size));
    if (!size) throw new QuoteError('선택한 크기를 사용할 수 없습니다.');
    options.size = size;
    extraPrice += size.price;
  } else if (submittedOptions.size !== undefined) {
    throw new QuoteError('이 메뉴에는 크기 옵션이 없습니다.');
  }

  const extras = submittedOptions.extra || [];
  if (!Array.isArray(extras) || (!allowed.extra && extras.length)) {
    throw new QuoteError('추가 옵션이 올바르지 않습니다.');
  }
  const names = extras.map(selectedName);
  if (new Set(names).size !== names.length) throw new QuoteError('중복된 추가 옵션이 있습니다.');
  if (extras.length) {
    options.extra = names.map((name) => {
      const extra = allowed.extra.find((option) => option.name === name);
      if (!extra) throw new QuoteError('선택한 추가 옵션을 사용할 수 없습니다.');
      extraPrice += extra.price;
      return extra;
    });
  }

  return { options, extraPrice };
};

const quoteCart = async ({ cafeId, items } = {}, catalogLoader = getMenuCatalog) => {
  const cafe = await catalogLoader(cafeId);
  if (!cafe) throw new QuoteError('존재하지 않는 카페입니다.');
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
    throw new QuoteError('메뉴는 1~30종류까지 선택할 수 있습니다.');
  }

  let totalItems = 0;
  let totalPrice = 0;
  const quotedItems = items.map((item) => {
    if (!isPlainObject(item) || typeof item.id !== 'string') {
      throw new QuoteError('메뉴 정보가 올바르지 않습니다.');
    }
    const menu = cafe.menus.find((candidate) => candidate.id === item.id);
    if (!menu) throw new QuoteError('해당 카페에 없는 메뉴입니다.');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      throw new QuoteError('메뉴 수량은 1~20개여야 합니다.');
    }

    const { options, extraPrice } = normalizeOptions(menu, item.options || {});
    const unitPrice = menu.price + extraPrice;
    const lineTotal = unitPrice * item.quantity;
    totalItems += item.quantity;
    totalPrice += lineTotal;

    return { id: menu.id, name: menu.name, quantity: item.quantity, options, unitPrice, lineTotal };
  });

  if (totalItems > 50 || !Number.isSafeInteger(totalPrice) || totalPrice <= 0) {
    throw new QuoteError('주문 금액 또는 총 수량이 올바르지 않습니다.');
  }

  return { cafeId: cafe.cafeId, cafeName: cafe.cafeName, items: quotedItems, totalItems, totalPrice };
};

module.exports = { quoteCart, QuoteError };
