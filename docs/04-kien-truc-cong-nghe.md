# 4. Kiến trúc & công nghệ

Từ v0.2.0 Workbench gồm **2 dịch vụ**: backend **Spring Boot 4** (Java 25) giữ toàn bộ nghiệp vụ, frontend
**Next.js** chỉ hiển thị giao diện. Hướng dẫn đọc code backend theo DDD: [10-backend-spring-boot.md](10-backend-spring-boot.md).

## Công nghệ

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| Backend | Spring Boot 4.1 (Spring Framework 7), Java 25, Maven | Virtual threads, `record`, HTTP interface client |
| Kiến trúc backend | DDD / hexagonal: `domain` · `application` · `infrastructure` · `interfaces` | Xem [10-backend-spring-boot.md](10-backend-spring-boot.md) |
| Dữ liệu | PostgreSQL 17, Spring Data JPA (Hibernate 7), Flyway | Cột jsonb (form mẫu, cài đặt) map bằng Jackson 3 |
| Đăng nhập | Spring Security OAuth2 Login (Google OIDC), Spring Session JDBC | Phiên lưu trong Postgres, cookie HttpOnly + SameSite=Lax |
| Telegram | RestClient + `@HttpExchange` (Spring 7), long polling trên virtual thread | Không cần tên miền public |
| Job định kỳ | `@Scheduled` + `FOR UPDATE SKIP LOCKED` | Mỗi lần nhắc chỉ gửi 1 lần kể cả chạy nhiều instance |
| Kiểm tra dữ liệu | Bean Validation (Jakarta) + `TemplateValidator` | Lỗi trả về dạng RFC 9457 Problem Details |
| Tài liệu API | springdoc-openapi (Swagger UI) | Chỉ bật khi dev: `API_DOCS_ENABLED=true` |
| Test backend | JUnit 6, AssertJ, MockMvc, Testcontainers (Postgres thật) | |
| Frontend | Next.js 16 (App Router, Server Actions), React 19, TypeScript | Không còn truy cập DB — gọi API |
| UI | Tailwind CSS 4, lucide-react, dnd-kit | Token màu theo Figma |
| Đóng gói | 2 image Docker (`workbench`, `workbench-api`), Docker Compose | Xem [08-dong-goi-docker.md](08-dong-goi-docker.md) |

## Sơ đồ

```
                     ┌──────────────────────────────┐        ┌────────────────────────────────────┐
┌──────────────┐     │ web — Next.js (cổng 3000)    │  HTTP  │ api — Spring Boot (cổng 8080)      │     ┌────────────┐
│  Trình duyệt │◄───►│ - trang + Server Actions     ├───────►│ - REST /api/** (cookie phiên)      │◄───►│ PostgreSQL │
└──────▲───────┘     │ - rewrite /api/auth/** ──────┼───────►│ - Spring Security + Google OIDC    │     └────────────┘
       │             └──────────────────────────────┘        │ - @Scheduled: nhắc việc, bản tin   │
       ▼                                                     │ - bot Telegram (long polling)      │◄───► Telegram
   Google OAuth ◄────────────────────────────────────────────┤                                    │
                                                             └────────────────────────────────────┘
```

- Trình duyệt **chỉ nói chuyện với web**. Web gọi API từ phía server (Server Component, Server Action),
  chuyển tiếp cookie `WORKBENCH_SESSION` và gửi header `X-Requested-By` (chống CSRF).
- Riêng các đường dẫn đăng nhập `/api/auth/**` được web **rewrite** sang API, để Spring Security xử lý
  OAuth2 và đặt cookie phiên trên cùng tên miền với web.
- Trong Docker, API và database **không mở cổng ra ngoài**.

## Luồng chính

**Đăng nhập Google & phân quyền**
1. Nút "Đăng nhập bằng Google" → `GET /api/auth/signin/google` (Spring) → Google → `GET /api/auth/callback/google`.
2. `WorkbenchOidcUserService` (infrastructure) đổi thông tin Google thành `GoogleProfile` rồi gọi use case
   `UserProvisioningService`: chỉ nhận email đã xác minh, áp chính sách email / tên miền / mở đăng ký,
   người đầu tiên → `ADMIN`, tạo sẵn 3 form mẫu. Từ chối → `/login?error=MÃ_LỖI`.
