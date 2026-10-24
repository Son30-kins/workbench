# 5. Lộ trình

Ước lượng tính theo làm bán thời gian; điều chỉnh sau khi chốt [06-cau-hoi-mo.md](06-cau-hoi-mo.md).

## Giai đoạn 0 — Chuẩn bị (1–2 ngày)
- [ ] Git + GitHub + bảo vệ bí mật — checklist ở [09-git-va-bao-mat.md](09-git-va-bao-mat.md) mục 9.6
- [ ] Khởi tạo project Next.js + TypeScript + Tailwind + Prisma
- [ ] PostgreSQL local bằng Docker (`docker-compose.dev.yml`)
- [ ] `lib/env.ts`: đọc & kiểm tra biến môi trường, thiếu biến bắt buộc thì dừng (chuẩn bị sẵn cho Docker)
- [ ] Lint, format, test (Vitest), CI trên GitHub Actions
- [ ] Tạo Google OAuth client + Telegram bot **riêng cho môi trường dev** (lưu trong `.env.local`)

## Giai đoạn 1 — Đăng nhập Google (2–3 ngày)
- [ ] Better Auth + Google provider; bảng `users`, `sessions`, `accounts`, `verifications`, `app_settings`
- [ ] Trang Đăng nhập: một nút "Đăng nhập bằng Google" (theo style ở [07-ui-design.md](07-ui-design.md))
- [ ] Người đăng nhập đầu tiên = admin; kiểm tra danh sách email / tên miền được phép
- [ ] Middleware chặn route khi chưa đăng nhập
- [ ] Trang Hồ sơ: múi giờ; menu avatar (Hồ sơ / Cài đặt / Đăng xuất)
- [ ] Lớp truy cập dữ liệu luôn lọc theo `user_id` + test: người dùng A không đọc/sửa được dữ liệu của B

**Xong khi:** 2 tài khoản Google khác nhau đăng nhập được, mỗi người chỉ thấy dữ liệu của mình.

## Giai đoạn 2 — Task cơ bản (3–5 ngày)
- [ ] Schema: `tasks`, `subtasks`, `tags` (đều gắn `user_id`)
- [ ] API + UI: tạo / sửa / xoá / đánh dấu xong
- [ ] Ưu tiên (màu, badge), hạn chót
- [ ] Layout theo [07-ui-design.md](07-ui-design.md): thanh icon, panel phụ, header; design tokens (font Exo 2, màu Light/Dark)
- [ ] Board Kanban 3 cột + task card; kéo thả đổi trạng thái (`dnd-kit`)
- [ ] List view: lọc, sắp xếp (ưu tiên → hạn), tìm kiếm
- [ ] Bộ lọc nhanh: Hôm nay / Quá hạn / 7 ngày tới
- [ ] Chuyển Light / Dark mode

**Xong khi:** quản lý task thủ công dùng được hằng ngày.

## Giai đoạn 3 — Form mẫu → tự sinh task (5–7 ngày) ⭐
- [ ] Schema: `templates`, `template_fields`, `template_task_rules`, `template_runs`
- [ ] `template-engine.ts`: thay biến `{{key}}`, tính hạn tương đối, điều kiện — **viết unit test kỹ**
- [ ] UI tạo template: thêm trường form, thêm quy tắc task
- [ ] UI điền form (render động) → xem trước → tạo
- [ ] Lịch sử các lần điền form
- [ ] Tạo sẵn 2–3 template mẫu (báo cáo tuần, việc cá nhân...) — tự thêm vào tài khoản mới khi đăng nhập lần đầu

**Xong khi:** điền 1 form tạo được nhiều task đúng hạn, đúng ưu tiên.

## Giai đoạn 4 — Thông báo qua Telegram (4–6 ngày)
- [ ] Schema: `reminders`, `notification_channels`, settings người dùng
- [ ] `scheduleReminders()` + gọi khi tạo/sửa/hoàn thành task
- [ ] Worker: quét reminder mỗi phút, chống gửi trùng + chạy bot Telegram (grammY, long polling)
- [ ] Kết nối Telegram: mã tạm → link `t.me/<bot>?start=<mã>` → gắn `chat_id`; ngắt kết nối
- [ ] Tin nhắc có nút ✅ Xong / ⏰ Hoãn / 🔗 Mở
- [ ] Chuông thông báo trong app (cho cả người chưa kết nối Telegram)
- [ ] Nhắc quá hạn lặp lại, bản tin buổi sáng
- [ ] Giờ yên lặng
- [ ] Trang Cài đặt lịch nhắc

