# ManagementTask

App quản lý công việc tự host bằng Docker: điền **form mẫu** → app **tự sinh task**, có **mức độ ưu tiên**, **nhắc việc qua Telegram** khi sắp đến hạn. Đăng nhập bằng Google, nhiều người dùng, dữ liệu riêng từng người.

[![CI](https://github.com/Son30-kins/managementtask/actions/workflows/ci.yml/badge.svg)](https://github.com/Son30-kins/managementtask/actions/workflows/ci.yml)
[![Docker Hub](https://img.shields.io/docker/v/sonnld3007/managementtask?label=docker%20hub)](https://hub.docker.com/r/sonnld3007/managementtask)

## Tính năng

- **Form mẫu → nhiều task**: tự định nghĩa form (chữ, số, ngày, lựa chọn, có/không) và quy tắc sinh task. Tiêu đề dùng biến `{{ten_truong}}`, hạn chót tính tương đối theo một trường ngày ("trước hạn nộp 2 ngày, lúc 17:00"), task có điều kiện, task con, nhãn. Xem trước rồi mới tạo.
- **Bảng Kanban** kéo thả (Cần làm / Đang làm / Hoàn thành) và **danh sách**; lọc Hôm nay / Quá hạn / 7 ngày tới; tìm kiếm.
- **4 mức ưu tiên** — Khẩn cấp, Cao, Trung bình, Thấp — mỗi mức có lịch nhắc riêng.
- **Nhắc việc qua Telegram** với nút ✅ Xong / ⏰ Hoãn ngay trong tin nhắn; nhắc lại khi quá hạn; bản tin buổi sáng; giờ yên lặng.
- **Chuông thông báo** trong app, **Sáng / Tối**, dùng được trên điện thoại.
- **Quản trị**: người đăng nhập đầu tiên là admin; giới hạn email / tên miền được đăng nhập; khoá tài khoản.

## Cài đặt

Xem hướng dẫn đầy đủ trên [Docker Hub](https://hub.docker.com/r/sonnld3007/managementtask) hoặc [docs/08-dong-goi-docker.md](docs/08-dong-goi-docker.md).

```bash
mkdir managementtask && cd managementtask
curl -O https://raw.githubusercontent.com/Son30-kins/managementtask/main/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/Son30-kins/managementtask/main/.env.example
# điền .env (Google OAuth, Telegram bot, mật khẩu…)
docker compose up -d
```

## Phát triển

Cần Node.js 24+, Docker.

```bash
git clone https://github.com/Son30-kins/managementtask.git
cd managementtask
brew install gitleaks                    # bắt buộc — quét bí mật trước mỗi commit
git config core.hooksPath .githooks      # bật hook chặn commit có bí mật
npm ci
cp .env.example .env.local               # điền key dev của riêng bạn (Google OAuth client cho localhost)
# trong .env.local: DATABASE_URL=postgres://mt@127.0.0.1:5433/managementtask
npm run db:up                            # Postgres cho dev (chỉ mở trên 127.0.0.1)
npm run db:migrate
npm run dev                              # web: http://localhost:3000
npm run worker                           # nhắc việc + bot Telegram (cửa sổ terminal khác)
```

| Lệnh | Việc |
|---|---|
| `npm test` | Unit test + test phân quyền dữ liệu (cần `DATABASE_URL`) |
| `npm run typecheck` / `npm run lint` | Kiểm tra kiểu / lint |
| `npm run db:generate` | Sinh migration sau khi sửa `src/db/schema.ts` |
| `npm run build` | Build web + worker |

Công nghệ: Next.js 16, TypeScript, Tailwind CSS 4, Drizzle ORM + PostgreSQL, Better Auth (Google), grammY (Telegram), Vitest.

## Phát hành

Tạo tag `vX.Y.Z` trên `main` → GitHub Actions test, quét bí mật & lỗ hổng, build `linux/amd64` + `linux/arm64` và đẩy lên Docker Hub.

## Bảo mật

- Không commit `.env`, key, token, mật khẩu — hook pre-commit và CI (gitleaks) sẽ chặn.
- Image trên Docker Hub không chứa bí mật nào; khoá nội bộ được sinh riêng cho từng bản cài lúc khởi động.
- Phát hiện lỗ hổng: báo riêng qua [GitHub Security Advisories](https://github.com/Son30-kins/managementtask/security/advisories/new), không tạo issue công khai.

Chi tiết: [docs/09-git-va-bao-mat.md](docs/09-git-va-bao-mat.md) · Tài liệu thiết kế: [docs/](docs/README.md)

## Ghi nguồn & giấy phép

Giao diện tham khảo [To do list dashboard (Freebie)](https://www.figma.com/community) trên Figma Community. Mã nguồn theo giấy phép [MIT](LICENSE).
