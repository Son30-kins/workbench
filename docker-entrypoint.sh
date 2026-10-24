#!/bin/sh
# web    — kiểm tra .env, cập nhật database, chạy giao diện web
# worker — kiểm tra .env, cập nhật database, chạy nhắc việc + bot Telegram
# migrate — chỉ cập nhật database
set -e

case "$1" in
  web)
    node dist/migrate.mjs
    # Khoá riêng của bản cài này (image công khai không chứa khoá nào)
    INSTANCE_KEY="$(node docker/build-keys.mjs instance .next)"
    if [ -z "$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" ]; then
      export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$INSTANCE_KEY"
    fi
    unset INSTANCE_KEY
    exec node server.js
    ;;
  worker)
    node dist/migrate.mjs
    exec node dist/worker.mjs
    ;;
  migrate)
    exec node dist/migrate.mjs
    ;;
  *)
    exec "$@"
    ;;
esac
