# 6. Quyết định & câu hỏi mở

## Đã chốt

| # | Chủ đề | Quyết định | Ngày |
|---|---|---|---|
| Q1 | Nền tảng | Web app, tự host bằng Docker | 2026-10-24 |
| Q2 | Kênh thông báo | **Telegram** bot | 2026-10-24 |
| Q4 | Người dùng | Nhiều người dùng, mỗi người dữ liệu riêng | 2026-10-24 |
| Q4c | Đăng nhập | **Chỉ Google** (OAuth) | 2026-10-24 |
| Q5 | Cách phát hành | Đóng gói Docker, người khác kéo về chạy `docker compose up -d` | 2026-10-24 |
| Q5b | Mô hình | Chỉ phát hành image, ai muốn thì tự cài — không vận hành bản cài chung | 2026-10-24 |
| Q5c | Nơi đăng image | **Docker Hub**, repo public | 2026-10-24 |
| Q8 | Quản lý code | **Git + GitHub**; key bí mật không bao giờ công khai — xem [09-git-va-bao-mat.md](09-git-va-bao-mat.md) | 2026-10-24 |
| Q5d | Mã nguồn | **Công khai** trên GitHub | 2026-10-24 |
| Q5e | Tài khoản | GitHub `Son30-kins` · Docker Hub `sonnld3007` · repo & image `managementtask` | 2026-10-24 |

## Còn mở

Đánh dấu lựa chọn (★ = đề xuất).

### Q3. "Form mẫu" bạn hình dung là gì?
- [ ] ★ Tự định nghĩa template (trường + quy tắc sinh task) ngay trong app — như mô tả ở mục 2.2
- [ ] Một form cố định (tiêu đề, hạn, ưu tiên...) để nhập nhanh 1 task
- [ ] Import từ file Excel / Google Form
- [ ] Khác: ...

> Nếu có ví dụ thực tế công việc bạn hay tạo task (ví dụ "mỗi tuần làm báo cáo gồm 3 bước..."), gửi mình để thiết kế template mẫu sát nhu cầu.

### Q4b. Có cần làm việc nhóm không?
- [ ] ★ Chưa — MVP chỉ cần tài khoản riêng, làm nhóm để giai đoạn 6
- [ ] Có, ngay trong MVP — giao việc, chia sẻ task / template giữa các thành viên

### Q4d. Có cần phương án đăng nhập dự phòng không?
Google chỉ cho đăng nhập khi truy cập bằng `localhost` hoặc tên miền có HTTPS. Người cài muốn dùng trong mạng nội bộ bằng IP (ví dụ `http://192.168.1.10:3000`) sẽ không đăng nhập được, và người cài nào cũng phải tự tạo Google OAuth client.
- [ ] ★ Không — chỉ Google, ghi rõ giới hạn trong hướng dẫn cài
- [ ] Có — thêm email + mật khẩu, **tắt mặc định**, người cài bật bằng biến môi trường khi cần

### Q9. Giấy phép mã nguồn (repo công khai)
Không có file LICENSE thì về mặt pháp lý người khác không được phép dùng / sửa code.
- [ ] ★ MIT — đơn giản, ai cũng được dùng, sửa, kể cả thương mại; chỉ cần giữ ghi nguồn
- [ ] AGPL-3.0 — ai sửa code và cho người khác dùng qua mạng thì phải công khai phần sửa
- [ ] Apache-2.0 — như MIT, thêm điều khoản về bằng sáng chế

### Q6. Mức ưu tiên
- [ ] ★ 4 mức: Khẩn cấp / Cao / Trung bình / Thấp
- [ ] 3 mức: Cao / Trung bình / Thấp
- [ ] Ma trận Eisenhower (Quan trọng × Khẩn cấp)

### Q7. Ngôn ngữ giao diện
- [ ] ★ Tiếng Việt
- [ ] Tiếng Anh
- [ ] Cả hai (người dùng tự chọn)
