# 4. Kiến trúc & công nghệ

## Đề xuất: Web app (chạy được trên máy tính + điện thoại qua trình duyệt / PWA)

| Lớp | Công nghệ | Lý do |
|-----|-----------|-------|
| Ngôn ngữ | TypeScript | Một ngôn ngữ cho cả frontend và backend |
| Framework | Next.js (App Router) | UI + API trong cùng 1 project |
| UI | Tailwind CSS + shadcn/ui | Làm form, bảng, dialog nhanh |
| Form | React Hook Form + Zod | Form động từ template, validate |
| Database | PostgreSQL (chạy local bằng Docker) | Nhiều người dùng dùng chung server → dùng Postgres ngay từ đầu, khỏi chuyển đổi sau |
| ORM | Prisma hoặc Drizzle | Migration, type-safe |
| Đăng nhập | Better Auth + Google OAuth | Chỉ đăng nhập Google; thư viện lo phiên, state/PKCE, liên kết tài khoản |
| Đóng gói | Docker + Docker Compose, image trên Docker Hub | Người khác kéo về và chạy 1 lệnh — xem [08-dong-goi-docker.md](08-dong-goi-docker.md) |
| Ngày giờ | date-fns + date-fns-tz | Tính hạn tương đối, múi giờ |
| Template text | Mustache-style tự viết (thay `{{key}}`) | Đơn giản, an toàn |
| Job nhắc việc | Tiến trình worker chạy mỗi phút (node-cron) | Quét bảng `reminders` |
| Thông báo | Telegram Bot API (`grammY`) | Đã chốt; bot chạy trong worker bằng long polling — không cần tên miền public |
| PWA | manifest + service worker | Cài lên điện thoại, nhận push |

## Sơ đồ

```
┌──────────────┐      ┌─────────────────────────┐      ┌──────────┐
│  Trình duyệt │◄────►│  Next.js (UI + API)     │◄────►│ Database │
│  / PWA       │      └─────────────────────────┘      └────▲─────┘
└──────▲───────┘                                           │
       │ đăng nhập                                             │
       ▼                     ┌──────────────────────┐      │
   Google OAuth              │ Worker               ├──────┘
                             │ - quét reminder 1'/lần│
       Telegram ◄───────────►│ - bot Telegram        │
                             │   (long polling)      │
                             └──────────────────────┘
```

## Luồng chính

**Đăng nhập Google & phân quyền**
1. Bấm "Đăng nhập bằng Google" → Google → quay về `APP_URL/api/auth/callback/google`.
2. Kiểm tra email có được phép không (danh sách email / tên miền); người đầu tiên của bản cài → `ADMIN`.
3. Middleware kiểm tra phiên ở mọi route trong app; chưa đăng nhập → chuyển về `/login`.
4. Mỗi API lấy `userId` từ phiên (không bao giờ nhận `userId` từ client).
5. Mọi truy vấn đi qua lớp dữ liệu có sẵn điều kiện `where user_id = userId` — tránh quên lọc ở từng chỗ.

**Điền form → tạo task**
1. Người dùng chọn template, điền form (form render động từ `template_fields`).
2. API `POST /api/templates/:id/preview` → trả về danh sách task dự kiến (chưa lưu).
3. Người dùng xác nhận → `POST /api/templates/:id/run` → trong 1 transaction: tạo `template_run`, các `task`, các `reminder`.

**Sinh reminder** (hàm `scheduleReminders(task)`)
1. Huỷ các reminder `PENDING` cũ của task.
2. Lấy lịch nhắc theo `priority` từ settings của chủ task.
3. Với mỗi mốc: `fire_at = due_at - offset`; bỏ qua mốc đã qua; dời nếu rơi vào giờ yên lặng.
4. Thêm 1 reminder `OVERDUE` tại `due_at`.

**Worker gửi thông báo** (mỗi phút)
1. Lấy reminder `PENDING` có `fire_at <= now`.
2. Kiểm tra task còn chưa xong → gửi qua các kênh đang bật của chủ task → đánh dấu `SENT` (hoặc `FAILED` + thử lại).
3. Với `OVERDUE`: sau khi gửi, tạo reminder `OVERDUE` tiếp theo sau 24h.

## Cấu trúc thư mục dự kiến

```
ManagementTask/
├── docs/                  ← tài liệu (thư mục này)
├── prisma/schema.prisma
├── Dockerfile             ← multi-stage, 1 image cho app + worker
├── docker-entrypoint.sh   ← chạy migration rồi khởi động
├── docker-compose.yml     ← bản cho người cài: app, worker, db, caddy
├── docker-compose.dev.yml ← chỉ Postgres, để phát triển
├── .env.example
├── .github/workflows/release.yml ← build & đẩy image khi tạo tag
├── src/
│   ├── app/
│   │   ├── login/         ← nút "Đăng nhập bằng Google"
│   │   ├── (app)/         ← board, list, templates, settings, admin (yêu cầu đăng nhập)
│   │   └── api/
│   ├── middleware.ts      ← chặn route khi chưa đăng nhập
│   ├── components/
│   ├── lib/
│   │   ├── auth.ts              ← cấu hình Better Auth
│   │   ├── template-engine.ts   ← render {{key}}, tính hạn
│   │   ├── reminders.ts         ← scheduleReminders()
│   │   ├── env.ts               ← đọc & kiểm tra biến môi trường
│   │   └── telegram/            ← gửi tin, xử lý nút bấm, liên kết tài khoản
│   └── worker/index.ts          ← quét reminder + chạy bot Telegram
└── tests/
```

## Phương án thay thế

- **Đơn giản nhất**: Google Sheets + Apps Script (form = Google Form, nhắc qua email). Nhanh nhưng khó mở rộng.
- **App desktop**: Tauri/Electron — thông báo hệ điều hành ổn định nhưng chỉ dùng trên 1 máy.
- **Mobile native**: React Native/Flutter — để sau nếu thật sự cần.

## Deploy (khi cần dùng thật)

App được phát hành dưới dạng **Docker image** — chi tiết ở [08-dong-goi-docker.md](08-dong-goi-docker.md).

- Phát triển local trên Mac (Postgres trong Docker, app chạy `npm run dev`).
- Người khác tự host: tải `docker-compose.yml` + `.env`, chạy `docker compose up -d`.
- Bạn muốn tự mở một bản cho mọi người dùng chung: chạy đúng compose đó trên 1 VPS có tên miền, bật profile `https`.
