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

    // 메뉴 목록 텍스트 생성
    const menuList = menus?.slice(0, 30).join('\n- ') || '메뉴 정보 없음';

    // 프롬프트 구성
    const prompt = `너는 아주대학교 ${cafeName || '카페'}의 친절한 바리스타야.
아래 메뉴 목록을 기반으로 고객에게 메뉴를 추천해줘.
짧고 친근하게 2-3문장으로 답변해줘. 이모지도 사용해!

[카페 메뉴]
- ${menuList}

[고객 질문]
${message}`;

    // --- GoogleGenerativeAI SDK 사용 시작 ---
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // 모델 선택 (gemini-1.5-flash 사용)
    // 뒤에 -001 을 붙여주세요
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiMessage = response.text();
    // --- SDK 사용 끝 ---

    console.log('🤖 Gemini 응답 성공');
    res.json({ success: true, message: aiMessage });
    
  } catch (error) {
    console.error('❌ AI 에러:', error);
    // 에러 메시지를 좀 더 명확하게 클라이언트에 전달
    res.json({ success: false, message: `죄송해요, 추천에 실패했어요. (${error.message})` });
  }
});

module.exports = router;