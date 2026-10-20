# AjouOrder Server

> **현재 상태 (2026-10-20)**: 담당 카페의 영업 상태 관리만 권한 검사와 함께 다시 열었습니다. 새 주문 생성, 관리자 주문 관리, 결제 승인은 계속 중지되어 있습니다.
> 발견한 문제와 남은 한계는 웹 저장소의 [docs/REVIEW.md](https://github.com/juunghaa/ajou-order-web/blob/main/docs/REVIEW.md)에 정리했습니다.
> 권한 제한 SQL 적용 절차는 [마이그레이션 안내](supabase/migrations/README.md)를 참고하세요.

아주대학교 캠퍼스 카페 모바일 주문 서비스의 **백엔드 API 서버**입니다.  
현재 카페·메뉴 조회, 서버 견적 계산, 담당 카페의 영업 상태 관리, AI 메뉴 추천 등을 제공합니다. 주문 생성과 결제 승인은 점검 중입니다.

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
- POST /api/orders/quote: 메뉴 ID·수량·옵션을 Supabase 메뉴 데이터와 대조해 금액을 계산합니다. DB 저장이나 결제는 하지 않습니다.
- 그 밖의 `/api/orders` 경로: 점검 중 503 응답

### 메뉴 (Menus)
- GET /api/menus/:cafeId: 카페별 메뉴·옵션·가격 조회

### 카페 (Cafes)
- GET /api/cafes
- GET /api/cafes/:id
- PATCH /api/cafes/:id/status: 점검 중 503 응답
- PATCH /api/cafes/:id: 점검 중 503 응답

### 관리자 (Admin)
- GET /api/admin/cafes: 로그인한 관리자가 담당하는 카페만 조회
- PATCH /api/admin/cafes/:id/status: 담당 카페의 영업 상태만 변경

관리자 API는 Supabase 로그인 토큰을 서버에서 확인하고, 담당 카페 배정을 다시 검사합니다. 데이터베이스 RLS에서도 배정된 카페에만 `is_open` 변경을 허용합니다. 최초 계정 배정 방법은 [마이그레이션 안내](supabase/migrations/README.md)를 참고하세요. 주문 관리 API와 화면은 계속 닫혀 있습니다.

### 건의사항 (Feedbacks)
- GET /api/feedbacks
- POST /api/feedbacks

### 메뉴 추천 (Recommendations)
- GET /api/recommendations
- POST /api/recommendations

### 🤖 AI 추천 (Groq LLM, `openai/gpt-oss-20b`)
- POST /api/ai/recommend

---

## ⚠️ 알려진 한계

- 건의사항·추천 POST는 입력 검증과 사용자 인증이 없습니다.
- CORS는 전체 허용이고, AI 추천 API에는 인증과 호출 제한이 없습니다.
- 서버는 anon 키로 Supabase에 접근합니다. 접근 제어는 RLS 정책에 의존합니다.
- 주문 생성·결제 승인·관리자 주문 관리는 현재 동작하는 서버 경로에 구현되지 않았습니다.

---

## ⚡ 주요 서버 기능

- 카페·메뉴 조회와 서버 기준 견적 계산
- AI 메뉴 추천 (Groq LLM)

메뉴·기본 가격·옵션 가격의 운영 원천은 Supabase `menus` 테이블입니다. 메뉴 조회와 주문 견적은 모두 이 테이블을 읽으며, 요청에 포함된 가격은 사용하지 않습니다. `src/data/menuCatalog.json`은 최초 데이터 이관의 원본과 회귀 테스트 자료로만 보관합니다. 기존 85종을 카페별로 복제한 219행의 이관 SQL은 [마이그레이션 안내](supabase/migrations/README.md)에 설명되어 있습니다. 데이터베이스 이관 후 이 서버 버전을 배포해야 합니다.

---

## 🛠️ 기술 스택

- Node.js
- Express.js
- Supabase (PostgreSQL)
- Groq API (`openai/gpt-oss-20b`)
- CORS

---

## 📦 배포

- Render (Backend API)
