const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/feedbacks - 전체 건의사항 조회
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/feedbacks - 건의사항 작성
router.post('/', async (req, res) => {
  try {
    const { user_id, content } = req.body;
    
    const { data, error } = await supabase
      .from('feedbacks')
      .insert({ user_id, content, status: 'pending' })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;