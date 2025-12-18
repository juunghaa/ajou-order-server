const express = require('express');
const router = express.Router();

router.post('/recommend', async (req, res) => {
  try {
    const { message, cafeName, menus } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return res.json({ success: false, message: 'API 키가 없어요 🔑' });
    }
    
    const menuList = menus?.slice(0, 30).join('\n- ') || '메뉴 없음';
    const prompt = `너는 ${cafeName || '카페'} 바리스타야. 메뉴 추천해줘. 2-3문장, 이모지!

[메뉴]
- ${menuList}

[질문] ${message}`;

    // ✅ v1 API + gemini-1.5-flash 사용
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    
    const data = await response.json();
    console.log('🤖 Gemini:', JSON.stringify(data).substring(0, 200));
    
    if (data.error) {
      return res.json({ success: false, message: `오류: ${data.error.message}` });
    }
    
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || '추천 실패 😅';
    res.json({ success: true, message: aiMessage });
    
  } catch (error) {
    console.error('❌:', error.message);
    res.json({ success: false, message: `오류: ${error.message}` });
  }
});

module.exports = router;