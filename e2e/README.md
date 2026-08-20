# Needex production-like E2E

이 suite는 데모 토큰을 사용하지 않습니다. Mailpit에서 실제 이메일 인증·워크스페이스 초대 링크를 찾아 사용자 3명(requester, data owner, admin)을 만들고, 로컬 Qwen 계획 → 제출 → 분리된 owner 승인 → data/analytics까지 실행합니다.

## 전제

- `taskview-be/compose.yaml`의 `postgres`, `mailpit`, `ai`, `be`, `fe`가 최신 소스로 다시 빌드되어 있어야 합니다.
- Ollama에 `qwen3.5:9b`가 설치되어 있고 compose의 `ai`가 `host.docker.internal:11434`에 접근할 수 있어야 합니다.
- BE는 `TASKVIEW_EXPOSE_DEV_TOKENS=false`, SMTP host `mailpit`으로 실행해야 합니다.
- Playwright runner는 compose와 같은 Docker network에서 `http://fe:3000`, `http://be:8200`, `http://mailpit:8025`에 접근해야 합니다.

프로덕션 FE는 `Secure` 세션 쿠키를 만듭니다. 격리된 Docker 내부망의 `http://fe:3000`은 TLS가 아니므로 test harness가 BFF의 HttpOnly/SameSite 속성과 토큰 비노출을 검증한 뒤 같은 opaque 세션 값을 해당 내부망에만 non-Secure transport cookie로 미러링합니다. 애플리케이션 코드와 운영 쿠키 정책은 변경하지 않습니다.

## 실행

BE compose project의 network 이름을 먼저 확인합니다.

```bash
cd ../taskview-be
docker compose up -d --build postgres mailpit ai be fe
docker compose ps
```

FE에서 전체 여정을 실행합니다. 공식 Playwright image의 버전은 `package.json`의 `@playwright/test`와 같아야 합니다.

```bash
cd ../taskview-fe
docker run --rm \
  --network taskview-be_default \
  -v "$PWD:/work" \
  -w /work \
  -e TASKVIEW_E2E_PREFIX="release-20260819" \
  mcr.microsoft.com/playwright:v1.55.0-noble \
  bash -lc 'corepack enable && pnpm install --frozen-lockfile && pnpm e2e:full-story'
```

성공하면 `output/verification/state/latest.json`과 역할별 storage state가 생깁니다. 이 파일에는 유효한 HttpOnly 세션 값이 포함되므로 `output/`은 gitignore 상태를 유지하고 외부로 공유하지 마세요.

같은 컨테이너 mount/network에서 30개 화면 시각 매트릭스를 별도로 실행합니다.

```bash
docker run --rm \
  --network taskview-be_default \
  -v "$PWD:/work" \
  -w /work \
  mcr.microsoft.com/playwright:v1.55.0-noble \
  bash -lc 'corepack enable && pnpm install --frozen-lockfile && pnpm e2e:visual-matrix'
```

결과:

- 전체 여정 단계: `output/verification/full-story/<prefix>/`
- 30개 Figma 라우트: `output/verification/screens/01-*.png` … `30-*.png`
- trace/video/failure artifacts: `output/verification/playwright-artifacts/`
- HTML report: `output/verification/report/`

## 정리

시각 매트릭스 검증이 끝난 뒤 manifest의 `prefix`로 테스트 워크스페이스·사용자·Task View를 함께 삭제합니다.

```bash
./e2e/cleanup.sh release-20260819
```

스크립트는 prefix를 엄격히 검사하고 해당 이메일 패턴에 연결된 워크스페이스만 PostgreSQL에서 cascade 삭제합니다. Mailpit은 로컬 검증용이므로 compose volume을 별도로 지정하지 않은 기본 구성에서는 컨테이너 재생성 시 메일도 사라집니다.
