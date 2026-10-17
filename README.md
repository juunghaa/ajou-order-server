# AjouOrder Server

> 보안 점검 중 새 주문과 관리자 수정 API는 일시 중지합니다.
> `supabase/migrations/20261016_restrict_public_access.sql` 적용 전후 절차는
> [마이그레이션 안내](supabase/migrations/README.md)를 확인하세요.

아주대학교 캠퍼스 카페 모바일 주문 서비스의 **백엔드 API 서버**입니다.  
현재 카페·메뉴 조회, 서버 견적 계산, AI 메뉴 추천 등을 제공합니다. 주문 생성과 결제 승인은 점검 중입니다.

---

## 🔗 프로젝트 링크

| 구분 | 설명 | 주소 |
|------|------|------|
| Web Client | React 기반 프론트엔드 | https://github.com/juunghaa/ajou-order-web |
| Server API | 주문/메뉴 REST API | https://github.com/juunghaa/ajou-order-server |
| Live Demo (FE) | 실제 서비스 화면 | https://ajou-order-web.vercel.app |
| Live API (BE) | 배포된 백엔드 서버 | https://ajou-order-server.onrender.com |

> Render 환경 특성상 서버는 첫 요청 시 응답이 지연될 수 있습니다 (Cold Start).

---

## 🚀 실행 방법

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env` 파일을 생성하고 아래 값을 설정합니다.

```env
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
GROQ_API_KEY=YOUR_GROQ_API_KEY
```

### 3. 실행
```bash
npm run dev
```

---

## 📌 API 엔드포인트

### 주문 (Orders)
- POST /api/orders/quote: 메뉴 ID·수량·옵션을 서버 목록과 대조해 금액을 계산합니다. DB 저장이나 결제는 하지 않습니다.
- 그 밖의 `/api/orders` 경로: 점검 중 503 응답

### 메뉴 (Menus)
- GET /api/menus/:cafeId: 카페별 메뉴·옵션·가격 조회

### 카페 (Cafes)
- GET /api/cafes
- GET /api/cafes/:id
- PATCH /api/cafes/:id/status: 점검 중 503 응답
- PATCH /api/cafes/:id: 점검 중 503 응답

### 건의사항 (Feedbacks)
- GET /api/feedbacks
- POST /api/feedbacks
- PATCH /api/feedbacks/:id/status

### 메뉴 추천 (Recommendations)
- GET /api/recommendations
- POST /api/recommendations
- PATCH /api/recommendations/:id/vote

### 🤖 AI 추천 (Groq LLM)
- POST /api/ai/recommend

---

## ⚡ 주요 서버 기능

- 카페·메뉴 조회와 서버 기준 견적 계산
- AI 메뉴 추천 (Groq LLM)

`src/data/menuCatalog.json`은 웹 저장소의 `src/data/menuData.js` 메뉴 85종을 복사한 점검용 스냅샷입니다. 서버는 요청에 포함된 이름·가격·옵션 가격을 신뢰하지 않고 이 목록에서 다시 계산합니다. 운영 DB의 `menus` 테이블은 현재 비어 있으므로, 결제를 다시 열기 전에 메뉴의 실제 가격과 두 저장소의 동기화 방법을 확정해야 합니다.

---

## 🛠️ 기술 스택

- Node.js
- Express.js
- Supabase (PostgreSQL, Realtime)
- Supabase Auth
- 토스페이먼츠 SDK
- Groq API (Llama 3.1)
- CORS

---

## 📦 배포

- Render (Backend API)
