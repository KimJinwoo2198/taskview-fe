# Needex FE

업무 목적을 안전한 데이터 View로 컴파일하고 승인하는 Next.js 애플리케이션입니다. 브라우저는 BE 주소나 원문 인증 토큰을 직접 알지 않으며, 같은 origin의 Route Handler가 보안 쿠키를 읽어 `TASKVIEW_BE_URL`로 요청을 전달합니다.

UI의 폰트 크기, line-height, 사용 원칙은 [Needex Typography](docs/typography.md)를 따릅니다.

## 실행

BE 서버(`localhost:8200`)를 먼저 실행한 뒤:

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 상태 확인은 `/api/health`입니다.

## 페이지 구조

| 경로 | 역할 |
|---|---|
| `/login` | 로그인·회원가입 |
| `/dashboard` | 상태 요약과 다음 행동 |
| `/taskviews` | 검색·상태 필터가 있는 View 목록 |
| `/taskviews/new` | 목적 → 범위 → 검토의 3단계 생성 흐름 |
| `/taskviews/[id]` | 개요·정책/변환·미리보기·Evidence 상세 |
| `/reviews` | 데이터 소유자·관리자의 승인 대기함 |

## 업무 흐름

1. 회원가입 또는 로그인
2. 3단계 생성 페이지에서 자연어 목적과 대상 조직, TTL 입력
3. AI가 제안한 필드·변환 계획과 정책 검사 확인
4. 상세 페이지에서 최소화된 데이터 미리보기와 정책 결과 확인
5. 데이터 소유자·관리자 계정으로 승인/거절
6. 승인 결과와 Evidence Contract 확인

회원가입 계정은 요청자 역할로 자신의 View만 조회할 수 있습니다. 데이터 소유자 계정은 BE 저장소에서 `make create-owner`로 생성합니다. 세션은 JavaScript에서 읽을 수 없는 HttpOnly·SameSite 쿠키이며, 로그인·회원가입·로그아웃 같은 변경 요청은 교차 origin을 거부합니다.
## 전체 스택 재현

요구 사항은 Node.js 22, Corepack, pnpm 10.17.0, Docker Desktop, Ollama입니다. 먼저 호스트에서 실제 모델을 준비합니다.

```bash
brew install ollama                    # 이미 설치했다면 생략
ollama serve                           # 별도 터미널에서 계속 실행
ollama pull qwen3.5:9b
```

그다음 `taskview-be` 디렉터리에서 전체 스택을 실행합니다.

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

접속 주소는 FE `http://localhost:3000`, BE `http://localhost:8200`, AI `http://localhost:8100`, Mailpit `http://localhost:8025`입니다. 회원가입 검증, 비밀번호 재설정, workspace 초대는 개발 토큰을 켜지 말고 Mailpit에 도착한 실제 링크로 진행합니다.

FE만 호스트에서 실행하려면 서버 전용 `TASKVIEW_BE_URL`을 지정합니다. 이 값은 브라우저에 공개되지 않습니다.

```bash
corepack enable
pnpm install --frozen-lockfile
TASKVIEW_BE_URL=http://127.0.0.1:8200 pnpm dev
```

## 데이터와 demo mode 경계

`NEXT_PUBLIC_TASKVIEW_DEMO_MODE`의 기본값은 `false`입니다. API 오류, 권한 없음, 빈 결과일 때 fixture를 실제 데이터처럼 대신 표시하지 않습니다. 디자인 확인용 fixture가 꼭 필요할 때만 `NEXT_PUBLIC_TASKVIEW_DEMO_MODE=true`로 명시적으로 실행하세요.

공식 FCC·NYC 311·NHTSA 예시로 만든 Task View는 PostgreSQL 안전 스냅샷을 집계한 `data_origin="public_live"`를 반환합니다. `synthetic_demo`는 기존 호환 계획 또는 명시적 테스트/demo fallback에만 남아 있으며 화면에서 **“합성 데모 데이터 · 운영 원본 아님”**으로 구분됩니다. 조직이 직접 연결한 임의 warehouse의 raw row materialization은 아직 구현 범위 밖입니다.

## 운영 필수 설정

- `TASKVIEW_BE_URL`: FE 서버에서 접근 가능한 운영 BE 내부 URL로 변경합니다.
- `NEXT_PUBLIC_TASKVIEW_DEMO_MODE=false`: 운영 빌드에서 명시적으로 유지합니다. `NEXT_PUBLIC_` 값은 빌드 시 고정됩니다.
- `NODE_ENV=production`과 HTTPS를 사용해 세션 쿠키의 `Secure` 속성이 활성화되도록 합니다.
- 브라우저에는 BE URL이나 세션 원문을 노출하지 않고 동일 origin Route Handler/BFF를 유지합니다.

## 검증

```bash
pnpm typecheck
pnpm build
git diff --check
```

실행 중인 Compose 네트워크에서 실제 Mailpit/Ollama E2E와 화면 matrix를 재현하려면 `taskview-fe` 디렉터리에서 실행합니다.

```bash
DOCKER_HOST=unix:///Users/kimjinwoo/.docker/run/docker.sock docker run --rm \
  --network taskview-be_default \
  -v "$PWD:/work" \
  -v taskview-e2e-node-modules:/work/node_modules \
  -w /work \
  mcr.microsoft.com/playwright:v1.55.0-noble \
  bash -lc 'apt-get update -qq && apt-get install -y -qq postgresql-client >/dev/null && corepack enable && corepack prepare pnpm@10.17.0 --activate && pnpm install --frozen-lockfile && pnpm e2e:full-story && pnpm e2e:visual-matrix'
```

Playwright 산출물은 `output/verification/`에 저장됩니다. 테스트는 임시 workspace/user를 만들므로 완료 후 식별자를 확인한 데이터만 정리해야 하며 전체 DB 초기화나 wildcard 삭제는 사용하지 않습니다.

## 의도적으로 준비 중인 기능

다음 UI는 API 계약이 없어 비활성화하거나 “준비 중”으로 표시합니다: Audit 기간 필터/CSV 내보내기, Evidence의 상세 lineage·정책 판정, data source 재스캔·사용 내역, workspace 나가기·삭제. API 오류 시 이 영역에 fixture를 자동 대입하지 않습니다.

## 독립 Docker 배포

이 저장소는 FE만 독립적으로 배포합니다. 브라우저는 동일 origin BFF를 사용하며, FE 컨테이너가 별도 BE 서버에 연결합니다.

```bash
cp .env.deploy.example .env.deploy
# TASKVIEW_BE_URL을 배포된 BE의 HTTPS 주소로 변경
./scripts/deploy.sh
```

`TASKVIEW_BE_URL`은 서버 전용 환경변수라 브라우저 번들에 포함되지 않습니다. 운영에서는 FE 앞에 HTTPS reverse proxy를 두고, BE의 `TASKVIEW_PUBLIC_WEB_URL`과 `TASKVIEW_CORS_ORIGINS`를 이 FE 주소로 맞추세요.
