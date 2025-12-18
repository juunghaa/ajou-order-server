const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/recommendations - 메뉴 추천 조회
router.get('/', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const { data, error } = await supabase
      .from('menu_recommendations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/recommendations - 메뉴 추천 작성
router.post('/', async (req, res) => {
  try {
    const { user_id, menu_name } = req.body;
    
    const { data, error } = await supabase
      .from('menu_recommendations')
      .insert({ user_id, menu_name, votes: 1 })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
