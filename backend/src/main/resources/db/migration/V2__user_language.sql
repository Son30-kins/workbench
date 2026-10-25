-- Ngôn ngữ giao diện, thông báo và tin Telegram của từng người dùng
alter table users
    add column language text not null default 'vi'
        constraint users_language_check check (language in ('vi', 'en', 'de'));
