# AjouOrder Server

아주대학교 캠퍼스 카페 모바일 주문 서비스 백엔드 API

## 🔗 프로젝트 링크

| 구분 | 설명 | 주소 |
|------|------|------|
| Web Client | React 기반 프론트엔드 | https://github.com/juunghaa/ajou-order-web |
| Server API | 주문/메뉴 REST API | https://github.com/juunghaa/ajou-order-server |
| Live Demo (FE) | 실제 서비스 화면 | https://ajou-order-web.vercel.app |
| Live API (BE) | 배포된 백엔드 서버 | https://ajou-order-server.onrender.com |

## 🚀 실행 방법
```bash
npm install
npm run dev
```

## 📌 API 엔드포인트

### 주문 (Orders)
- `GET /api/orders` - 전체 주문 조회
- `GET /api/orders/:id` - 단일 주문 조회
- `GET /api/orders/user/:userId` - 사용자별 주문 내역
- `POST /api/orders` - 주문 생성
- `PATCH /api/orders/:id/status` - 주문 상태 변경
- `GET /api/orders/cafe/:cafeId/next-number` - 다음 주문번호 조회

### 카페 (Cafes)
- `GET /api/cafes` - 전체 카페 조회
- `GET /api/cafes/:id` - 단일 카페 조회
- `PATCH /api/cafes/:id/status` - 영업 상태 변경
- `PATCH /api/cafes/:id` - 카페 정보 수정

### 건의사항 (Feedbacks)
- `GET /api/feedbacks` - 전체 건의사항 조회
- `POST /api/feedbacks` - 건의사항 작성
- `PATCH /api/feedbacks/:id/status` - 상태 변경

### 메뉴 추천 (Recommendations)
- `GET /api/recommendations` - 추천 메뉴 조회
- `POST /api/recommendations` - 메뉴 추천 작성
- `PATCH /api/recommendations/:id/vote` - 추천 투표

## 🛠️ 기술 스택
- Node.js + Express.js
- Supabase (PostgreSQL)
- CORS

## 📦 배포
- Render / Railway
