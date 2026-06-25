#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  ZIbot — تشغيل المشروع كاملاً بأمر واحد
#  🤖 البوت (واتساب + داشبورد React) → بورت 3000
#  🌐 الموقع التسويقي (Next.js)       → بورت 3001
#
#  الاستخدام:
#    bash start_all.sh          ← تشغيل الكل
#    bash start_all.sh --bot    ← البوت فقط
#    bash start_all.sh --web    ← الموقع فقط
#    bash start_all.sh --stop   ← إيقاف الكل
# ═══════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOT_DIR="$ROOT/Bot"
BOT_BE="$BOT_DIR/backend"
BOT_FE="$BOT_DIR/frontend"
WEB_DIR="$ROOT"

BOT_PORT=3000
WEB_PORT=3001

BOT_PID="$ROOT/.bot.pid"
WEB_PID="$ROOT/.web.pid"
BOT_LOG="$ROOT/.bot.log"
WEB_LOG="$ROOT/.web.log"

log()  { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${CYAN}▶  $1${NC}"; }
sep()  { echo -e "${BOLD}══════════════════════════════════════${NC}"; }

kill_port() {
  local port="$1"
  local pid=""
  if command -v lsof &>/dev/null; then
    pid=$(lsof -Pi :"$port" -sTCP:LISTEN -t 2>/dev/null || true)
  elif command -v fuser &>/dev/null; then
    pid=$(fuser "${port}/tcp" 2>/dev/null | tr -d ' ' || true)
  fi
  if [ -n "$pid" ]; then
    warn "البورت $port مشغول (PID: $pid) — إيقاف..."
    kill "$pid" 2>/dev/null || true
    sleep 1
  fi
}

kill_pid_file() {
  local file="$1" label="$2"
  if [ -f "$file" ]; then
    local pid; pid=$(cat "$file" 2>/dev/null)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null && log "تم إيقاف $label (PID: $pid)"
    fi
    rm -f "$file"
  fi
}

check_node() {
  if ! command -v node &>/dev/null; then
    err "Node.js غير مثبّت!"
    echo "  Termux: pkg install nodejs"
    echo "  Ubuntu: curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
    exit 1
  fi
  local ver; ver=$(node -e "console.log(parseInt(process.version.slice(1)))")
  [ "$ver" -lt 18 ] && { err "يحتاج Node.js 18+ (عندك: $(node --version))"; exit 1; }
  log "Node.js $(node --version)"
}

stop_all() {
  sep; echo -e "${BOLD}🛑  إيقاف جميع العمليات${NC}"; sep
  kill_pid_file "$BOT_PID" "البوت"
  kill_pid_file "$WEB_PID" "الموقع"
  kill_port "$BOT_PORT"
  kill_port "$WEB_PORT"
  log "تم إيقاف كل شيء"
  exit 0
}

build_bot() {
  info "تثبيت حزم Backend..."
  cd "$BOT_BE"
  [ ! -d node_modules ] && npm install --production --prefer-offline 2>&1 | tail -3 || true

  info "تثبيت حزم Frontend..."
  cd "$BOT_FE"
  [ ! -d node_modules ] && npm install --prefer-offline 2>&1 | tail -3 || true

  if [ ! -d dist ] || [ package.json -nt dist ] || [ main.jsx -nt dist ] 2>/dev/null; then
    info "بناء Frontend (React + Vite)..."
    npm run build 2>&1 | grep -v "^    at " | grep -v "^$" | tail -30
    [ ! -d dist ] && { err "فشل بناء Frontend"; exit 1; }
    log "Frontend built ✅"
  else
    log "dist/ موجود — تخطّي البناء"
  fi
}

build_web() {
  info "تثبيت حزم الموقع التسويقي..."
  cd "$WEB_DIR"
  [ ! -d node_modules ] && npm install --prefer-offline 2>&1 | tail -3 || true

  if [ ! -f .next/BUILD_ID ] || [ package.json -nt .next/BUILD_ID ] 2>/dev/null; then
    info "بناء الموقع (Next.js)..."
    rm -rf .next
    npm run build 2>&1 | grep -v "^    at " | grep -v "^$" | tail -30
    [ ! -f .next/BUILD_ID ] && { err "فشل بناء الموقع"; exit 1; }
    log "Next.js built ✅"
  else
    log ".next/ موجود — تخطّي البناء"
  fi
}

start_bot() {
  info "تشغيل البوت على البورت $BOT_PORT..."
  kill_port "$BOT_PORT"
  kill_pid_file "$BOT_PID" "البوت القديم"
  cd "$BOT_BE"
  nohup node server.js > "$BOT_LOG" 2>&1 &
  local pid=$!
  echo "$pid" > "$BOT_PID"
  sleep 2
  if kill -0 "$pid" 2>/dev/null; then
    log "البوت يعمل ✅  (PID: $pid) → http://localhost:$BOT_PORT"
  else
    err "البوت فشل في البدء — راجع: $BOT_LOG"
    tail -20 "$BOT_LOG"
    exit 1
  fi
}

start_web() {
  info "تشغيل الموقع على البورت $WEB_PORT..."
  kill_port "$WEB_PORT"
  kill_pid_file "$WEB_PID" "الموقع القديم"
  cd "$WEB_DIR"
  nohup npx next start -p "$WEB_PORT" > "$WEB_LOG" 2>&1 &
  local pid=$!
  echo "$pid" > "$WEB_PID"
  sleep 3
  if kill -0 "$pid" 2>/dev/null; then
    log "الموقع يعمل ✅  (PID: $pid) → http://localhost:$WEB_PORT"
  else
    err "الموقع فشل في البدء — راجع: $WEB_LOG"
    tail -20 "$WEB_LOG"
    exit 1
  fi
}

check_env() {
  if [ ! -f "$BOT_BE/.app_runtime" ]; then
    err "ملف .app_runtime غير موجود!"
    echo ""
    echo "  أنشئه:"
    echo "  cp $BOT_BE/env.text $BOT_BE/.app_runtime"
    echo "  nano $BOT_BE/.app_runtime"
    exit 1
  fi
  local ok=true
  for v in SUPABASE_URL SUPABASE_KEY JWT_SECRET; do
    local val; val=$(grep "^${v}=" "$BOT_BE/.app_runtime" 2>/dev/null | cut -d'=' -f2- | tr -d '[:space:]')
    if [ -z "$val" ] || echo "$val" | grep -qiE "(ضع_|your_|YOUR_|\.\.\.)" ; then
      err "قيمة '$v' فارغة في .app_runtime"; ok=false
    fi
  done
  local ai; ai=$(grep "^AI_PROVIDER=" "$BOT_BE/.app_runtime" 2>/dev/null | cut -d'=' -f2- | tr -d '[:space:]')
  ai=${ai:-groq}
  if [ "$ai" = "claude" ]; then
    grep -q "^ANTHROPIC_API_KEY=" "$BOT_BE/.app_runtime" || { err "ANTHROPIC_API_KEY مفقود"; ok=false; }
  else
    local gval; gval=$(grep "^GROQ_API_KEY=" "$BOT_BE/.app_runtime" 2>/dev/null | cut -d'=' -f2- | tr -d '[:space:]')
    [ -z "$gval" ] && { err "GROQ_API_KEY مفقود"; ok=false; }
  fi
  [ "$ok" = false ] && { echo ""; echo "  nano $BOT_BE/.app_runtime"; exit 1; }
  log "ملف الإعدادات ✅"
}

follow_logs() {
  echo ""
  sep
  echo -e "${BOLD}📋  السجلات (اضغط Ctrl+C للإيقاف)${NC}"
  sep
  echo ""
  touch "$BOT_LOG" "$WEB_LOG" 2>/dev/null || true

  cleanup() {
    echo ""
    warn "هل تريد إيقاف الخدمات؟ (y/n)"
    read -r ans
    if [ "$ans" = "y" ] || [ "$ans" = "Y" ]; then
      kill_pid_file "$BOT_PID" "البوت"
      kill_pid_file "$WEB_PID" "الموقع"
      log "تم الإيقاف"
    else
      echo -e "${CYAN}الخدمات لا تزال تعمل في الخلفية${NC}"
      echo "  لإيقافها لاحقاً: bash start_all.sh --stop"
    fi
    exit 0
  }
  trap cleanup INT

  tail -f "$BOT_LOG" "$WEB_LOG" 2>/dev/null &
  TAIL_PID=$!
  wait $TAIL_PID
}

MODE="${1:-all}"

[ "$MODE" = "--stop" ] && stop_all

echo ""
sep
echo -e "${BOLD}      🤖  ZIbot — تشغيل المشروع${NC}"
sep
echo ""

check_node

case "$MODE" in
  --bot)
    info "وضع: البوت فقط"
    check_env
    build_bot
    start_bot
    ;;
  --web)
    info "وضع: الموقع فقط"
    build_web
    start_web
    ;;
  *)
    info "وضع: المشروع كاملاً"
    check_env
    build_bot
    build_web
    start_bot
    start_web
    ;;
esac

echo ""
sep
echo -e "${BOLD}🚀  كل شيء يعمل!${NC}"
echo ""
echo -e "  ${GREEN}🤖 البوت + داشبورد${NC}  →  ${BOLD}http://localhost:$BOT_PORT${NC}"
echo -e "  ${GREEN}🌐 الموقع التسويقي${NC}  →  ${BOLD}http://localhost:$WEB_PORT${NC}"
echo ""
echo -e "  📋 سجلات البوت:    ${BLUE}$BOT_LOG${NC}"
echo -e "  📋 سجلات الموقع:   ${BLUE}$WEB_LOG${NC}"
echo -e "  🛑 للإيقاف:        ${YELLOW}bash start_all.sh --stop${NC}"
sep
echo ""

follow_logs
