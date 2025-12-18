const express = require('express');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const { GoogleGenerativeAI } = require("@google/generative-ai");

// 라우터 핸들러 내부
router.post('/recommend', async (req, res) => {
    try {
      const { message, cafeName, menus } = req.body;
  
      if (!GEMINI_API_KEY) {
        return res.json({ success: false, message: 'AI API 키가 없습니다 🔑' });
      }
  
      const menuList = menus?.slice(0, 30).join('\n- ') || '메뉴 정보 없음';
      const prompt = `너는 아주대학교 ${cafeName || '카페'}의 친절한 바리스타야.
  아래 메뉴 목록을 기반으로 고객에게 메뉴를 추천해줘.
  짧고 친근하게 2-3문장으로 답변해줘. 이모지도 사용해!
  
  [카페 메뉴]
  - ${menuList}
  
  [고객 질문]
  ${message}`;
  
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      
      // 이 모델명은 무조건 됩니다 (새 프로젝트 키라면)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiMessage = response.text();
  
      console.log('🤖 Gemini 응답 성공');
      res.json({ success: true, message: aiMessage });
      
    } catch (error) {
      console.error('❌ AI 에러:', error);
      res.json({ success: false, message: `설정 문제: ${error.message}` });
    }
  });

module.exports = router;