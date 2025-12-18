const express = require('express');
const router = express.Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL; // 선택적으로 모델 오버라이드
const DEFAULT_MODELS = [
  "gemini-1.5-flash-latest", // 최신 1.5 Flash (권장)
  "gemini-1.5-flash",
  "gemini-pro" // 1.5가 안 열릴 때 백업용
];

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
      const modelCandidates = GEMINI_MODEL
        ? [GEMINI_MODEL, ...DEFAULT_MODELS.filter(m => m !== GEMINI_MODEL)]
        : DEFAULT_MODELS;

      let aiMessage = null;
      let usedModel = null;
      let lastError = null;

      for (const modelName of modelCandidates) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          aiMessage = result.response.text();
          usedModel = modelName;
          break;
        } catch (err) {
          lastError = err;
          // 모델이 없거나 generateContent 미지원이면 다음 후보 시도
          const errMsg = err?.message || '';
          if (errMsg.includes('not found') || errMsg.includes('not supported')) {
            console.warn(`⚠️ 모델 ${modelName} 사용 불가, 다음 모델로 시도합니다.`);
            continue;
          }
          throw err; // 기타 오류는 즉시 중단
        }
      }

      if (!aiMessage) {
        throw lastError || new Error('사용 가능한 Gemini 모델을 찾지 못했습니다.');
      }
  
      console.log(`🤖 Gemini 응답 성공 (model: ${usedModel})`);
      res.json({ success: true, message: aiMessage, model: usedModel });
      
    } catch (error) {
      console.error('❌ AI 에러:', error);
      res.json({ 
        success: false, 
        message: `설정 문제: ${error.message}. 키가 gemini-1.5에 접근 가능한지 확인하거나 GEMINI_MODEL=gemini-pro로 설정해보세요.` 
      });
    }
  });

module.exports = router;
