const catalog = require('../data/menuCatalog.json');

const cafes = {
  'ajou-cafe-1': { source: catalog.PANDOROSY_MENUS, name: '팬도로시 학생회관점' },
  'ajou-cafe-2': { source: catalog.PANDOROSY_MENUS, name: '팬도로시 도서관점' },
  'ajou-cafe-3': { source: catalog.CAFE_ING_MENUS, name: 'CAFÉ ING' },
  'ajou-cafe-4': { source: catalog.PANDOROSY_MENUS, name: '다산관 카페' },
};

const getMenuCatalog = (cafeId) => {
  const cafe = cafes[cafeId];
  if (!cafe) return null;

  return {
    cafeId,
    cafeName: cafe.name,
    categories: cafe.source.categories,
    menus: cafe.source.menus,
  };
};

module.exports = { getMenuCatalog };
