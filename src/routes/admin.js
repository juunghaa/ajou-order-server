const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const defaultVerifyUser = (token) => require('../config/supabase').auth.getUser(token);
const defaultClientForToken = (token) => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  }
);

const createAdminRouter = ({ verifyUser = defaultVerifyUser, clientForToken = defaultClientForToken } = {}) => {
  const router = express.Router();

  router.use(async (req, res, next) => {
    const token = /^Bearer\s+([^\s]+)$/i.exec(req.get('authorization') || '')?.[1];
    if (!token) return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    try {
      const { data, error } = await verifyUser(token);
      if (error || !data?.user) return res.status(401).json({ success: false, error: '다시 로그인해 주세요.' });
      req.adminUser = data.user;
      req.userDb = clientForToken(token);
      return next();
    } catch (_error) {
      return res.status(503).json({ success: false, error: '로그인을 확인할 수 없습니다.' });
    }
  });

  router.get('/cafes', async (req, res) => {
    try {
      const { data: assignments, error: accessError } = await req.userDb
        .from('admin_cafe_access')
        .select('cafe_id')
        .eq('user_id', req.adminUser.id);
      if (accessError) throw accessError;
      if (!assignments.length) return res.status(403).json({ success: false, error: '관리할 수 있는 카페가 없습니다.' });

      const { data: cafes, error: cafeError } = await req.userDb
        .from('cafes')
        .select('id,name,location,image_url,is_open,wait_time,rating')
        .in('id', assignments.map(({ cafe_id: cafeId }) => cafeId))
        .order('id');
      if (cafeError) throw cafeError;
      return res.json({ success: true, data: cafes });
    } catch (_error) {
      return res.status(500).json({ success: false, error: '관리 카페를 불러오지 못했습니다.' });
    }
  });

  router.patch('/cafes/:id/status', async (req, res) => {
    if (typeof req.body?.isOpen !== 'boolean') {
      return res.status(400).json({ success: false, error: '영업 상태 값이 올바르지 않습니다.' });
    }
    try {
      const { data: assignment, error: accessError } = await req.userDb
        .from('admin_cafe_access')
        .select('cafe_id')
        .eq('user_id', req.adminUser.id)
        .eq('cafe_id', req.params.id)
        .maybeSingle();
      if (accessError) throw accessError;
      if (!assignment) return res.status(403).json({ success: false, error: '이 카페의 관리자 권한이 없습니다.' });

      const { data: cafe, error: updateError } = await req.userDb
        .from('cafes')
        .update({ is_open: req.body.isOpen })
        .eq('id', req.params.id)
        .select('id,name,location,image_url,is_open,wait_time,rating')
        .maybeSingle();
      if (updateError) throw updateError;
      if (!cafe) return res.status(403).json({ success: false, error: '카페 상태를 변경할 수 없습니다.' });
      return res.json({ success: true, data: cafe });
    } catch (_error) {
      return res.status(500).json({ success: false, error: '카페 상태를 변경하지 못했습니다.' });
    }
  });

  return router;
};

module.exports = { createAdminRouter };
