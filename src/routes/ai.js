const express = require('express');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

router.post('/recommend', async (req, res) => {
  try {
    const { message, cafeName, menus } = req.body;
    
    console.log('🔑 Gemini Key:', GEMINI_API_KEY ? '설정됨' : '❌ 없음');
    
    if (!GEMINI_API_KEY) {
      return res.json({ 
        success: false, 
        message: 'AI API 키가 설정되지 않았어요 🔑' 
      });
    }
    
    const menuList = menus?.slice(0, 30).join('\n- ') || '메뉴 정보 없음';
    
    const prompt = `너는 아주대학교 ${cafeName || '카페'}의 친절한 바리스타야.
아래 메뉴 목록을 기반으로 고객에게 메뉴를 추천해줘.
짧고 친근하게 2-3문장으로 답변해줘. 이모지도 사용해!

[카페 메뉴]
- ${menuList}

[고객 질문]
${message}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 300,
          }
        }),
      }
    );
    
    const data = await response.json();
    console.log('🤖 Gemini 응답:', data.error ? data.error : '성공');
    
    if (data.error) {
      return res.json({ 
        success: false, 
        message: `API 오류: ${data.error.message}` 
      });
    }
    
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text 
      || '추천을 생성할 수 없어요 😅';
    
    res.json({ success: true, message: aiMessage });
    
  } catch (error) {
    console.error('❌ AI 에러:', error);
    res.status(500).json({ success: false, message: `서버 오류: ${error.message}` });
  }
});

module.exports = router;