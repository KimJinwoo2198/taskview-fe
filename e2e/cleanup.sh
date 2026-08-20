#!/bin/sh
set -eu

taskview_e2e_prefix=${1:-${TASKVIEW_E2E_PREFIX:-}}
if [ -z "$taskview_e2e_prefix" ]; then
  echo "usage: e2e/cleanup.sh <prefix>" >&2
  exit 2
fi
case "$taskview_e2e_prefix" in
  *[!a-z0-9_-]*)
    echo "prefix must contain only lowercase letters, digits, _ or -" >&2
    exit 2
    ;;
esac

taskview_be_compose_file=${TASKVIEW_BE_COMPOSE_FILE:-../taskview-be/compose.yaml}
taskview_e2e_email_pattern="taskview.e2e.${taskview_e2e_prefix}.%@example.com"

docker compose -f "$taskview_be_compose_file" exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U taskview -d taskview \
  -v e2e_email_pattern="$taskview_e2e_email_pattern" <<'SQL'
BEGIN;
CREATE TEMP TABLE e2e_target_users ON COMMIT DROP AS
SELECT id FROM users WHERE email LIKE :'e2e_email_pattern';
DELETE FROM workspaces
WHERE id IN (
  SELECT workspace_id
  FROM workspace_memberships
  WHERE user_id IN (SELECT id FROM e2e_target_users)
);
DELETE FROM users WHERE id IN (SELECT id FROM e2e_target_users);
COMMIT;
SQL

echo "removed Needex E2E database records for prefix: $taskview_e2e_prefix"
