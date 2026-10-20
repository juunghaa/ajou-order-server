const getMenuCatalog = async (cafeId, client = require('../config/supabase')) => {
  const { data: cafe, error: cafeError } = await client
    .from('cafes')
    .select('id, name')
    .eq('id', cafeId)
    .maybeSingle();
  if (cafeError) throw cafeError;
  if (!cafe) return null;

  const { data: rows, error: menuError } = await client
    .from('menus')
    .select('sku, name, name_en, price, category, image_url, is_popular, is_new, options')
    .eq('cafe_id', cafeId)
    .order('sort_order', { ascending: true });
  if (menuError) throw menuError;

  const menus = rows.map((row) => ({
    id: row.sku,
    name: row.name,
    nameEn: row.name_en,
    price: row.price,
    category: row.category,
    imageUrl: row.image_url,
    isPopular: row.is_popular,
    isNew: row.is_new,
    options: row.options,
  }));

  return {
    cafeId: cafe.id,
    cafeName: cafe.name,
    categories: [...new Set(menus.map((menu) => menu.category))],
    menus,
  };
};

module.exports = { getMenuCatalog };
