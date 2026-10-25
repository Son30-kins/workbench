-- Workbench — schema ban đầu (Flyway). Mọi bảng dữ liệu của người dùng đều có user_id;
-- tầng service luôn lọc theo user_id nên người dùng không đọc/sửa được dữ liệu của nhau.

create table users (
    id             uuid primary key,
    google_subject text        not null unique,
    email          text        not null unique,
    name           text        not null,
    image          text,
    role           text        not null default 'USER' check (role in ('ADMIN', 'USER')),
    banned         boolean     not null default false,
    timezone       text        not null default 'Asia/Ho_Chi_Minh',
    settings       jsonb,
    last_digest_on date, -- ngày (theo giờ địa phương) đã gửi bản tin buổi sáng
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

-- Cài đặt của cả bản cài (admin chỉnh): chính sách đăng nhập, thông tin bot Telegram
create table app_settings (
    key        text primary key,
    value      jsonb       not null,
    updated_at timestamptz not null default now()
);

create table templates (
    id          uuid primary key,
    user_id     uuid        not null references users (id) on delete cascade,
    name        text        not null,
    description text        not null default '',
    fields      jsonb       not null,
    rules       jsonb       not null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);
create index templates_user_idx on templates (user_id);

create table template_runs (
    id            uuid primary key,
    user_id       uuid        not null references users (id) on delete cascade,
    template_id   uuid references templates (id) on delete set null,
    template_name text        not null,
    form_values   jsonb       not null,
    task_count    integer     not null default 0,
    created_at    timestamptz not null default now()
);
create index template_runs_user_created_idx on template_runs (user_id, created_at desc);

create table tasks (
    id              uuid primary key,
    user_id         uuid        not null references users (id) on delete cascade,
    title           text        not null,
    description     text        not null default '',
    due_at          timestamptz,
    priority        text        not null default 'MEDIUM' check (priority in ('URGENT', 'HIGH', 'MEDIUM', 'LOW')),
    -- Thứ tự sắp xếp: 0 = khẩn cấp nhất. Postgres tự tính, JPA chỉ đọc.
    priority_rank   smallint generated always as (
        case priority when 'URGENT' then 0 when 'HIGH' then 1 when 'MEDIUM' then 2 else 3 end
    ) stored,
    status          text        not null default 'TODO' check (status in ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED')),
    tags            text[]      not null default '{}',
    template_run_id uuid references template_runs (id) on delete set null,
    template_name   text,
    completed_at    timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
create index tasks_user_status_due_idx on tasks (user_id, status, due_at);

create table subtasks (
    id       uuid primary key,
    task_id  uuid    not null references tasks (id) on delete cascade,
    title    text    not null,
    done     boolean not null default false,
    position integer not null default 0
);
create index subtasks_task_idx on subtasks (task_id);

create table reminders (
    id         uuid primary key,
    task_id    uuid        not null references tasks (id) on delete cascade,
    user_id    uuid        not null references users (id) on delete cascade,
    kind       text        not null check (kind in ('BEFORE_DUE', 'OVERDUE', 'SNOOZE')),
    fire_at    timestamptz not null,
    status     text        not null default 'PENDING' check (status in ('PENDING', 'SENT', 'CANCELLED', 'FAILED')),
    sent_at    timestamptz,
    last_error text,
    created_at timestamptz not null default now()
);
create index reminders_due_idx on reminders (status, fire_at);
create index reminders_task_idx on reminders (task_id);

-- Thông báo trong app (chuông trên header)
create table notifications (
    id         uuid primary key,
    user_id    uuid        not null references users (id) on delete cascade,
    task_id    uuid references tasks (id) on delete set null,
    title      text        not null,
    body       text        not null default '',
    read_at    timestamptz,
    created_at timestamptz not null default now()
);
create index notifications_user_created_idx on notifications (user_id, created_at desc);

-- Kênh nhận nhắc việc của từng người dùng (hiện tại: Telegram)
create table notification_channels (
    id                    uuid primary key,
    user_id               uuid        not null references users (id) on delete cascade,
    type                  text        not null default 'TELEGRAM',
    chat_id               text,
    username              text,
    enabled               boolean     not null default false,
    link_token_hash       text, -- chỉ lưu SHA-256 của mã liên kết, không lưu mã gốc
    link_token_expires_at timestamptz,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now(),
    unique (user_id, type)
);
create index notification_channels_token_idx on notification_channels (link_token_hash);
create index notification_channels_chat_idx on notification_channels (chat_id);

-- ===== Spring Session JDBC (schema-postgresql.sql của spring-session-jdbc 4.1) =====
create table spring_session (
    primary_id            char(36) not null,
    session_id            char(36) not null,
    creation_time         bigint   not null,
    last_access_time      bigint   not null,
    max_inactive_interval int      not null,
    expiry_time           bigint   not null,
    principal_name        varchar(100),
    constraint spring_session_pk primary key (primary_id)
);
create unique index spring_session_ix1 on spring_session (session_id);
create index spring_session_ix2 on spring_session (expiry_time);
create index spring_session_ix3 on spring_session (principal_name);

create table spring_session_attributes (
    session_primary_id char(36)     not null,
    attribute_name     varchar(200) not null,
    attribute_bytes    bytea        not null,
    constraint spring_session_attributes_pk primary key (session_primary_id, attribute_name),
    constraint spring_session_attributes_fk foreign key (session_primary_id) references spring_session (primary_id) on delete cascade
);
