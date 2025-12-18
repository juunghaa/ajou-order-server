const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/orders - 전체 주문 조회
router.get('/', async (req, res) => {
  try {
    const { cafe_id, status } = req.query;
    
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (cafe_id) query = query.eq('cafe_id', cafe_id);
    if (status) query = query.eq('status', status);
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/orders/:id - 단일 주문 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/orders - 주문 생성
router.post('/', async (req, res) => {
  try {
    const { 
      user_id, 
      cafe_id, 
      cafe_name, 
      items, 
      total_price, 
      note, 
      payment_method,
      order_number 
    } = req.body;
    
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id,
        cafe_id,
        cafe_name,
        items,
        total_price,
        status: 'pending',
        note,
        payment_method,
        order_number,
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/orders/:id/status - 주문 상태 변경
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
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