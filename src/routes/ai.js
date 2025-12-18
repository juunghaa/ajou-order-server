const express = require('express');
const router = express.Router();

router.post('/recommend', async (req, res) => {
  try {
    const { message, cafeName, menus } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      return res.json({ success: false, message: 'API 키가 없어요 🔑' });
    }
    
    // ✅ 메뉴 목록을 더 풍부하게 전달
    const menuList = menus?.slice(0, 40).join('\n- ') || '메뉴 없음';

    const systemPrompt = `너는 아주대학교 "${cafeName}" 카페의 친절하고 전문적인 바리스타야.

## 역할
- 고객의 취향과 기분에 맞는 음료를 추천해주는 전문가
- 메뉴에 대한 깊은 이해와 열정을 가진 바리스타

## 규칙
1. 반드시 아래 [카페 메뉴]에 있는 실제 메뉴만 추천해야 해
2. 메뉴 이름과 가격을 정확하게 말해줘
3. 왜 그 메뉴를 추천하는지 이유를 설명해줘
4. 친근하고 따뜻한 말투로 대화해줘
5. 이모지를 적절히 사용해줘
6. 2-3개 메뉴를 추천하고, 각각 왜 좋은지 간단히 설명해줘

## 추천 스타일 예시
"달달한 게 땡기시는군요! ☕✨ 
1. **카라멜 카페라떼** (1,800원) - 달콤한 카라멜과 부드러운 우유가 완벽한 조화를 이뤄요!
2. **바닐라 카페라떼** (1,800원) - 은은한 바닐라 향이 기분을 좋게 해줄 거예요 🌟"

[카페 메뉴]
- ${menuList}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 400,  // ✅ 더 긴 답변 허용
        temperature: 0.7  // ✅ 약간 창의적으로
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
