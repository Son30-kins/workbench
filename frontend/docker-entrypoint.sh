#!/bin/sh
# Chạy giao diện web. Khoá mã hoá Server Action được sinh riêng cho bản cài này từ AUTH_SECRET
# (image công khai không chứa khoá nào — xem docker/build-keys.mjs).
set -e

if [ -z "$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" ]; then
  INSTANCE_KEY="$(node docker/build-keys.mjs instance .next)"
  export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$INSTANCE_KEY"
  unset INSTANCE_KEY
fi

if [ "$#" -gt 0 ]; then
  exec "$@"
fi
exec node server.js
