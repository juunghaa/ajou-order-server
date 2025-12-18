const express = require('express');
const router = express.Router();

router.post('/recommend', async (req, res) => {
  try {
    const { message, cafeName, menus } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      return res.json({ success: false, message: 'API 키가 없어요 🔑' });
    }
    
    const menuList = menus?.slice(0, 30).join('\n- ') || '메뉴 없음';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `너는 ${cafeName || '카페'} 바리스타야. 메뉴 추천해줘. 2-3문장, 이모지!\n\n[메뉴]\n- ${menuList}`
          },
          { role: 'user', content: message }
        ],
        max_tokens: 200
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      return res.json({ success: false, message: `오류: ${data.error.message}` });
    }
    
    const aiMessage = data.choices?.[0]?.message?.content || '추천 실패 😅';
    res.json({ success: true, message: aiMessage });
    
  } catch (error) {
    res.json({ success: false, message: `오류: ${error.message}` });
  }
});

module.exports = router;