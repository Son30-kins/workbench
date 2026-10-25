---
name: start-web
description: Bật Workbench ở máy dev — Postgres, API Spring Boot (cổng 8080, có bot Telegram) và web Next.js http://localhost:3000. Chỉ chạy khi người dùng gõ /start-web.
disable-model-invocation: true
allowed-tools: Bash(sh .claude/skills/start-web/start.sh)
---

Chạy đúng lệnh sau từ thư mục gốc dự án, timeout 300000 ms, **không** chạy nền:

```
sh .claude/skills/start-web/start.sh
```

Script tự lo: kiểm tra `.env.local` và Java 25, mở Docker Desktop nếu chưa chạy, bật Postgres, chạy API Spring Boot (`backend/`, Flyway tự cập nhật bảng, bot Telegram chạy bên trong) và web Next.js (`frontend/`) bằng `nohup` (vẫn chạy khi đóng Claude Code). Lần đầu API cần biên dịch khoảng 30–60 giây. Chạy lại khi đang bật thì không sao — phần nào đã chạy sẽ được giữ nguyên.

Sau khi chạy, trả lời ngắn gọn bằng tiếng Việt:
- Thành công: liệt kê dòng ✓ / – của script và link http://localhost:3000. Nhắc rằng tắt bằng `/end-web`.
- Thất bại: đọc dòng ✗ và log được in ra (hoặc `$TMPDIR/workbench-dev/api.log`, `web.log`), tìm nguyên nhân và đề xuất cách sửa.

Nếu người dùng báo web **tải lại liên tục** (log có hàng loạt `✓ Compiled in 1ms` + `GET /`): cache Turbopack trong `frontend/.next/` bị hỏng. Chạy `sh .claude/skills/end-web/stop.sh`, xoá `frontend/.next/` (chỉ là file build sinh tự động), rồi chạy lại script này.

Không bao giờ in giá trị trong `.env.local` (key Google, `AUTH_SECRET`, token Telegram).
