# 8. Đóng gói Docker

**Mục tiêu:** người khác chỉ cần cài Docker, tải 2 file, chạy 1 lệnh là có app chạy trên máy / server của họ. Mỗi bản cài (instance) có database riêng, nhiều người dùng đăng nhập Google vào bản cài đó.

## 8.1 Trải nghiệm của người cài

```bash
mkdir managementtask && cd managementtask
curl -O https://raw.githubusercontent.com/Son30-kins/managementtask/main/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/Son30-kins/managementtask/main/.env.example

# tạo Google OAuth client + Telegram bot (xem 8.10), rồi điền vào .env
docker compose up -d
```

Mở `http://localhost:3000` → **Đăng nhập bằng Google** → người đăng nhập đầu tiên tự động là **admin** → dùng.

**Cập nhật lên bản mới:**
```bash
docker compose pull && docker compose up -d
```
Migration database tự chạy khi container khởi động — người cài không phải làm gì thêm.

## 8.2 Các container

```
┌──────────────────────── docker compose ────────────────────────┐
│                                                                │
│  app      (image managementtask)  → next start, cổng 3000      │
│  worker   (cùng image)            → node worker.js — nhắc việc │
│  db       (postgres:17-alpine)    → volume pgdata              │
│  caddy    (tuỳ chọn, profile)     → HTTPS tự động cho tên miền │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

- **Một image duy nhất** cho cả `app` và `worker`, chỉ khác lệnh chạy → build 1 lần, phiên bản luôn khớp nhau.
- `worker` tách riêng để web restart không làm mất nhắc việc và ngược lại.
- `db` chỉ mở trong mạng nội bộ của compose, không public cổng ra ngoài.
- `caddy` bật bằng `docker compose --profile https up -d` khi có tên miền.

## 8.3 `docker-compose.yml` (dự kiến)

```yaml
services:
  app:
    image: sonnld3007/managementtask:${APP_VERSION:-latest}
    env_file: .env
    environment:
      DATABASE_URL: postgres://mt:${POSTGRES_PASSWORD}@db:5432/managementtask
    ports: ["3000:3000"]
    depends_on:
      db: { condition: service_healthy }
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
    restart: unless-stopped

  worker:
    image: sonnld3007/managementtask:${APP_VERSION:-latest}
    command: ["node", "worker.js"]
    env_file: .env
    environment:
      DATABASE_URL: postgres://mt:${POSTGRES_PASSWORD}@db:5432/managementtask
    depends_on:
      db: { condition: service_healthy }
    restart: unless-stopped

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: mt
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: managementtask
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mt"]
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    profiles: ["https"]
    command: caddy reverse-proxy --from ${DOMAIN} --to app:3000
    ports: ["80:80", "443:443"]
    volumes: ["caddy_data:/data"]
    restart: unless-stopped

volumes:
  pgdata:
  caddy_data:
```

## 8.4 Cấu hình bằng biến môi trường (`.env.example`)

| Biến | Bắt buộc | Mặc định | Ghi chú |
|---|---|---|---|
| `APP_URL` | ✅ | `http://localhost:3000` | Địa chỉ người dùng truy cập — dùng cho link trong email |
| `AUTH_SECRET` | ✅ | — | Chuỗi ngẫu nhiên ≥ 32 ký tự (`openssl rand -base64 32`). App **từ chối khởi động** nếu thiếu |
| `POSTGRES_PASSWORD` | ✅ | — | Mật khẩu database |
| `APP_VERSION` | | `latest` | Ghim phiên bản image, ví dụ `1.2.3` |
| `TZ` | | `Asia/Ho_Chi_Minh` | Múi giờ mặc định cho người dùng mới |
| `GOOGLE_CLIENT_ID` | ✅ | — | OAuth client của chính người cài (xem 8.10) |
| `GOOGLE_CLIENT_SECRET` | ✅ | — | 🔒 Bí mật |
| `ALLOWED_EMAILS` | | — | Giá trị ban đầu, ví dụ `a@gmail.com,b@gmail.com`; admin sửa tiếp trong app |
| `ALLOWED_DOMAINS` | | — | Ví dụ `congty.com` — để trống = mọi tài khoản Google |
| `TELEGRAM_BOT_TOKEN` | Nên có | — | 🔒 Bí mật. Thiếu thì app vẫn chạy nhưng không gửi được nhắc việc tới điện thoại, admin thấy cảnh báo |
| `DOMAIN` | | — | Chỉ cần khi dùng profile `https` |

**Nguyên tắc:**
- Bắt buộc: `APP_URL`, `AUTH_SECRET`, `POSTGRES_PASSWORD`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Thiếu biến nào → app **từ chối khởi động** và báo rõ thiếu gì.
- **Không có giá trị mặc định cho bí mật** — mỗi bản cài tự tạo bí mật của riêng mình.
- Telegram: worker dùng *long polling* → không cần tên miền public, chạy được cả trên máy cá nhân.

## 8.5 Dockerfile

Multi-stage, dựa trên `node:22-alpine`:

1. **deps** — `npm ci`
2. **build** — `prisma generate`, `next build` với `output: "standalone"`, bundle `worker.ts` → `worker.js`
3. **runner** — chỉ copy `.next/standalone`, `.next/static`, `public`, `prisma/`, `worker.js`
   - chạy bằng user không phải root
   - `ENTRYPOINT` = `docker-entrypoint.sh`: chạy `prisma migrate deploy` (chỉ ở container `app`) → rồi `exec` lệnh chính
   - `HEALTHCHECK` gọi `/api/health` (kiểm tra kết nối DB)

