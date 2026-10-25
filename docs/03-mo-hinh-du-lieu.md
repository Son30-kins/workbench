# 3. Mô hình dữ liệu

Định nghĩa thật: migration Flyway [V1__init.sql](../backend/src/main/resources/db/migration/V1__init.sql) + entity JPA trong `backend/src/main/java/…/domain/`. Hibernate chỉ kiểm tra schema khớp (`ddl-auto: validate`), không tự sửa bảng — muốn đổi schema thì thêm file `V2__….sql`.

```
users 1───* spring_session (+ _attributes)   (phiên đăng nhập — Spring Session JDBC quản lý)
  │
  ├──* notification_channels   (Telegram của người đó)
  ├──* notifications           (chuông thông báo trong app)
  │
  ├──* templates   (fields + rules dạng JSON)
  │      └──* template_runs (mỗi lần điền form) 1───* tasks
  │
  └──* tasks 1───* subtasks
           └──* reminders   (lịch nhắc — job @Scheduled quét)

app_settings   (cài đặt cả bản cài: danh sách email/tên miền được phép, tên bot Telegram)
```

**Nguyên tắc nhiều người dùng:** mọi bảng dữ liệu chính đều có `user_id`; bảng con (`subtasks`) thuộc người dùng qua bảng cha. Các port repository trong `domain/` **không có hàm nào** cho người dùng đọc/sửa chỉ bằng id — luôn kèm `user_id` của người đang đăng nhập (`findOwned`, `deleteOwned`). Test: `backend/src/test/java/…/application/DataIsolationTests.java`.

## Các bảng

### `users`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | Hibernate sinh |
| google_subject | text | claim `sub` của Google — định danh không đổi, unique |
| name, email, image | text | lấy từ Google; email unique |
| role | text `ADMIN` / `USER` (CHECK) | người đăng nhập đầu tiên của bản cài là `ADMIN` |
| banned | bool | admin khoá → xoá mọi phiên đăng nhập |
| timezone | text | mặc định theo `TZ` của bản cài (`Asia/Ho_Chi_Minh`) |
| settings | jsonb | lịch nhắc theo ưu tiên, giờ yên lặng, bản tin buổi sáng (record `UserSettings`) |
| last_digest_on | date | ngày (giờ địa phương) đã gửi bản tin — chống gửi trùng |

### `spring_session`, `spring_session_attributes`
Phiên đăng nhập của Spring Session JDBC (schema chính thức). `principal_name` = id người dùng → khoá tài khoản xoá được mọi phiên của người đó. Không lưu mật khẩu (chỉ đăng nhập Google).

### `app_settings`
| key | value |
|---|---|
| `access_policy` | `{ allowedEmails, allowedDomains, registrationOpen }` — chưa lưu thì lấy `ALLOWED_EMAILS` / `ALLOWED_DOMAINS` từ `.env` |
| `telegram_bot` | `{ username }` — worker ghi khi kết nối bot thành công |

### `templates`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id, user_id | text | |
| name, description | text | |
| fields | jsonb | `[{ key, label, type, required, options, defaultValue }]` — type: `TEXT`, `TEXTAREA`, `NUMBER`, `DATE`, `DATETIME`, `SELECT`, `CHECKBOX` |
| rules | jsonb | `[{ id, title, description, priority, due: { anchor, offsetDays, offsetHours, time }, condition, subtasks, tags }]` |

Lưu dạng JSON (thay vì bảng con) vì luôn đọc/ghi cả template một lần; cấu trúc được kiểm tra bằng Bean Validation trên record `TemplateField` / `TemplateRule` + `TemplateValidator` — mã trường không trùng, biến `{{...}}` phải tồn tại, mốc hạn phải là trường ngày.

`due.anchor`: `null` = không có hạn · `__submitted__` = lúc điền form · mã một trường `DATE`/`DATETIME`. Mốc là ngày mà không đặt giờ → 23:59.

### `template_runs`
| id | user_id | template_id (set null khi xoá template) | template_name | values (jsonb) | task_count | created_at |

### `tasks`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id, user_id | text | |
| title, description | text | |
| due_at | timestamptz | nullable |
| priority | text `URGENT` / `HIGH` / `MEDIUM` / `LOW` (CHECK) | cột `priority_rank` (generated) dùng để sắp xếp |
| status | text `TODO` / `IN_PROGRESS` / `DONE` / `CANCELLED` | |
| tags | text[] | |
| template_run_id, template_name | | nguồn gốc nếu sinh từ form mẫu |
| completed_at | timestamptz | đặt khi chuyển sang `DONE` |

Index `(user_id, status, due_at)`.

### `subtasks`
| id | task_id | title | done | position |

### `reminders`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| task_id, user_id | | |
| kind | text `BEFORE_DUE` / `OVERDUE` / `SNOOZE` | |
| fire_at | timestamptz | index `(status, fire_at)` |
| status | text `PENDING` / `SENT` / `CANCELLED` / `FAILED` | |
| sent_at, last_error | | |

Sinh lại mỗi khi hạn / ưu tiên / trạng thái task đổi, hoặc khi người dùng đổi cài đặt nhắc (`application/reminder/ReminderService`).

### `notifications`
| id | user_id | task_id | title | body | read_at | created_at |

### `notification_channels`
| Cột | Ghi chú |
|---|---|
| user_id, type (`TELEGRAM`) | unique theo cặp |
| chat_id, username | Telegram của người dùng |
| enabled | |
| link_token_hash, link_token_expires_at | mã liên kết dùng 1 lần, chỉ lưu bản băm SHA-256, hết hạn sau 10 phút |

## Ghi chú

- Lưu thời gian dạng UTC (`timestamptz`), hiển thị và tính toán theo `user.timezone`.
- Xoá người dùng → xoá dây chuyền toàn bộ dữ liệu của họ.
- Worker lấy nhắc việc bằng `SELECT … FOR UPDATE SKIP LOCKED` và đánh dấu `SENT` trong cùng transaction → không gửi trùng.
- Sau này làm việc nhóm: thêm `workspaces`, `workspace_members`, cột `assignee_id` trên `tasks`.
