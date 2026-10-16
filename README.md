# AjouOrder Server

> 보안 점검 1단계에서는 주문 API와 카페 수정 API를 일시 중지합니다.
> `supabase/migrations/20261016_restrict_public_access.sql` 적용 전후 절차는
> [마이그레이션 안내](supabase/migrations/README.md)를 확인하세요.

아주대학교 캠퍼스 카페 모바일 주문 서비스의 **백엔드 API 서버**입니다.  
주문 관리, 결제 처리, AI 메뉴 추천, 실시간 상태 업데이트를 담당합니다.

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
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
TOSS_SECRET_KEY=YOUR_TOSS_SECRET_KEY
GROQ_API_KEY=YOUR_GROQ_API_KEY
```

### 3. 실행
```bash
npm run dev
```

---

## 📌 API 엔드포인트

### 주문 (Orders)
- GET /api/orders
- GET /api/orders/:id
- GET /api/orders/user/:userId
- POST /api/orders
- PATCH /api/orders/:id/status
- GET /api/orders/cafe/:cafeId/next-number

### 카페 (Cafes)
- GET /api/cafes
- GET /api/cafes/:id
- PATCH /api/cafes/:id/status
- PATCH /api/cafes/:id

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

- 주문 생성 및 상태 관리
- 카페 영업 상태 및 대기 번호 관리
- 토스페이먼츠 결제 연동
- AI 메뉴 추천 (Groq LLM)
- Supabase Realtime 기반 실시간 주문 상태 업데이트

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
