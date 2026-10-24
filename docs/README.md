# ManagementTask — Tài liệu dự án

App quản lý công việc tự host bằng Docker, nhiều người dùng (đăng nhập Google, dữ liệu riêng từng người), nhắc việc qua Telegram: điền **form mẫu** → app **tự sinh task**, có **mức độ ưu tiên**, và **thông báo** khi task sắp đến hạn.

## Mục lục

| # | Tài liệu | Nội dung |
|---|----------|----------|
| 1 | [01-tong-quan.md](01-tong-quan.md) | Mục tiêu, phạm vi, người dùng |
| 2 | [02-yeu-cau-chuc-nang.md](02-yeu-cau-chuc-nang.md) | Tính năng chi tiết + user stories |
| 3 | [03-mo-hinh-du-lieu.md](03-mo-hinh-du-lieu.md) | Các bảng dữ liệu, quan hệ |
| 4 | [04-kien-truc-cong-nghe.md](04-kien-truc-cong-nghe.md) | Công nghệ đề xuất, kiến trúc |
| 5 | [05-lo-trinh.md](05-lo-trinh.md) | Các giai đoạn, checklist công việc |
| 6 | [06-cau-hoi-mo.md](06-cau-hoi-mo.md) | Những điểm cần bạn quyết định |
| 7 | [07-ui-design.md](07-ui-design.md) | Thiết kế giao diện (theo Figma), design tokens |
| 8 | [08-dong-goi-docker.md](08-dong-goi-docker.md) | Đóng gói Docker, cấu hình, phát hành image |
| 9 | [09-git-va-bao-mat.md](09-git-va-bao-mat.md) | Quy trình Git, quản lý & bảo vệ key bí mật |

## Trạng thái

- 2026-10-24: Khởi tạo tài liệu, lên plan. Chưa có code.
- 2026-10-24: Đọc design Figma (Kanban board, Light/Dark), viết tài liệu UI, lưu ảnh vào `ui-reference/`.
- 2026-10-24: Chốt nhiều người dùng — thêm đăng ký / đăng nhập, phân quyền dữ liệu, chuyển sang PostgreSQL, thêm giai đoạn Tài khoản và Deploy vào lộ trình.
- 2026-10-24: Chốt phát hành bằng Docker — người khác kéo image và chạy `docker compose up -d`; email đổi sang SMTP, thêm vai trò admin.
- 2026-10-24: Chốt chỉ phát hành image (không vận hành bản cài chung), đăng lên Docker Hub.
- 2026-10-24: Chốt thông báo qua Telegram, đăng nhập chỉ bằng Google (bỏ mật khẩu, email, SMTP), code quản lý trên GitHub, quy tắc bảo vệ key bí mật.