Mục tiêu kích thước image: < 250 MB.

## 8.6 Phát hành image — Docker Hub

**Mô hình:** chỉ phát hành image, ai muốn thì tự cài. Không vận hành bản cài chung nào.

- Repo **public** trên Docker Hub: `sonnld3007/managementtask`.
- **Tag:**
  | Tag | Ý nghĩa |
  |---|---|
  | `1.2.3` | Đúng một phiên bản — khuyên người cài ghim tag này (`APP_VERSION` trong `.env`) |
  | `1.2`, `1` | Tự nhận bản vá / bản nhỏ mới nhất |
  | `latest` | Bản ổn định mới nhất |
- **GitHub Actions** (`.github/workflows/release.yml`): khi push tag git `v1.2.3` →
  1. chạy test
  2. build **đa kiến trúc** `linux/amd64` + `linux/arm64` (server thường, Mac chip M, Raspberry Pi) bằng `docker/build-push-action`
  3. đăng nhập Docker Hub bằng secrets `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN` (Access Token tạo trong Docker Hub → Account settings, **không dùng mật khẩu**)
  4. đẩy các tag ở bảng trên
  5. cập nhật trang mô tả (Overview) trên Docker Hub từ file `DOCKERHUB.md`
- **Trang Overview trên Docker Hub** là nơi người cài nhìn thấy đầu tiên, nên chứa luôn: cài nhanh, nội dung `docker-compose.yml`, bảng biến môi trường, link tài liệu đầy đủ.
- Ghi chú thay đổi (changelog) cho mỗi bản, cảnh báo nếu có thay đổi cần làm tay.

**Phân phối file `docker-compose.yml` và `.env.example`:** nếu repo mã nguồn public trên GitHub thì người cài tải qua link raw như 8.1. Nếu repo private thì đặt 2 file này trên trang Overview của Docker Hub để người cài copy.

## 8.7 Quản trị bản cài

- **Người đăng nhập đầu tiên = admin.** Admin có trang quản lý: danh sách người dùng, khoá / xoá tài khoản, danh sách email / tên miền được phép đăng nhập.
- **Sao lưu:**
  ```bash
  docker compose exec db pg_dump -U mt managementtask > backup-$(date +%F).sql
  ```
- **Khôi phục:**
  ```bash
  docker compose exec -T db psql -U mt managementtask < backup-2026-10-24.sql
  ```
- Dữ liệu nằm trong volume `pgdata` — `docker compose down` **không** xoá dữ liệu; chỉ `down -v` mới xoá.

## 8.8 Môi trường phát triển

- `docker-compose.dev.yml`: chỉ chạy `db` (Postgres), app chạy `npm run dev` ngoài Docker để hot-reload nhanh.
- Trước khi phát hành: build image thật và chạy `docker compose up` từ thư mục trống, làm đúng các bước ở 8.1 để kiểm tra.

## 8.9 Tài liệu cho người cài

`README.md` ở gốc repo có:
1. Yêu cầu: Docker 24+ với Docker Compose v2
2. Cài nhanh (đúng như 8.1)
3. Bảng biến môi trường
4. Tạo Google OAuth client và Telegram bot (như 8.10, có ảnh chụp từng bước)
5. Bật HTTPS với tên miền
6. Cập nhật, sao lưu, khôi phục
7. Xử lý lỗi thường gặp (cổng 3000 bị chiếm, thiếu biến bắt buộc, Google báo `redirect_uri_mismatch`, bot không trả lời)

## 8.10 Người cài tự tạo Google OAuth & Telegram bot

Mỗi bản cài dùng **thông tin xác thực riêng** — không dùng chung key của tác giả (key của tác giả không bao giờ nằm trong image hay repo).

**Google OAuth client** (~5 phút):
1. Vào Google Cloud Console → tạo project → **APIs & Services → OAuth consent screen**: chọn *External*, điền tên app, email.
2. **Credentials → Create credentials → OAuth client ID** → loại *Web application*.
3. **Authorized redirect URI**: `<APP_URL>/api/auth/callback/google`
   - chạy trên máy: `http://localhost:3000/api/auth/callback/google`
   - có tên miền: `https://task.example.com/api/auth/callback/google`
4. Copy Client ID + Client Secret vào `.env`.

**Giới hạn của Google cần ghi rõ cho người cài:**
- Google chỉ chấp nhận redirect về `localhost` hoặc **tên miền có HTTPS**. Truy cập bằng IP mạng LAN (ví dụ `http://192.168.1.10:3000`) sẽ **không** đăng nhập được → muốn dùng từ điện thoại / máy khác thì cần tên miền + profile `https`.
- Consent screen ở chế độ *Testing* chỉ cho tối đa 100 tài khoản test được thêm tay; dùng rộng hơn thì bấm *Publish app* (scope chỉ `openid email profile` nên thường không cần Google duyệt).

**Telegram bot** (~2 phút):
1. Chat với `@BotFather` → `/newbot` → đặt tên → nhận token.
2. Dán token vào `TELEGRAM_BOT_TOKEN` trong `.env`.
3. Một bot chỉ chạy cho **một** bản cài (long polling không dùng chung được).
