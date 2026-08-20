@AGENTS.md

## Deploy Configuration (configured by /setup-deploy)
- Platform: Google Compute Engine VM with separate Docker Compose projects
- Production URL: http://35.185.143.237
- Deploy workflow: manual fast-forward pull of the three public repositories
- Deploy status command: `gcloud compute ssh instance-20260820-194951 --zone=asia-east1-a --command="docker ps"`
- Merge method: fast-forward `main`
- Project type: Next.js web app with FastAPI API and PostgreSQL
- Post-deploy health check: http://35.185.143.237/api/health

### Custom deploy hooks
- Pre-merge: `pnpm typecheck && pnpm build`
- Deploy trigger: `cd /opt/needex/taskview-fe && git pull --ff-only && ./scripts/deploy.sh`
- Backend deploy: `cd /opt/needex/taskview-be && git pull --ff-only && ./scripts/deploy.sh`
- Deploy status: check Docker health for `needex-fe-fe-1`, `needex-be-be-1`, and `needex-be-postgres-1`
- Health check: `curl -fsS http://35.185.143.237/api/health`
- AI: deployed separately; set BE `TASKVIEW_AI_URL`, the shared secret, and `TASKVIEW_BE_FAKE_AI=false`
- Domain cutover: change the public URL/CORS values, set `TASKVIEW_COOKIE_SECURE=true`, and terminate HTTPS before exposing the domain
