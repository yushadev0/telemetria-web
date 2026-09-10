#!/usr/bin/env bash
#
# Redeploy telemetria-web: pull the latest code, rebuild the Vite SPA and
# republish it to the nginx web root, then verify it is being served.
#
# This deploys the CLIENT only. The backend (telemetria-api) is a separate
# repository running as a Docker Compose stack on 127.0.0.1:8000 and is not
# touched here — see DEPLOYMENT.md section 7.
#
# Usage:
#   scripts/deploy.sh [--no-pull] [--no-build]
#
#   --no-pull    deploy the current working tree, skip "git pull"
#   --no-build   skip "npm ci && npm run build" (reuse the existing dist/)
#
# Paths and names can be overridden with environment variables:
#   TLM_WEB_ROOT     (default /var/www/telemetria-web)
#   TLM_WEB_OWNER    (default www-data:www-data)
#   TLM_HEALTH_URL   (default https://yusa.app/telemetria/)
#
# Run as a normal user; privileged steps use sudo. First-time setup (the nginx
# location block) is in DEPLOYMENT.md.

set -euo pipefail

WEB_ROOT="${TLM_WEB_ROOT:-/var/www/telemetria-web}"
WEB_OWNER="${TLM_WEB_OWNER:-www-data:www-data}"
HEALTH_URL="${TLM_HEALTH_URL:-https://yusa.app/telemetria/}"

PULL=1
BUILD=1
for arg in "$@"; do
  case "$arg" in
    --no-pull)  PULL=0 ;;
    --no-build) BUILD=0 ;;
    -h|--help)  sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg (try --help)" >&2; exit 2 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_DIR"

SUDO=""
[ "$(id -u)" -ne 0 ] && SUDO="sudo"

log()  { printf '\n\033[1;36m> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mx %s\033[0m\n' "$*" >&2; exit 1; }

command -v git   >/dev/null || fail "git not found"
command -v npm   >/dev/null || fail "npm not found"
command -v rsync >/dev/null || fail "rsync not found"

if [ "$PULL" -eq 1 ]; then
  log "git pull --ff-only"
  git pull --ff-only || fail "pull failed (diverged history? see DEPLOYMENT.md)"
fi

REV="$(git rev-parse --short HEAD)"

if [ "$BUILD" -eq 1 ]; then
  log "build web client (npm ci && npm run build)"
  npm ci
  npm run build
fi

[ -d dist ]            || fail "dist/ missing - run without --no-build"
[ -f dist/index.html ] || fail "dist/index.html missing - the build looks incomplete"

log "publish -> $WEB_ROOT"
$SUDO mkdir -p "$WEB_ROOT"
$SUDO rsync -a --delete dist/ "$WEB_ROOT/"
$SUDO chown -R "$WEB_OWNER" "$WEB_ROOT"

log "verify ($HEALTH_URL)"
code=""
for _ in $(seq 1 10); do
  code="$(curl -fsS -o /dev/null -w '%{http_code}' "$HEALTH_URL" 2>/dev/null || true)"
  if [ "$code" = "200" ]; then
    printf '\n\033[1;32m* deployed %s  (%s -> 200)\033[0m\n' "$REV" "$HEALTH_URL"
    exit 0
  fi
  sleep 1
done

fail "verify failed: $HEALTH_URL did not return 200 (last: ${code:-none}) - run 'sudo nginx -t' and check the location block in DEPLOYMENT.md"
