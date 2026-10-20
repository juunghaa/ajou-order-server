const express = require('express');
const { getMenuCatalog } = require('../lib/menuCatalog');

const router = express.Router();

router.get('/:cafeId', async (req, res) => {
  try {
    const catalog = await getMenuCatalog(req.params.cafeId);
    if (!catalog) return res.status(404).json({ success: false, error: '카페를 찾을 수 없습니다.' });
    return res.json({ success: true, data: catalog });
  } catch (_error) {
    return res.status(500).json({ success: false, error: '메뉴 목록을 불러오지 못했습니다.' });
  }
});

module.exports = router;
