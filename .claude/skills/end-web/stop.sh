#!/bin/sh
# Tắt Workbench ở máy dev: web Next.js, API Spring Boot, Postgres. Dữ liệu database được giữ lại.
set -eu
cd "$(git rev-parse --show-toplevel)"

TMP="${TMPDIR:-/tmp}"
STATE="${TMP%/}/workbench-dev"
REPO="$(pwd)"

tree() { # pid và toàn bộ tiến trình con cháu
  echo "$1"
  for child in $(pgrep -P "$1" 2>/dev/null); do tree "$child"; done
}

# Tắt nhẹ nhàng: SIGTERM cho tiến trình gốc để Next.js / Spring tự dọn dẹp (lưu cache, đóng kết nối DB).
# Giết thẳng tiến trình con giữa lúc ghi cache làm hỏng .next/ → web tải lại liên tục.
killtree() {
  pids=$(tree "$1")
  kill "$1" 2>/dev/null || true
  i=0
  while [ "$i" -lt 30 ]; do
    alive=""
    for p in $pids; do kill -0 "$p" 2>/dev/null && alive="$alive $p"; done
    [ -z "$alive" ] && return 0
    sleep 0.5; i=$((i + 1))
  done
  for p in $alive; do kill -9 "$p" 2>/dev/null || true; done # quá 15 giây vẫn chưa thoát
}

stop_pidfile() { # $1 = file pid, $2 = tên hiển thị
  if [ -f "$1" ] && kill -0 "$(cat "$1")" 2>/dev/null; then
    killtree "$(cat "$1")"
    echo "✓ Đã tắt $2"
  else
    echo "– $2 không chạy"
  fi
  rm -f "$1"
}

stop_pidfile "$STATE/web.pid" "web"
stop_pidfile "$STATE/api.pid" "API"

# Dọn tiến trình của dự án này còn sót (vd. bật tay bằng `npm run dev` / `./mvnw spring-boot:run`)
for port in 3000 8080; do
  for pid in $(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null); do
    cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
    case "$cwd" in
      "$REPO" | "$REPO"/*)
        # Tiến trình giữ cổng có thể là con (next-server, java) → tắt từ tiến trình cha nếu là next dev / mvnw
        parent=$(ps -o ppid= -p "$pid" | tr -d ' ')
        ps -o command= -p "$parent" 2>/dev/null | grep -qE 'next dev|mvnw|maven' && pid=$parent
        killtree "$pid"
        echo "✓ Đã tắt tiến trình còn sót trên cổng $port (pid $pid)"
        ;;
      *) echo "! Cổng $port đang được chương trình khác dùng (pid $pid) — không đụng tới" ;;
    esac
  done
done

# Database — stop (không down -v) để giữ dữ liệu
if docker info >/dev/null 2>&1; then
  docker compose -f docker-compose.dev.yml stop >/dev/null 2>&1 && echo "✓ Đã tắt database (dữ liệu vẫn giữ)"
else
  echo "– Docker Desktop không chạy — database đã tắt sẵn"
fi
