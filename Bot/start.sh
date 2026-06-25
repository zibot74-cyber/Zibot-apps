#!/bin/bash
# ═══════════════════════════════════════════════════════
#  ZIbot Bot — تشغيل البوت وحده
#  للتشغيل الكامل (بوت + موقع): bash ../start_all.sh
# ═══════════════════════════════════════════════════════

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BE="$ROOT/backend"
FE="$ROOT/frontend"

log()  { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     🤖  ZIbot — بدء التشغيل         ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

# ─── Node.js ──────────────────────────────────────────
info "فحص Node.js..."
if ! command -v node &>/dev/null; then
  err "Node.js غير مثبّت!"
  echo "  Termux: pkg install nodejs"
  echo "  Ubuntu: curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
  exit 1
fi
VER=$(node -e "console.log(parseInt(process.version.slice(1)))")
[ "$VER" -lt 18 ] && { err "يحتاج Node.js 18+ (عندك: $(node --version))"; exit 1; }
log "Node.js $(node --version) ✓"

# ─── .app_runtime ─────────────────────────────────────
info "فحص ملف الإعدادات..."
if [ ! -f "$BE/.app_runtime" ]; then
  err "ملف .app_runtime غير موجود!"
  echo ""
  echo "  أنشئه:"
  echo "  cp $BE/env.text $BE/.app_runtime"
  echo "  nano $BE/.app_runtime"
  echo ""
  echo "  راجع: SETUP_GUIDE.md"
  exit 1
fi

check_var() {
  local v="$1"
  local val; val=$(grep "^${v}=" "$BE/.app_runtime" | cut -d'=' -f2- | tr -d '[:space:]')
  if [ -z "$val" ] || echo "$val" | grep -qiE "(ضع_|your_|YOUR_|\.\.\.)"; then
    err "متغير '$v' فارغ في .app_runtime"; return 1; fi
  return 0
}
OK=true
for v in SUPABASE_URL SUPABASE_KEY JWT_SECRET; do check_var "$v" || OK=false; done
AI=$(grep "^AI_PROVIDER=" "$BE/.app_runtime" 2>/dev/null | cut -d'=' -f2- | tr -d '[:space:]'); AI=${AI:-groq}
[ "$AI" = "claude" ] && check_var "ANTHROPIC_API_KEY" || check_var "GROQ_API_KEY" || OK=false
[ "$OK" = false ] && { echo ""; echo "  nano $BE/.app_runtime"; exit 1; }
log "ملف الإعدادات مكتمل ✓"

# ─── Backend packages ──────────────────────────────────
info "تثبيت حزم Backend..."
cd "$BE"
if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
  npm install --production --prefer-offline 2>&1 | tail -3 || true
  log "npm install (backend) ✓"
else
  log "node_modules موجود ✓"
fi

# ─── Frontend ──────────────────────────────────────────
cd "$FE"
if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
  info "تثبيت حزم Frontend..."
  npm install --prefer-offline 2>&1 | tail -3 || true
  log "npm install (frontend) ✓"
fi

if [ ! -d dist ] || [ package.json -nt dist ] || [ main.jsx -nt dist ] 2>/dev/null; then
  info "بناء Frontend..."
  npm run build 2>&1 | tail -8
  [ ! -d dist ] && { err "فشل بناء Frontend"; exit 1; }
  log "Frontend built ✓"
else
  log "dist/ موجود ✓"
fi

# ─── Start ─────────────────────────────────────────────
cd "$BE"
PORT=$(grep "^PORT=" .app_runtime 2>/dev/null | cut -d'=' -f2- | tr -d '[:space:]'); PORT=${PORT:-3000}

if command -v lsof &>/dev/null; then
  OPID=$(lsof -Pi :"$PORT" -sTCP:LISTEN -t 2>/dev/null || true)
  [ -n "$OPID" ] && { warn "البورت $PORT مشغول — إيقاف..."; kill "$OPID" 2>/dev/null || true; sleep 1; }
elif command -v fuser &>/dev/null; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true; sleep 1
fi

echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
log "السيرفر يبدأ على البورت $PORT"
echo -e "${BOLD}   http://localhost:$PORT${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}اضغط Ctrl+C للإيقاف${NC}"
echo ""

node server.js
