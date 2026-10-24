# ManagementTask

App quản lý công việc tự host bằng Docker: điền **form mẫu** → app **tự sinh task**, có **mức độ ưu tiên**, **nhắc việc qua Telegram** khi sắp đến hạn. Đăng nhập bằng Google, nhiều người dùng, dữ liệu riêng từng người.

> 🚧 **Đang lên kế hoạch** — chưa có bản phát hành. Xem [tài liệu thiết kế](docs/README.md).

## Cài đặt (khi có bản phát hành)

```bash
mkdir managementtask && cd managementtask
curl -O https://raw.githubusercontent.com/Son30-kins/managementtask/main/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/Son30-kins/managementtask/main/.env.example
# điền .env (Google OAuth, Telegram bot, mật khẩu…)
docker compose up -d
```

Image: [`sonnld3007/managementtask`](https://hub.docker.com/r/sonnld3007/managementtask)

## Phát triển

```bash
git clone https://github.com/Son30-kins/managementtask.git
cd managementtask
brew install gitleaks                    # bắt buộc — quét bí mật trước mỗi commit
git config core.hooksPath .githooks      # bật hook chặn commit có bí mật
cp .env.example .env.local               # điền key dev của riêng bạn — file này không bao giờ được commit
```

## Bảo mật

- Không commit `.env`, key, token, mật khẩu. Hook pre-commit và CI (gitleaks) sẽ chặn.
- Image trên Docker Hub không chứa bí mật — mọi key được truyền lúc chạy qua `.env`.
- Phát hiện lỗ hổng hoặc lỡ thấy key bị lộ: báo riêng qua [GitHub Security Advisories](https://github.com/Son30-kins/managementtask/security/advisories/new), không tạo issue công khai.

Chi tiết: [docs/09-git-va-bao-mat.md](docs/09-git-va-bao-mat.md)

## Ghi nguồn

Giao diện tham khảo [To do list dashboard (Freebie)](https://www.figma.com/community) trên Figma Community.
