# TaskView FE

업무 목적을 안전한 데이터 View로 컴파일하고 승인하는 Next.js 워크벤치입니다. 브라우저는 BE 주소나 원문 인증 토큰을 직접 알지 않으며, 같은 origin의 Route Handler가 보안 쿠키를 읽어 `TASKVIEW_BE_URL`로 요청을 전달합니다.

## 실행

BE 서버(`localhost:8200`)를 먼저 실행한 뒤:

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 상태 확인은 `/api/health`입니다.

## 화면 흐름

1. 회원가입 또는 로그인
2. 자연어 목적과 대상 조직, TTL 입력
3. AI가 제안한 필드·변환 계획과 정책 검사 확인
4. 최소화된 데이터 미리보기 및 최근 View 확인
5. 데이터 소유자·관리자 계정으로 승인/거절
6. 승인 결과와 Evidence Contract 확인

회원가입 계정은 요청자 역할로 자신의 View만 조회할 수 있습니다. 데이터 소유자 계정은 BE 저장소에서 `make create-owner`로 생성합니다. 세션은 JavaScript에서 읽을 수 없는 HttpOnly·SameSite 쿠키이며, 로그인·회원가입·로그아웃 같은 변경 요청은 교차 origin을 거부합니다.
