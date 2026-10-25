#!/bin/sh
# Bật Workbench ở máy dev: Postgres (Docker) → API Spring Boot (cổng 8080) → web Next.js (cổng 3000).
# Bot Telegram và job nhắc việc chạy bên trong API. Server chạy nền bằng nohup nên vẫn chạy khi đóng
# Claude Code. Tắt bằng /end-web.
set -eu
cd "$(git rev-parse --show-toplevel)"
ROOT="$(pwd)"

TMP="${TMPDIR:-/tmp}"
STATE="${TMP%/}/workbench-dev"
mkdir -p "$STATE"

fail() { echo "✗ $*"; exit 1; }
running() { [ -f "$1" ] && kill -0 "$(cat "$1")" 2>/dev/null; }

# Chờ URL trả 200; tiến trình chết sớm thì in log
wait_for() { # $1 = url, $2 = file pid, $3 = file log, $4 = số giây tối đa, $5 = tên
  i=0
  until curl -sf -o /dev/null "$1"; do
    i=$((i + 1))
    if [ "$i" -gt "$4" ] || ! running "$2"; then
      echo "✗ $5 không lên — 30 dòng cuối của $3:"
      tail -30 "$3"
      exit 1
    fi
    sleep 1
  done
}

# 1. Cấu hình — chỉ kiểm tra, không in giá trị
[ -f .env.local ] || fail "Chưa có .env.local — chạy: cp .env.example .env.local rồi điền key"
grep -qE '^GOOGLE_CLIENT_ID=.+' .env.local && ! grep -qE '^GOOGLE_CLIENT_(ID|SECRET)=(chua-cau-hinh)?$' .env.local \
  || fail "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET trong .env.local chưa điền"
grep -qE '^DATABASE_URL=jdbc:postgresql://' .env.local \
  || fail "DATABASE_URL trong .env.local phải dạng jdbc:postgresql://127.0.0.1:5433/workbench"
JAVA_HOME="$(/usr/libexec/java_home -v 25 2>/dev/null)" || fail "Chưa cài Java 25 (brew install openjdk)"
export JAVA_HOME
[ -d frontend/node_modules ] || { echo "… Cài thư viện frontend (npm ci)"; (cd frontend && npm ci --silent); }

# 2. Docker Desktop
if ! docker info >/dev/null 2>&1; then
  echo "… Docker Desktop chưa chạy — đang mở"
  open -a Docker
  i=0
  until docker info >/dev/null 2>&1; do
    i=$((i + 1)); [ "$i" -gt 90 ] && fail "Docker Desktop không lên sau 3 phút"
    sleep 2
  done
fi

# 3. Database
docker compose -f docker-compose.dev.yml up -d --wait >/dev/null 2>&1 || fail "Không bật được Postgres — xem: docker compose -f docker-compose.dev.yml logs db"
echo "✓ Database (127.0.0.1:5433)"

# 4. API Spring Boot — Flyway tự cập nhật bảng khi khởi động
if curl -sf -o /dev/null http://localhost:8080/actuator/health; then
  echo "✓ API đã chạy sẵn: http://localhost:8080"
else
  lsof -ti tcp:8080 -sTCP:LISTEN >/dev/null 2>&1 && { echo "✗ Cổng 8080 đang bị chương trình khác dùng:"; lsof -i tcp:8080 -sTCP:LISTEN; exit 1; }
  echo "… Đang khởi động API (lần đầu cần biên dịch, khoảng 30–60 giây)"
  (cd backend && nohup ./mvnw -q spring-boot:run >"$STATE/api.log" 2>&1 & echo $! >"$STATE/api.pid")
  wait_for http://localhost:8080/actuator/health "$STATE/api.pid" "$STATE/api.log" 180 "API"
  echo "✓ API: http://localhost:8080"
  # Bot kết nối Telegram vài giây sau khi API sẵn sàng
  i=0
  until grep -qE 'Telegram bot @|Chưa có TELEGRAM_BOT_TOKEN|Không kết nối được Telegram' "$STATE/api.log" 2>/dev/null || [ "$i" -ge 10 ]; do
    sleep 1; i=$((i + 1))
  done
  if grep -q 'Telegram bot @' "$STATE/api.log"; then
    echo "✓ Bot Telegram @$(grep -o 'Telegram bot @[A-Za-z0-9_]*' "$STATE/api.log" | head -1 | cut -d@ -f2) đã kết nối"
  elif grep -q 'Chưa có TELEGRAM_BOT_TOKEN' "$STATE/api.log"; then
    echo "– Bot Telegram: bỏ qua (chưa có TELEGRAM_BOT_TOKEN trong .env.local)"
  else
    echo "! Bot Telegram chưa kết nối — xem $STATE/api.log"
  fi
fi

# 5. Web Next.js
if curl -sf -o /dev/null http://localhost:3000/api/health; then
  echo "✓ Web đã chạy sẵn: http://localhost:3000"
else
  lsof -ti tcp:3000 -sTCP:LISTEN >/dev/null 2>&1 && { echo "✗ Cổng 3000 đang bị chương trình khác dùng:"; lsof -i tcp:3000 -sTCP:LISTEN; exit 1; }
  (cd frontend && nohup npm run dev >"$STATE/web.log" 2>&1 & echo $! >"$STATE/web.pid")
  wait_for http://localhost:3000/api/health "$STATE/web.pid" "$STATE/web.log" 90 "Web"
  echo "✓ Web: http://localhost:3000"
fi

echo "Log: $STATE/api.log, $STATE/web.log"
cd "$ROOT"