**Xong khi:** nhận được tin nhắc trên Telegram đúng giờ, bấm "Xong" trong Telegram thì task trên app chuyển sang Done.

## Giai đoạn 5 — Đóng gói Docker & phát hành (3–4 ngày)
Chi tiết: [08-dong-goi-docker.md](08-dong-goi-docker.md)
- [ ] `Dockerfile` multi-stage (Next.js standalone + worker), chạy user non-root
- [ ] `docker-entrypoint.sh`: tự chạy migration khi khởi động
- [ ] Endpoint `/api/health` + healthcheck
- [ ] `docker-compose.yml` (app, worker, db, caddy tuỳ chọn) + `.env.example`
- [ ] `.dockerignore` chặn `.env*`; không truyền bí mật qua `ARG`/`ENV` trong Dockerfile
- [ ] CI quét image bằng Trivy trước khi đẩy
- [ ] Thiếu `TELEGRAM_BOT_TOKEN` → app vẫn chạy, admin thấy cảnh báo
- [ ] Trang admin: danh sách người dùng, khoá tài khoản, danh sách email / tên miền được phép
- [ ] Hướng dẫn người cài tạo Google OAuth client + Telegram bot (có ảnh chụp)
- [ ] Tạo tài khoản + repo public trên Docker Hub, tạo Access Token, lưu vào GitHub secrets
- [ ] GitHub Actions: test → build đa kiến trúc (amd64 + arm64) → đẩy lên Docker Hub khi tạo tag `v*`
- [ ] README cho người cài + `DOCKERHUB.md` (trang Overview trên Docker Hub): cài nhanh, compose mẫu, biến môi trường, HTTPS, cập nhật, sao lưu
- [ ] Thử cài từ thư mục trống trên máy sạch (Mac + 1 VPS Linux)

**Xong khi:** người khác tải 2 file, chạy `docker compose up -d`, mở trình duyệt, đăng nhập Google và dùng được.

## Giai đoạn 6 — Hoàn thiện & mở rộng (tuỳ chọn)
- [ ] PWA — cài lên điện thoại
- [ ] Xoá tài khoản
- [ ] Template lặp lại tự động (mỗi tuần/tháng)
- [ ] Lệnh bot Telegram `/today`, `/overdue`; tạo nhanh task bằng tin nhắn
- [ ] Thêm kênh thông báo thứ 2 (Web Push / Email)
- [ ] Làm việc nhóm: workspace, mời thành viên, giao việc, chia sẻ template
- [ ] Đồng bộ Google Calendar
- [ ] AI: dán đoạn văn bản / tin nhắn → tự điền form hoặc tạo task
- [ ] Thống kê: số task hoàn thành, tỉ lệ trễ hạn

## Rủi ro & lưu ý

| Rủi ro | Cách xử lý |
|--------|-----------|
| Sai múi giờ khi tính hạn | Lưu UTC, test kỹ các trường hợp qua ngày |
| Thông báo gửi trùng / không gửi | Trạng thái reminder + transaction, log lỗi |
| Worker chết khi tắt máy | Chạy local thì chỉ nhắc khi máy bật → cần deploy server để dùng thật |
| Lộ dữ liệu giữa các người dùng | Lọc `user_id` tập trung ở lớp dữ liệu, có test riêng cho phân quyền |
| Người lạ đăng nhập vào bản cài | Danh sách email / tên miền được phép; admin khoá tài khoản |
| Google không cho đăng nhập qua IP mạng LAN | Ghi rõ trong hướng dẫn: dùng `localhost` hoặc tên miền + HTTPS |
| Lộ key bí mật lên GitHub / Docker Hub | gitleaks pre-commit + CI, GitHub push protection, `.dockerignore`, Trivy — xem [09-git-va-bao-mat.md](09-git-va-bao-mat.md) |
| Người cài quên đặt `AUTH_SECRET` / dùng mật khẩu mặc định | App từ chối khởi động và báo rõ lỗi; không có giá trị mặc định cho bí mật |
| Cập nhật bản mới làm hỏng dữ liệu | Migration chạy tự động, có test migration; README nhắc sao lưu trước khi cập nhật |
| Image không chạy trên Mac chip M / Raspberry Pi | Build đa kiến trúc amd64 + arm64 |
| Trình tạo template quá phức tạp | MVP chỉ hỗ trợ biến + hạn tương đối; điều kiện/lặp lại để sau |
