# 4. Kiến trúc & công nghệ

## Công nghệ

| Lớp | Công nghệ | Lý do |
|---|---|---|
| Ngôn ngữ | TypeScript | Một ngôn ngữ cho web, worker, test |
| Framework | Next.js 16 (App Router, Server Actions, `output: "standalone"`) | UI + API trong một project; build gọn cho Docker |
| UI | Tailwind CSS 4, lucide-react, dnd-kit | Token màu theo Figma, kéo thả board |
| Database | PostgreSQL 17 | |
| ORM | Drizzle ORM + drizzle-kit | Migration là file SQL; chạy migration bằng script nhỏ trong image, không cần CLI |
| Đăng nhập | Better Auth + Google OAuth | Phiên, state/PKCE, liên kết tài khoản |
| Ngày giờ | date-fns 4 + @date-fns/tz | Hạn tương đối, múi giờ, giờ yên lặng |
| Kiểm tra dữ liệu | Zod 4 | Form, template, cấu hình `.env` |
| Telegram | grammY (long polling) | Không cần tên miền public |
| Test | Vitest (unit + test tích hợp với Postgres) | |
| Đóng gói | Docker multi-stage, Docker Compose, image trên Docker Hub | Xem [08-dong-goi-docker.md](08-dong-goi-docker.md) |

## Sơ đồ

```
┌──────────────┐      ┌─────────────────────────────┐      ┌────────────┐
│  Trình duyệt │◄────►│ app (Next.js)               │◄────►│ PostgreSQL │
└──────▲───────┘      │ - trang + Server Actions    │      └─────▲──────┘
       │ đăng nhập    │ - /api/auth (Better Auth)   │            │
       ▼              │ - /api/health               │            │
   Google OAuth       └─────────────────────────────┘            │
                      ┌─────────────────────────────┐            │
       Telegram ◄────►│ worker (cùng image)         ├────────────┘
                      │ - quét reminders mỗi 30 giây │
                      │ - bản tin buổi sáng          │
                      │ - bot Telegram (long polling)│
                      └─────────────────────────────┘
```

## Luồng chính

**Đăng nhập Google & phân quyền**
1. "Đăng nhập bằng Google" → Google → `APP_URL/api/auth/callback/google`.
2. Hook tạo tài khoản: chỉ nhận email đã xác minh, kiểm tra danh sách email / tên miền được phép và trạng thái mở đăng ký; người đầu tiên → `ADMIN`; tạo sẵn 3 form mẫu.
3. Hook tạo phiên: tài khoản bị khoá → từ chối.
4. `proxy.ts` chặn sớm khi chưa có cookie phiên; mỗi trang / Server Action gọi `requireUser()` để kiểm tra thật.
5. `userId` luôn lấy từ phiên, không bao giờ nhận từ trình duyệt.

**Điền form → tạo task** ([src/core/template-engine.ts](../src/core/template-engine.ts))
1. Form render động từ `template.fields`.
2. "Xem trước": kiểm tra dữ liệu, thay `{{biến}}`, tính hạn theo múi giờ người dùng, bỏ task không thoả điều kiện, cảnh báo hạn trong quá khứ.
3. "Tạo N task": một transaction tạo `template_run` + các task + task con + lịch nhắc.

**Lịch nhắc** ([src/core/reminder-schedule.ts](../src/core/reminder-schedule.ts))
- Mỗi mốc = hạn − khoảng nhắc theo ưu tiên; bỏ mốc đã qua.
- Rơi vào giờ yên lặng (trừ Khẩn cấp) → dời tới lúc hết giờ yên lặng; nếu như vậy sẽ trễ hạn → nhắc sớm ngay trước giờ yên lặng.
- Luôn có 1 mốc "quá hạn" đúng lúc hết hạn; sau khi gửi, worker hẹn lần tiếp theo sau N giờ (mặc định 24).

**Worker** ([src/worker/](../src/worker/))
1. Mỗi 30 giây: lấy tối đa 50 reminder đến giờ (`FOR UPDATE SKIP LOCKED`), đánh dấu `SENT` ngay.
2. Bỏ qua task đã xong / người dùng bị khoá; tạo thông báo trong app; gửi Telegram nếu đã liên kết (nút ✅ Xong / ⏰ 1 giờ / 📅 Mai / 🔗 Mở).
3. Bản tin buổi sáng: đến giờ của từng người (theo múi giờ của họ), đánh dấu `last_digest_on` trước rồi mới gửi.
4. Bot: `/start <mã>` liên kết tài khoản, `/today`, nút bấm kiểm tra chat thuộc đúng chủ task.

## Cấu trúc thư mục

```
workbench/
├── docs/                      tài liệu
├── drizzle/                   migration SQL (sinh bằng npm run db:generate)
├── docker/build-keys.mjs      xoá khoá build khỏi image / sinh khoá riêng từng bản cài
├── Dockerfile, docker-entrypoint.sh, docker-compose.yml, docker-compose.dev.yml
├── scripts/build-node.mjs     bundle worker + migrate bằng esbuild
├── src/
│   ├── app/                   trang (login, (app)/…), /api/auth, /api/health
│   ├── actions/               Server Actions (kiểm tra đăng nhập rồi gọi server/)
│   ├── components/            UI: shell, tasks, templates, settings, admin
│   ├── core/                  logic thuần, có unit test: template engine, lịch nhắc, múi giờ
│   ├── db/                    schema, kết nối, migrate
│   ├── lib/                   env, Telegram API, tiện ích
│   ├── server/                lớp truy cập dữ liệu (luôn lọc theo user_id), auth, session
│   ├── worker/                worker: vòng xử lý, bot, nội dung tin nhắn
│   └── proxy.ts               chặn sớm khi chưa đăng nhập
└── tests/                     Vitest
```

## Triển khai

App phát hành dưới dạng Docker image — chi tiết ở [08-dong-goi-docker.md](08-dong-goi-docker.md).
