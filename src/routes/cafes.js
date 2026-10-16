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

// PATCH /api/cafes/:id/status - 관리자 인증 전까지 일시 중지
router.patch('/:id/status', (_req, res) => {
  res.status(503).json({ success: false, error: '관리자 기능을 점검하고 있습니다.' });
});

// PATCH /api/cafes/:id - 관리자 인증 전까지 일시 중지
router.patch('/:id', (_req, res) => {
  res.status(503).json({ success: false, error: '관리자 기능을 점검하고 있습니다.' });
});

module.exports = router;
