# 9. Quản lý code (Git) & bảo mật key bí mật

## 9.1 Hai nơi phát hành — hai mục đích

```
 Máy dev ──git push──► GitHub (mã nguồn)  ──tag v1.2.3──► GitHub Actions ──push──► Docker Hub (image)
                         quản lý code                        build & test             người dùng kéo về chạy
```

| | GitHub | Docker Hub |
|---|---|---|
| Chứa | Mã nguồn, tài liệu, `docker-compose.yml`, `.env.example` | Image đã build |
| Ai dùng | Bạn (và người đóng góp nếu public) | Người cài app |
| **Không bao giờ chứa** | `.env`, key, token, mật khẩu | `.env`, key, token, mật khẩu |

## 9.2 Quy trình Git

- **Nhánh**
  - `main` — luôn chạy được, chỉ nhận code qua Pull Request
  - `feat/<tên>`, `fix/<tên>` — làm từng tính năng / sửa lỗi
- **Commit** theo chuẩn [Conventional Commits](https://www.conventionalcommits.org/): `feat: tạo task từ template`, `fix: sai múi giờ khi tính hạn` → tự sinh changelog.
- **Bảo vệ `main`** trên GitHub: bắt buộc qua PR, CI (lint + test + build) phải xanh mới merge.
- **Phát hành:** tạo tag `v1.2.3` trên `main` → GitHub Actions build và đẩy image lên Docker Hub ([08-dong-goi-docker.md](08-dong-goi-docker.md) mục 8.6).

## 9.3 Các loại bí mật & nơi cất

| Bí mật | Thuộc về | Cất ở đâu |
|---|---|---|
| `AUTH_SECRET` | Mỗi bản cài | `.env` trên máy người cài |
| `POSTGRES_PASSWORD` | Mỗi bản cài | `.env` trên máy người cài |
| `GOOGLE_CLIENT_SECRET` | Mỗi bản cài (tự tạo OAuth client) | `.env` trên máy người cài |
| `TELEGRAM_BOT_TOKEN` | Mỗi bản cài (tự tạo bot) | `.env` trên máy người cài |
| Bí mật dùng khi bạn dev | Bạn | `.env.local` trên máy bạn — **không commit** |
| `DOCKERHUB_TOKEN` | Bạn (tác giả) | **GitHub → Settings → Secrets and variables → Actions** |
| `DOCKERHUB_USERNAME` | Bạn | GitHub Actions secrets / variables |

**Nguyên tắc cốt lõi:** image trên Docker Hub **không chứa bất kỳ bí mật nào**. Mọi bí mật được đưa vào lúc *chạy* (runtime) qua biến môi trường, không phải lúc *build*.

## 9.4 Các lớp bảo vệ

**1. Không để bí mật lọt vào Git**
- `.gitignore` chặn: `.env`, `.env.*` (trừ `.env.example`), `*.pem`, `*.key`, thư mục `backups/`, file `*.sql`.
- `.env.example` chỉ có tên biến + mô tả, giá trị để trống hoặc `change-me`.
- **Pre-commit hook** [`.githooks/pre-commit`](../.githooks/pre-commit) — bật bằng `git config core.hooksPath .githooks`:
  - chặn file bí mật theo tên (`.env*`, `*.pem`, `*.key`, `*.sql`, `credentials*.json`…), kể cả khi bị `git add -f`
  - chạy [gitleaks](https://github.com/gitleaks/gitleaks) quét nội dung staged với [`.gitleaks.toml`](../.gitleaks.toml) (luật mặc định + luật riêng cho token Telegram, Docker Hub, biến bí mật của app)
  - chưa cài gitleaks → chặn commit luôn, không cho bỏ qua lặng lẽ
  - đã kiểm thử 2026-10-24: chặn đủ 8 ca (token Telegram, `AUTH_SECRET`, Google secret, GitHub token, Docker Hub token, `.env`, `.env.production`, private key)
- Bật **Secret scanning + Push protection** trong GitHub (Settings → Code security) — GitHub chặn push nếu phát hiện token.
- CI [`.github/workflows/secret-scan.yml`](../.github/workflows/secret-scan.yml) chạy gitleaks CLI (bản ghim version + kiểm tra SHA256) trên **toàn bộ lịch sử** ở mọi push và PR — lưới an toàn khi ai đó bỏ qua hook bằng `--no-verify`.

**2. Không để bí mật lọt vào image**
- `.dockerignore` chặn: `.env*` (trừ `.env.example`), `.git`, `node_modules`, `backups/`, `*.sql`, `docs/`.
- Không dùng `ARG`/`ENV` để truyền bí mật trong `Dockerfile` (giá trị sẽ nằm vĩnh viễn trong layer image).
- Next.js: chỉ biến có tiền tố `NEXT_PUBLIC_` mới được đưa ra trình duyệt → **cấm** đặt bí mật với tiền tố này; `lib/env.ts` kiểm tra điều này.
- **Khoá Next.js tự sinh lúc build** (Draft Mode, mã hoá Server Action) sẽ giống nhau ở mọi bản cài nếu để trong image công khai. Xử lý ([docker/build-keys.mjs](../docker/build-keys.mjs)):
  - lúc build: thay bằng giá trị rỗng → image không chứa khoá nào
  - lúc container khởi động: sinh khoá riêng của bản cài bằng HMAC-SHA256 từ `AUTH_SECRET` và đặt `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
- CI quét image bằng [Trivy](https://github.com/aquasecurity/trivy): có bí mật, hoặc lỗ hổng CRITICAL đã có bản vá → **không** đẩy lên Docker Hub.
- Đã kiểm tra 2026-10-24: export toàn bộ filesystem của image rồi quét bằng gitleaks và Trivy → không có bí mật, không có file `.env`.

**3. Không để bí mật lọt ra lúc chạy**
- Log không in giá trị biến môi trường, token, cookie; lỗi trả về client không chứa stack trace.
- Token liên kết Telegram lưu dạng hash, hết hạn sau 10 phút, dùng 1 lần.
- `db` không mở cổng ra ngoài; container chạy user non-root.

**4. Docker Hub & chuỗi cung ứng**
- Dùng **Personal Access Token** quyền *Read & Write* cho CI — không dùng mật khẩu tài khoản.
- Bật **xác thực 2 lớp (2FA)** cho tài khoản Docker Hub và GitHub.
- Mọi GitHub Action được **ghim theo commit SHA** (không theo tag có thể bị đổi); workflow chỉ có quyền `contents: read`.
- **Dependabot** đề xuất cập nhật npm, GitHub Actions và base image hằng tuần.

## 9.5 Nếu lỡ lộ bí mật

1. **Thu hồi ngay** key đó (tạo lại Google client secret / token Telegram qua `@BotFather` → `/revoke` / Docker Hub token / `AUTH_SECRET` mới).
2. Cập nhật giá trị mới vào `.env` hoặc GitHub secrets.
3. Xoá khỏi lịch sử Git bằng `git filter-repo` rồi force-push — **nhưng coi như key đã lộ**, bước 1 là bắt buộc.
4. Nếu lỡ nằm trong image: xoá tag đó trên Docker Hub, build lại.

## 9.6 Checklist khởi tạo repo (giai đoạn 0)

- [x] `git init`, nhánh `main`
- [x] `.gitignore`, `.dockerignore`, `.env.example`
- [x] Pre-commit hook + gitleaks (`.githooks/`, `.gitleaks.toml`)
- [x] CI quét bí mật (`.github/workflows/secret-scan.yml`)
- [x] Tạo repo GitHub [`Son30-kins/managementtask`](https://github.com/Son30-kins/managementtask) (public), bật secret scanning, push protection, Dependabot alerts, private vulnerability reporting (2026-10-24)
- [x] Bảo vệ nhánh `main`: bắt buộc qua PR, CI phải xanh, cấm force-push / xoá nhánh
- [ ] Bật 2FA cho GitHub và Docker Hub (bạn tự làm)
- [ ] Thêm `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` vào GitHub Actions secrets
- [x] CI: lint, typecheck, test (có Postgres), build, build image + quét bí mật trên mọi push / PR

## 9.7 Riêng tư khi repo công khai

- Commit dùng email ẩn của GitHub `100927422+Son30-kins@users.noreply.github.com` thay cho email thật — email trong commit ai cũng xem được.
- Bật **GitHub → Settings → Emails → "Block command line pushes that expose my email"**.
- Docker Hub: trường *Full name* của tài khoản `sonnld3007` đang hiển thị email — nên đổi thành tên khác trong Account settings.
