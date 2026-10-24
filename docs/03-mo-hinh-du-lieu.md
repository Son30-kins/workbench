# 3. Mô hình dữ liệu

Định nghĩa thật trong code: [src/db/schema.ts](../src/db/schema.ts) (Drizzle ORM, PostgreSQL). Migration sinh tự động trong [drizzle/](../drizzle/).

```
user 1───* session / account / verification   (đăng nhập Google — Better Auth quản lý)
  │
  ├──* notification_channels   (Telegram của người đó)
  ├──* notifications           (chuông thông báo trong app)
  │
  ├──* templates   (fields + rules dạng JSON)
  │      └──* template_runs (mỗi lần điền form) 1───* tasks
  │
  └──* tasks 1───* subtasks
           └──* reminders   (lịch nhắc — worker quét)

app_settings   (cài đặt cả bản cài: danh sách email/tên miền được phép, tên bot Telegram)
```

**Nguyên tắc nhiều người dùng:** mọi bảng dữ liệu chính đều có `user_id`; bảng con (`subtasks`) thuộc người dùng qua bảng cha. Lớp truy cập dữ liệu ([src/server/](../src/server/)) **không có hàm nào** đọc/sửa chỉ bằng id — luôn kèm `user_id` của người đang đăng nhập. Test: [tests/data-isolation.test.ts](../tests/data-isolation.test.ts).

## Các bảng

### `user`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | text | Better Auth sinh |
| name, email, image | text | lấy từ Google; email unique |
| email_verified | bool | chỉ nhận tài khoản Google đã xác minh |
| role | enum `ADMIN` / `USER` | người đăng nhập đầu tiên của bản cài là `ADMIN` |
| banned | bool | admin khoá → xoá mọi phiên đăng nhập |
| timezone | text | mặc định theo `TZ` của bản cài (`Asia/Ho_Chi_Minh`) |
| settings | jsonb | lịch nhắc theo ưu tiên, giờ yên lặng, bản tin buổi sáng ([src/core/user-settings.ts](../src/core/user-settings.ts)) |
| last_digest_on | text | ngày (giờ địa phương) đã gửi bản tin — chống gửi trùng |

### `session`, `account`, `verification`
Bảng của Better Auth. `account` chỉ chứa liên kết Google (không có mật khẩu).

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

Lưu dạng JSON (thay vì bảng con) vì luôn đọc/ghi cả template một lần; cấu trúc được kiểm tra bằng Zod ([src/core/template-schema.ts](../src/core/template-schema.ts)) — mã trường không trùng, biến `{{...}}` phải tồn tại, mốc hạn phải là trường ngày.

`due.anchor`: `null` = không có hạn · `__submitted__` = lúc điền form · mã một trường `DATE`/`DATETIME`. Mốc là ngày mà không đặt giờ → 23:59.

### `template_runs`
| id | user_id | template_id (set null khi xoá template) | template_name | values (jsonb) | task_count | created_at |

### `tasks`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id, user_id | text | |
| title, description | text | |
| due_at | timestamptz | nullable |
| priority | enum `URGENT` / `HIGH` / `MEDIUM` / `LOW` | |
| status | enum `TODO` / `IN_PROGRESS` / `DONE` / `CANCELLED` | |
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
| kind | enum `BEFORE_DUE` / `OVERDUE` / `SNOOZE` | |
| fire_at | timestamptz | index `(status, fire_at)` |
| status | enum `PENDING` / `SENT` / `CANCELLED` / `FAILED` | |
| sent_at, last_error | | |

Sinh lại mỗi khi hạn / ưu tiên / trạng thái task đổi, hoặc khi người dùng đổi cài đặt nhắc ([src/server/reminders.ts](../src/server/reminders.ts)).

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