3. Phiên lưu trong bảng `spring_session`; `PRINCIPAL_NAME` = id người dùng → khoá tài khoản là đăng xuất mọi thiết bị.
4. Mỗi request, `CurrentUserFilter` đọc lại người dùng từ DB: bị khoá → 401; quyền admin lấy theo DB nên đổi quyền có hiệu lực ngay.
5. Controller nhận `CurrentUser` làm tham số; mọi use case nhận chủ dữ liệu và lọc theo `user_id`.

**Điền form → tạo task** (`domain/template/TemplateEngine`)
1. Form render động từ `template.fields`.
2. "Xem trước": kiểm tra dữ liệu, thay `{{biến}}`, tính hạn theo múi giờ người dùng (`java.time`), bỏ task không thoả điều kiện, cảnh báo hạn trong quá khứ.
3. "Tạo N task": một transaction tạo `template_run` + các task + task con + lịch nhắc.

**Lịch nhắc** (`domain/reminder/ReminderSchedule`)
- Mỗi mốc = hạn − khoảng nhắc theo ưu tiên; bỏ mốc đã qua.
- Rơi vào giờ yên lặng (trừ Khẩn cấp) → dời tới lúc hết giờ yên lặng; nếu như vậy sẽ trễ hạn → nhắc sớm ngay trước giờ yên lặng.
- Luôn có 1 mốc "quá hạn" đúng lúc hết hạn; sau khi gửi, hẹn lần tiếp theo sau N giờ (mặc định 24).

**Job định kỳ** (`infrastructure/scheduling/ScheduledJobs` → `application/reminder/*`)
1. Mỗi 30 giây: lấy tối đa 50 lần nhắc đến giờ (`FOR UPDATE SKIP LOCKED`), đánh dấu `SENT` trong cùng transaction.
2. Bỏ qua task đã xong / người dùng bị khoá; tạo thông báo trong app; gửi Telegram **ngoài transaction** nếu đã liên kết.
3. Bản tin buổi sáng: đến giờ của từng người (theo múi giờ của họ), đánh dấu `last_digest_on` trước rồi mới gửi.
4. Bot: `/start <mã>` liên kết tài khoản, `/today`, nút ✅ Xong / ⏰ 1 giờ / 📅 Mai kiểm tra chat thuộc đúng chủ task.

## Cấu trúc thư mục

```
workbench/
├── backend/                         Spring Boot 4 (Maven) — chi tiết: 10-backend-spring-boot.md
│   ├── src/main/java/…/workbench/
│   │   ├── domain/                  entity, value object, domain service, port repository
│   │   ├── application/             use case (@Service @Transactional), port ra ngoài
│   │   ├── infrastructure/          JPA adapter, security, telegram, scheduling, config
│   │   └── interfaces/rest/         controller, DTO, xử lý lỗi
│   ├── src/main/resources/          application.yml, db/migration (Flyway)
│   ├── src/test/java/               JUnit + Testcontainers
│   └── Dockerfile
├── frontend/                        Next.js
│   ├── src/app/                     trang (login, (app)/…), /api/health
│   ├── src/actions/                 Server Actions → gọi API
│   ├── src/server/                  client API (chỉ chạy phía server), session, queries
│   ├── src/components/              UI: shell, tasks, templates, settings, admin
│   ├── src/core/                    nhãn, định dạng ngày giờ, kiểu form mẫu (dùng cho UI)
│   └── Dockerfile, docker-entrypoint.sh, docker/build-keys.mjs
├── docker-compose.yml               cài đặt cho người dùng (web + api + db + caddy)
├── docker-compose.dev.yml           Postgres cho dev
└── docs/                            tài liệu
```

## Triển khai

App phát hành dưới dạng 2 Docker image — chi tiết ở [08-dong-goi-docker.md](08-dong-goi-docker.md).
