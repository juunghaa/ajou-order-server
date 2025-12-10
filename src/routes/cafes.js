const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/cafes - 전체 카페 조회
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .order('id');
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/cafes/:id - 단일 카페 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/cafes/:id/status - 카페 영업 상태 변경
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_open } = req.body;
    
    const { data, error } = await supabase
      .from('cafes')
      .update({ 
        is_open,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/cafes/:id - 카페 정보 수정
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { wait_time, rating } = req.body;
    
    const updateData = { updated_at: new Date().toISOString() };
    if (wait_time !== undefined) updateData.wait_time = wait_time;
    if (rating !== undefined) updateData.rating = rating;
    
    const { data, error } = await supabase
      .from('cafes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;