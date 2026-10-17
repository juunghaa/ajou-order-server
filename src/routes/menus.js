const express = require('express');
const { getMenuCatalog } = require('../lib/menuCatalog');

const router = express.Router();

router.get('/:cafeId', (req, res) => {
  const catalog = getMenuCatalog(req.params.cafeId);
  if (!catalog) return res.status(404).json({ success: false, error: '카페를 찾을 수 없습니다.' });
  return res.json({ success: true, data: catalog });
});

module.exports = router;
