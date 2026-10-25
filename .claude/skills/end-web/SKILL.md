---
name: end-web
description: Tắt Workbench ở máy dev — web Next.js, API Spring Boot và Postgres (giữ nguyên dữ liệu). Chỉ chạy khi người dùng gõ /end-web.
disable-model-invocation: true
allowed-tools: Bash(sh .claude/skills/end-web/stop.sh)
---

Chạy đúng lệnh sau từ thư mục gốc dự án, timeout 120000 ms:

```
sh .claude/skills/end-web/stop.sh
```

Script tắt web và API đã bật bằng `/start-web` (kể cả bản bật tay bằng `npm run dev` / `./mvnw spring-boot:run` trong thư mục dự án), rồi dừng container Postgres bằng `docker compose stop` — **không** xoá dữ liệu. Chương trình khác đang dùng cổng 3000 / 8080 sẽ không bị đụng tới.

Sau khi chạy, trả lời ngắn gọn bằng tiếng Việt: liệt kê các dòng ✓ / – / ! của script và nhắc rằng bật lại bằng `/start-web`. Nếu có dòng `!` thì giải thích chương trình nào đang giữ cổng 3000 / 8080.
