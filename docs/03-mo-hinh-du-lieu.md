# 3. Mô hình dữ liệu

```
User 1───* Session / Account / Verification   (đăng nhập — do thư viện auth quản lý)
  │
  ├──* NotificationChannel   (Telegram của người đó; mở rộng kênh khác sau)
  │
  ├──* Task *───* Tag
  │      │
  │      └──* Reminder
  │      └──* Subtask
  │
  └──* Template 1───* TemplateField
             │
             └──* TemplateTaskRule
             └──* TemplateRun  (mỗi lần điền form) 1───* Task
```

**Nguyên tắc nhiều người dùng:** mọi bảng dữ liệu chính (`tasks`, `templates`, `tags`, `template_runs`, `notification_channels`) đều có `user_id`. Bảng con (`subtasks`, `reminders`, `template_fields`…) thuộc về người dùng thông qua bảng cha.

## Các bảng

### `users`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | uuid | |
| name | text | |
| email | text | **unique** — lấy từ Google |
| image | text | avatar từ Google, nullable |
| role | enum | ADMIN / USER — người đăng nhập đầu tiên của bản cài là ADMIN |
| banned | bool | admin khoá tài khoản |
| timezone | text | mặc định `Asia/Ho_Chi_Minh` |
| settings | json | lịch nhắc theo ưu tiên, giờ yên lặng |
| created_at / updated_at | timestamp | |

### Bảng xác thực: `sessions`, `accounts`, `verifications`
Do thư viện auth (Better Auth) tự tạo và quản lý — không tự viết logic.

| Bảng | Dùng để |
|---|---|
| `sessions` | Phiên đăng nhập (token, hạn, IP, thiết bị) |
| `accounts` | Liên kết tài khoản Google (`provider = google`, Google user id). Không lưu mật khẩu |
| `verifications` | Dữ liệu tạm của luồng OAuth (state) |

### `app_settings`
Cài đặt của cả bản cài, admin chỉnh trong trang Quản trị.

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| key | text | `allowed_emails`, `allowed_domains`, `registration_open` |
| value | json | |

### `notification_channels`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | uuid | |
| user_id | fk | |
| type | enum | TELEGRAM (để enum để sau thêm kênh khác) |
| target | text | Telegram `chat_id`, nullable khi chưa kết nối xong |
| telegram_username | text | hiển thị trong Cài đặt |
| enabled | bool | |
| link_token | text | nullable — mã tạm để liên kết Telegram, **lưu dạng hash** |
| link_token_expires_at | timestamp | hết hạn sau 10 phút |

### `tasks`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | uuid | |
| user_id | fk | |
| title | text | |
| description | text | |
| due_at | timestamp (UTC) | nullable |
| priority | enum | URGENT/HIGH/MEDIUM/LOW |
| status | enum | TODO/IN_PROGRESS/DONE/CANCELLED |
| template_run_id | fk | nullable — task sinh từ form nào |
| completed_at | timestamp | |
| created_at / updated_at | timestamp | |

### `subtasks`
| id | task_id | title | done | position |

### `tags`, `task_tags`
Quan hệ nhiều-nhiều. `tags` có `user_id` — tên tag unique theo từng người dùng.

### `templates`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | uuid | |
| user_id | fk | |
| name | text | "Báo cáo tuần" |
| description | text | |
| recurrence | text | nullable — cron/RRULE cho template lặp lại (giai đoạn sau) |

### `template_fields`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | uuid | |
| template_id | fk | |
| key | text | `ngay_nop` — dùng trong `{{...}}` |
| label | text | "Hạn nộp" |
| type | enum | TEXT/NUMBER/DATE/DATETIME/SELECT/CHECKBOX |
| options | json | cho SELECT |
| required | bool | |
| default_value | text | |
| position | int | |

### `template_task_rules`
Mỗi dòng = 1 task sẽ được sinh ra.

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | uuid | |
| template_id | fk | |
| title_tpl | text | `"Viết báo cáo tuần {{tuan}}"` |
| description_tpl | text | |
| priority | enum | |
| due_anchor | text | key của trường ngày, hoặc `submitted_at` |
| due_offset_minutes | int | ví dụ `-1440` = trước 1 ngày |
| due_time | time | nullable — ép giờ cố định, ví dụ 17:00 |
| condition | text | nullable — chỉ sinh nếu ví dụ `{{gui_sep}} == true` |
| subtasks_tpl | json | danh sách task con |
| tags | json | |
| position | int | |

### `template_runs`
Lưu lại mỗi lần điền form (để xem lịch sử, chạy lại).

| id | user_id | template_id | values (json) | created_at |

### `reminders`
Bảng trung tâm cho thông báo — sinh ra khi tạo/sửa task.

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | uuid | |
| task_id | fk | |
| kind | enum | BEFORE_DUE/OVERDUE/SNOOZE |
| fire_at | timestamp (UTC) | **index** |
| status | enum | PENDING/SENT/CANCELLED/FAILED |
| sent_at | timestamp | |
| channel_id | fk | kênh `notification_channels` đã dùng để gửi |

## Ghi chú

- Lưu thời gian dạng **UTC**, hiển thị theo `users.timezone` của từng người.
- Index `(user_id, status, due_at)` trên `tasks` cho board và bộ lọc.
- Xoá người dùng → xoá dây chuyền (cascade) toàn bộ dữ liệu của họ.
- Sau này làm việc nhóm: thêm `workspaces`, `workspace_members`, cột `assignee_id` trên `tasks` — không phải sửa các bảng hiện có.
- Tránh gửi trùng: job chỉ lấy `status = PENDING AND fire_at <= now()` và cập nhật sang `SENT` trong cùng transaction.
