# 1. Tổng quan

## Vấn đề

- Tạo task thủ công lặp đi lặp lại, mất thời gian (nhất là những việc có cấu trúc giống nhau: báo cáo tuần, onboarding, release...).
- Dễ quên hạn vì không có nhắc nhở phù hợp.
- Không biết việc nào cần làm trước.

## Mục tiêu

1. **Tạo task nhanh từ form mẫu** — điền vài trường, app sinh ra 1 hoặc nhiều task với hạn, ưu tiên, mô tả có sẵn.
2. **Nhắc việc đúng lúc** — thông báo trước hạn, lịch nhắc phụ thuộc mức ưu tiên; nhắc khi quá hạn.
3. **Ưu tiên rõ ràng** — 4 mức ưu tiên, danh sách task sắp xếp theo ưu tiên + hạn.

## Phạm vi MVP (bản đầu tiên)

**Có:**
- Đăng nhập bằng Google — nhiều người dùng, mỗi người có dữ liệu riêng
- Nhắc việc qua Telegram
- Đóng gói Docker, phát hành trên Docker Hub để ai cũng tự cài được
- CRUD task (tạo / xem / sửa / xoá / đánh dấu xong)
- Mức ưu tiên + hạn chót (deadline)
- Form mẫu (template) → sinh task
- Thông báo sắp đến hạn & quá hạn
- Lọc / sắp xếp theo ưu tiên, hạn, trạng thái

**Chưa có (để sau):**
- Làm việc nhóm: giao việc cho người khác, chia sẻ task / template
- Đồng bộ Google Calendar
- AI đọc văn bản tự do để tạo task
- App mobile native

## Người dùng

Nhiều người dùng, mỗi người đăng nhập bằng tài khoản Google của mình. Mỗi người có task, template, cài đặt thông báo **riêng** và **không thấy dữ liệu của người khác**.

Làm việc nhóm (giao việc, chia sẻ) chưa có trong MVP, nhưng dữ liệu được thiết kế để thêm sau không phải sửa lớn.
