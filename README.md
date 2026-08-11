# TaskView FE

업무 목적을 안전한 데이터 View로 컴파일하고 승인하는 Next.js 워크벤치입니다. 브라우저는 BE 주소를 직접 알지 않으며, 같은 origin의 Route Handler가 `TASKVIEW_BE_URL`로 요청을 전달합니다.

## 실행

BE 서버(`localhost:8200`)를 먼저 실행한 뒤:

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 상태 확인은 `/api/health`입니다.

## 화면 흐름

1. 자연어 목적과 대상 조직, TTL 입력
2. AI가 제안한 필드·변환 계획과 정책 검사 확인
3. 최소화된 데이터 미리보기 확인
4. 데이터 소유자 승인/거절
5. 승인 결과와 Evidence Contract 확인

