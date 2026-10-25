# 10. Backend Spring Boot — đọc code & mở rộng

Backend nằm trong [`backend/`](../backend): **Spring Boot 4.1**, **Java 25**, **Maven**, tổ chức theo
**DDD / kiến trúc lục giác (hexagonal)**, dùng **Lombok** cho code lặp lại.

## 10.1 Bốn tầng và quy tắc phụ thuộc

```
io.github.son30kins.workbench
├── domain/           ← LÕI: mô hình nghiệp vụ, không phụ thuộc web / Spring Data / Telegram
├── application/      ← USE CASE: điều phối domain, quản lý transaction
├── infrastructure/   ← ADAPTER kỹ thuật: JPA, Spring Security, Telegram, job định kỳ, cấu hình
└── interfaces/rest/  ← ADAPTER đầu vào HTTP: controller, DTO, đổi exception → HTTP status
```

**Quy tắc phụ thuộc** — mũi tên chỉ được hướng vào trong:

```
interfaces ──► application ──► domain ◄── infrastructure
                    │                          ▲
                    └── port (interface) ──────┘   infrastructure hiện thực các port
```

| Tầng | Được dùng | Không được dùng |
|---|---|---|
| `domain` | Java thuần, JPA annotation trên entity, Bean Validation, Lombok | Spring Web, Spring Data, Spring Security, HTTP status |
| `application` | `domain`, `@Service`, `@Transactional`, các port | `HttpServletRequest`, Spring Security, Spring Data |
| `infrastructure` | mọi thứ | — |
| `interfaces` | `application`, `domain`, `CurrentUser` | gọi thẳng repository |

Hai điểm thực dụng (cố ý, ghi rõ để bạn biết):
- **Entity domain mang annotation JPA.** DDD "thuần" tách entity domain và entity JPA rồi viết mapper;
  hầu hết dự án Spring chấp nhận gắn thẳng annotation để bớt code.
- **Body tạo/sửa form mẫu dùng thẳng `TemplateDefinition`** (value object của domain đã có Bean Validation)
  thay vì viết một DTO trùng y hệt.

## 10.2 Từng tầng có gì

### `domain/` — mô hình nghiệp vụ
| Gói | Nội dung |
|---|---|
| `task` | `Task` (aggregate, gồm `Subtask`), `Priority`, `TaskStatus`, `TaskView` (Hôm nay / Quá hạn / 7 ngày), `TaskSearch` (bộ lọc), `TaskRepository` (port) |
| `template` | `Template`, `TemplateRun`, value object `TemplateField` / `TemplateRule` / `TemplateDefinition`, **`TemplateEngine`** (thay biến, tính hạn), **`TemplateValidator`** (quy tắc liên trường), `DefaultTemplates` |
| `reminder` | `Reminder`, `ReminderKind`, **`ReminderSchedule`** (tính mốc nhắc, giờ yên lặng) |
| `user` | `User` (aggregate), `Role`, `UserSettings` (jsonb), `UserContext` |
| `notification` | `Notification`, `NotificationChannel` (Telegram) |
| `setting` | `AppSetting`, `AccessPolicy`, `TelegramBotInfo` |
| `shared` | `TimeZones` (java.time), `DomainException`, `NotFoundException`, `ValidationException`, `Violation` |

- **Entity giữ bất biến (invariant)**: không có setter tự do. Muốn đổi trạng thái gọi phương thức nghiệp vụ —
  `task.changeStatus(DONE, now)` tự ghi `completedAt`; `user.ban()`; `template.update(definition)`.
- **Domain service thuần** (`TemplateEngine`, `ReminderSchedule`): hàm static, "bây giờ" và múi giờ truyền vào
  → unit test không cần Spring, không cần DB.
- **Port repository** là interface Java thường, chỉ khai báo những gì nghiệp vụ cần, luôn kèm chủ sở hữu:
  `findOwned(taskId, userId)` chứ không có `findById` cho người dùng.

### `application/` — use case
- Mỗi service là một nhóm use case: `TaskService`, `TemplateService`, `UserProvisioningService`,
  `ReminderDeliveryService` (gửi nhắc), `DigestService` (bản tin), `TelegramCommandService` (lệnh bot)…
- `@Transactional` đặt ở đây. `ReminderService` dùng `Propagation.MANDATORY` — bắt buộc chạy trong transaction
  của nơi gọi để task và lịch nhắc luôn được lưu cùng nhau.
- **Port ra ngoài** (`application/port`): `TelegramGateway`, `SessionRevocation`. Use case gọi interface,
  infrastructure hiện thực — đổi cách gửi tin không phải sửa use case.
- Không biết gì về HTTP hay Spring Security: đăng nhập nhận `GoogleProfile` (record thuần), từ chối thì ném
  `LoginRejectedException`; adapter bảo mật đổi qua lại.

### `infrastructure/` — adapter
| Gói | Nội dung |
|---|---|
| `persistence` | Mỗi port có 1 **adapter** `@Repository` + 1 interface **Spring Data** (package-private). Truy vấn động dùng **Specification**; đếm dùng **JPQL constructor expression**; lấy việc đến hạn dùng **native query `FOR UPDATE SKIP LOCKED`** |
| `security` | `SecurityConfig`, `WorkbenchOidcUserService` (adapter đăng nhập), `CurrentUserFilter`, `RequestedByFilter` (chống CSRF), `CurrentUser` + argument resolver, `SessionRevoker` |
| `telegram` | `TelegramApi` (**HTTP interface `@PostExchange`** — chỉ viết interface, Spring sinh client), `TelegramClient` (hiện thực `TelegramGateway`, làm sạch token khỏi log), `TelegramBot` (`SmartLifecycle`, long polling trên **virtual thread**) |
| `scheduling` | `ScheduledJobs` — `@Scheduled` gọi use case định kỳ |
| `config` | `AppConfig` (`Clock`, OpenAPI, bật scheduling) |

