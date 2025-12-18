const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// OpenAI API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// POST /api/ai/recommend - AI 메뉴 추천
router.post('/recommend', async (req, res) => {
  try {
    const { message, cafeId } = req.body;
    
    // 해당 카페 메뉴 가져오기
    const { data: menus } = await supabase
      .from('menus')
      .select('name, price, category, description')
      .eq('cafe_id', cafeId);
    
    // 메뉴 목록을 텍스트로 변환
    const menuList = menus?.map(m => 
      `- ${m.name} (${m.price}원, ${m.category}): ${m.description || ''}`
    ).join('\n') || '메뉴 정보 없음';
    
    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `너는 아주대학교 카페의 친절한 바리스타야. 
아래 메뉴 목록을 기반으로 고객에게 메뉴를 추천해줘.
짧고 친근하게 답변해줘. 이모지도 사용해!

[카페 메뉴]
${menuList}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });
    
    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || '추천을 생성할 수 없어요 😅';
    
    res.json({ success: true, message: aiMessage });
    
  } catch (error) {
    console.error('AI 추천 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;