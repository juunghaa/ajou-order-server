const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

router.post('/recommend', async (req, res) => {
  try {
    const { message, cafeName, menus } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return res.json({ success: false, message: 'API 키가 없어요 🔑' });
    }
    
    const menuList = menus?.slice(0, 30).join('\n- ') || '메뉴 없음';
    const prompt = `너는 ${cafeName || '카페'} 바리스타야. 메뉴를 추천해줘. 2-3문장, 이모지 사용!

[메뉴]
- ${menuList}

[질문] ${message}`;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const aiMessage = result.response.text();
    
    res.json({ success: true, message: aiMessage });
    
  } catch (error) {
    console.error('❌ AI 에러:', error.message);
    res.json({ success: false, message: `오류: ${error.message}` });
  }
});

module.exports = router;