### `interfaces/rest/` — HTTP
- Controller mỏng: nhận `CurrentUser`, gọi use case, đổi entity → DTO (`dto/response/*.from(...)`).
- `GlobalExceptionHandler` là **nơi duy nhất** quyết định exception nào thành HTTP status nào
  (`NotFoundException` → 404, `ValidationException` → 400 kèm `errors[]`, `InvalidFormValuesException` → 422).

## 10.3 Đường đi của một request: `POST /api/tasks`

```
Next.js Server Action ── POST /api/tasks {title, due:"2026-10-31T17:00", …}
  │  cookie WORKBENCH_SESSION + X-Requested-By
  ▼
RequestedByFilter        thiếu X-Requested-By → 403
Spring Security          đọc phiên từ bảng spring_session; chưa đăng nhập → 401
CurrentUserFilter        nạp User từ DB → CurrentUser (bị khoá → 401)
  ▼
TaskController.create(CurrentUser user, @Valid TaskRequest req)       ← interfaces
  │  Bean Validation lỗi → GlobalExceptionHandler → 400 {errors:[{path:"title",…}]}
  │  req.toData(user.zone())  "17:00 giờ VN" → Instant 10:00Z
  ▼
TaskService.create(owner, data)  @Transactional                        ← application
  │  new Task(owner.id()); task.apply(data, now)                        ← domain
  │  tasks.save(task)            → TaskRepositoryAdapter → Spring Data   ← infrastructure
  │  reminders.reschedule(task)  → ReminderSchedule.plan(...)            ← domain
  ▼
TaskResponse.from(task) → 201 JSON
```

## 10.4 Thêm một tính năng mới — làm theo thứ tự

Ví dụ: thêm **bình luận cho task**.

1. **Migration** `backend/src/main/resources/db/migration/V2__task_comments.sql` (Flyway tự chạy khi khởi động; không sửa V1).
2. **Domain** `domain/task/TaskComment.java` (entity, `@Getter`, `@NoArgsConstructor(access = PROTECTED)`,
   phương thức nghiệp vụ) + port `TaskCommentRepository` (chỉ các hàm cần, luôn kèm `userId`).
3. **Persistence** `infrastructure/persistence/TaskCommentSpringDataRepository` + `TaskCommentRepositoryAdapter`.
4. **Use case** `application/task/TaskCommentService` (`@Service @Transactional @RequiredArgsConstructor`);
   kiểm tra task thuộc người dùng qua `TaskRepository.findOwned`.
5. **REST** `interfaces/rest/TaskCommentController` + `dto/request/CommentRequest`, `dto/response/CommentResponse`.
6. **Test**: unit test cho logic domain; test tích hợp `@IntegrationTest` (Testcontainers) cho cách ly dữ liệu;
   test `MockMvcTester` cho 401 / 403 / 400.
7. **Frontend**: hàm đọc trong `frontend/src/server/queries.ts`, Server Action trong `frontend/src/actions/`.

## 10.5 Lombok — dùng gì, tránh gì

| Dùng | Ở đâu |
|---|---|
| `@Getter` + `@NoArgsConstructor(access = AccessLevel.PROTECTED)` | Entity (JPA cần constructor rỗng, không cho code khác gọi) |
| `@Getter(AccessLevel.NONE)` | Trường nội bộ không muốn lộ (ví dụ `User.timezone` — dùng `getZone()`) |
| `@RequiredArgsConstructor` | Service, adapter, controller — constructor injection cho field `final` |
| `@Slf4j` | Class cần ghi log |

**Không dùng** `@Data`, `@EqualsAndHashCode`, `@Setter` trên entity — `equals/hashCode` tự sinh dễ gây lỗi với
lazy loading và collection; [`lombok.config`](../backend/lombok.config) chặn `@Data` / `@EqualsAndHashCode` lúc biên dịch.
DTO và value object dùng **`record`** của Java (bất biến, có sẵn equals/hashCode/toString).

## 10.6 Tính năng Spring Boot 4 / Java 25 đáng chú ý trong code

- **Starter tách module** (Boot 4): `spring-boot-starter-webmvc`, `-security-oauth2-client`, `-flyway`, `-restclient`…
- **Jackson 3** (`tools.jackson.databind.JsonMapper`) cho API và cột jsonb (`hibernate.type.json_format_mapper`).
- **HTTP interface client** (`@PostExchange`) cho Telegram.
- **Virtual threads** (`spring.threads.virtual.enabled=true`) và `Thread.ofVirtual()` cho bot.
- **`@ConfigurationProperties` bằng record** (`WorkbenchProperties`) — kiểm tra kiểu cấu hình lúc khởi động.
- **Problem Details (RFC 9457)** cho mọi lỗi.
- **`MockMvcTester`** (AssertJ) trong test; **`@ServiceConnection`** + Testcontainers không cần cấu hình datasource.
- Java: `record`, pattern matching `instanceof`, switch expression, text block, `List.getFirst()`, `Math.clamp`.

## 10.7 Lệnh thường dùng

```bash
cd backend
./mvnw spring-boot:run                 # chạy API (đọc ../.env.local), Flyway tự cập nhật bảng
./mvnw test                            # toàn bộ test (cần Docker cho Testcontainers)
./mvnw test -Dtest=TemplateEngineTests # một lớp test
./mvnw -DskipTests package             # build target/app.jar
API_DOCS_ENABLED=true ./mvnw spring-boot:run   # mở Swagger UI: http://localhost:8080/swagger-ui.html
```
