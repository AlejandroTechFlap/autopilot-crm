#!/usr/bin/env bash
# Autopilot CRM — start / stop / status helper.
#
# Usage:
#   ./scripts/services.sh start [dev|prod]   # default: dev
#   ./scripts/services.sh stop
#   ./scripts/services.sh restart [dev|prod]
#   ./scripts/services.sh status
#   ./scripts/services.sh logs
#
# Modes:
#   dev   → `pnpm dev` in the background, logs to .run/dev.log, pid in .run/dev.pid
#   prod  → `docker compose up -d` (uses docker-compose.yml + .env.local)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RUN_DIR="$ROOT/.run"
PID_FILE="$RUN_DIR/dev.pid"
LOG_FILE="$RUN_DIR/dev.log"

mkdir -p "$RUN_DIR"

color() { printf '\033[%sm%s\033[0m\n' "$1" "$2"; }
info()  { color "1;34" "▶ $*"; }
ok()    { color "1;32" "✔ $*"; }
warn()  { color "1;33" "! $*"; }
err()   { color "1;31" "✘ $*"; }

dev_running() {
  [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

start_dev() {
  if dev_running; then
    warn "Dev server already running (pid $(cat "$PID_FILE"))"
    return 0
  fi
  info "Starting Next.js dev server (pnpm dev)..."
  nohup pnpm dev >"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
  sleep 1
  if dev_running; then
    ok "Dev server started — pid $(cat "$PID_FILE"), logs: $LOG_FILE"
    ok "Open http://localhost:3000"
  else
    err "Dev server failed to start. See $LOG_FILE"
    exit 1
  fi
}

start_prod() {
  info "Starting production stack (docker compose up -d)..."
  docker compose up -d --build
  ok "Production stack up. Run '$0 logs' to follow."
}

stop_dev() {
  if dev_running; then
    info "Stopping dev server (pid $(cat "$PID_FILE"))..."
    kill "$(cat "$PID_FILE")" || true
    sleep 1
    pkill -f "next dev" 2>/dev/null || true
    rm -f "$PID_FILE"
    ok "Dev server stopped"
  else
    warn "No dev server pid file"
    pkill -f "next dev" 2>/dev/null && ok "Killed stray 'next dev' process" || true
  fi
}

stop_prod() {
  info "Stopping production stack (docker compose down)..."
  docker compose down
  ok "Production stack stopped"
}

status() {
  echo
  info "Dev server:"
  if dev_running; then
    ok "  running (pid $(cat "$PID_FILE"))"
  else
    warn "  not running"
  fi
  echo
  info "Production stack:"
  if command -v docker >/dev/null 2>&1; then
    docker compose ps 2>/dev/null || warn "  docker compose not available"
  else
    warn "  docker not installed"
  fi
  echo
}

logs() {
  if dev_running; then
    info "Tailing dev log ($LOG_FILE) — Ctrl-C to exit"
    tail -f "$LOG_FILE"
  elif docker compose ps -q autopilot-crm >/dev/null 2>&1; then
    info "Tailing docker logs — Ctrl-C to exit"
    docker compose logs -f autopilot-crm
  else
    warn "Nothing running"
  fi
}

cmd="${1:-}"
mode="${2:-dev}"

case "$cmd" in
  start)
    case "$mode" in
      dev)  start_dev ;;
      prod) start_prod ;;
      *)    err "Unknown mode: $mode (use dev|prod)"; exit 1 ;;
    esac
    ;;
  stop)
    stop_dev
    if command -v docker >/dev/null 2>&1 && docker compose ps -q 2>/dev/null | grep -q .; then
      stop_prod
    fi
    ;;
  restart)
    "$0" stop
    "$0" start "$mode"
    ;;
  status) status ;;
  logs)   logs ;;
  *)
    cat <<EOF
Usage: $0 {start|stop|restart|status|logs} [dev|prod]

  start dev    Start 'pnpm dev' in background (default)
  start prod   Start 'docker compose up -d'
  stop         Stop both dev and prod if running
  restart      Stop, then start (preserves mode arg)
  status       Show what is currently running
  logs         Tail logs of whichever is running
EOF
    exit 1
    ;;
esac
