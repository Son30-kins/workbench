# 2. Yêu cầu chức năng

## 2.0 Tài khoản & đăng nhập

**Đăng nhập chỉ bằng Google** (OAuth) — không có mật khẩu riêng.

**Tính năng:**
| Tính năng | MVP | Ghi chú |
|---|---|---|
| Đăng nhập bằng Google | ✅ | Lần đầu đăng nhập = tự tạo tài khoản (lấy tên, email, avatar từ Google) |
| Đăng xuất | ✅ | Đăng xuất phiên hiện tại |
| Hồ sơ cá nhân | ✅ | Múi giờ, kết nối Telegram, cài đặt nhắc việc |
| Giới hạn ai được đăng nhập | ✅ | Admin bản cài chọn: mọi tài khoản Google / chỉ email hoặc tên miền trong danh sách cho phép |
| Xoá tài khoản | ⏳ | Xoá toàn bộ dữ liệu của người dùng |

**User stories**
- Tôi muốn bấm "Đăng nhập bằng Google" là vào được app, không phải nhớ thêm mật khẩu.
- Tôi muốn đăng nhập trên máy tính và điện thoại và thấy cùng dữ liệu.
- Là người cài app cho công ty, tôi muốn chỉ email `@congty.com` mới đăng nhập được.

**Không cần nữa** (nhờ đăng nhập Google): đăng ký, mật khẩu, xác thực email, quên mật khẩu, gửi email.

**Yêu cầu bảo mật:**
- Phiên đăng nhập lưu bằng cookie `httpOnly`, `secure`, `SameSite=Lax`.
- Kiểm tra `state` / PKCE trong luồng OAuth (thư viện auth lo).
- Chỉ nhận tài khoản Google có email đã xác minh.
- **Phân quyền dữ liệu:** mọi truy vấn task, template, reminder đều lọc theo người dùng đang đăng nhập. Người dùng A gọi API với id task của người dùng B → trả về 404.
- Tất cả trang trong app (trừ trang đăng nhập) yêu cầu đăng nhập.

## 2.1 Task

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| Tiêu đề | text | bắt buộc |
| Mô tả | text dài (markdown) | |
| Hạn chót | ngày + giờ | |
| Ưu tiên | `URGENT` / `HIGH` / `MEDIUM` / `LOW` | mặc định `MEDIUM` |
| Trạng thái | `TODO` / `IN_PROGRESS` / `DONE` / `CANCELLED` | |
| Nhãn (tag) | nhiều | ví dụ: công việc, cá nhân |
| Task con | checklist | tuỳ chọn |
| Nguồn | template nào sinh ra | để truy vết |

**User stories**
- Tôi muốn xem danh sách task hôm nay / tuần này / quá hạn.
- Tôi muốn sắp xếp theo ưu tiên rồi theo hạn chót.
- Tôi muốn đánh dấu xong bằng 1 click.

## 2.2 Form mẫu (Template) → tự sinh task

Đây là tính năng chính. Một **template** gồm 2 phần:

**a) Các trường của form** (bạn tự định nghĩa): text, số, ngày, dropdown, checkbox.

**b) Quy tắc sinh task**: một hoặc nhiều task, dùng biến từ form.

Ví dụ template **"Báo cáo tuần"**:

```
Form:
  - tuan        (số)      — "Tuần số"
  - ngay_nop    (ngày)    — "Hạn nộp"
  - du_an       (dropdown: A, B, C)

Task sinh ra:
  1. "Thu thập số liệu dự án {{du_an}} — tuần {{tuan}}"
       hạn = ngay_nop - 2 ngày, ưu tiên HIGH
  2. "Viết báo cáo tuần {{tuan}}"
       hạn = ngay_nop - 1 ngày, ưu tiên HIGH
  3. "Gửi báo cáo tuần {{tuan}} cho sếp"
       hạn = ngay_nop 17:00,   ưu tiên URGENT
```

Điền form: `tuan=43, ngay_nop=31/10, du_an=A` → app tạo 3 task với hạn 29/10, 30/10, 31/10 17:00.

**Yêu cầu:**
- Tạo / sửa / nhân bản / xoá template.
- Biến `{{ten_truong}}` dùng được trong tiêu đề, mô tả.
- Hạn chót tính **tương đối** theo một trường ngày (± ngày/giờ) hoặc theo ngày điền form.
- **Xem trước** danh sách task trước khi xác nhận tạo.
- (Giai đoạn sau) Template **lặp lại**: tự chạy mỗi tuần / tháng không cần điền.

## 2.3 Mức độ ưu tiên

| Mức | Màu | Ý nghĩa |
|-----|-----|---------|
| `URGENT` | đỏ | Phải làm ngay, hậu quả lớn nếu trễ |
| `HIGH` | cam | Quan trọng, làm trong ngày/tuần |
| `MEDIUM` | xanh dương | Bình thường |
| `LOW` | xám | Làm khi rảnh |

**Tự nâng ưu tiên (tuỳ chọn, bật/tắt được):** task còn < 24h mà chưa xong → hiển thị nổi bật như mức cao hơn 1 bậc (không đổi dữ liệu gốc).

## 2.4 Thông báo

**Lịch nhắc mặc định theo ưu tiên** (sửa được trong Cài đặt):

| Ưu tiên | Nhắc trước hạn |
|---------|----------------|
| `URGENT` | 1 ngày, 3 giờ, 1 giờ, 15 phút |
| `HIGH` | 1 ngày, 2 giờ |
| `MEDIUM` | 1 ngày |
| `LOW` | không nhắc trước, chỉ hiện trong bản tin hằng ngày |

**Các loại thông báo:**
- **Sắp đến hạn** — theo bảng trên.
- **Quá hạn** — ngay khi quá hạn, sau đó nhắc lại mỗi ngày 1 lần.
- **Bản tin buổi sáng** (ví dụ 8:00) — tóm tắt việc hôm nay + quá hạn.
- Có thể **hoãn (snooze)** 1 thông báo: 15 phút / 1 giờ / ngày mai.

**Kênh thông báo: Telegram** (đã chốt). Mỗi người dùng tự kết nối Telegram của mình và chỉnh lịch nhắc riêng.

**Kết nối Telegram:**
1. Trong Cài đặt, bấm "Kết nối Telegram" → app tạo mã tạm (hết hạn sau 10 phút) và mở link `https://t.me/<bot>?start=<mã>`.
2. Người dùng bấm **Start** trong Telegram → bot nhận mã → gắn `chat_id` Telegram đó với đúng tài khoản.
3. Bot trả lời "Đã kết nối với tài khoản <email>". Có nút "Ngắt kết nối" trong Cài đặt.

**Tin nhắn nhắc việc** có nút bấm ngay trong Telegram:
- ✅ **Xong** — đánh dấu task hoàn thành
- ⏰ **Hoãn 1 giờ** / **Ngày mai**
- 🔗 **Mở** — link tới task trong app

**Lệnh bot** (giai đoạn sau): `/today` việc hôm nay, `/overdue` việc quá hạn.

Không kết nối Telegram thì vẫn thấy thông báo trong chuông trên app, nhưng không có tin nhắn đẩy tới điện thoại.

**Yêu cầu kỹ thuật:**
- Mỗi lần nhắc chỉ gửi **1 lần** (không gửi trùng).
- Khi sửa hạn chót hoặc ưu tiên → lịch nhắc được tính lại.
- Task `DONE` / `CANCELLED` → huỷ các nhắc nhở còn lại.
- Có "giờ yên lặng" (ví dụ 22:00–7:00) — dồn thông báo sang sáng hôm sau, trừ `URGENT`.

## 2.5 Giao diện (các màn hình chính)

Chi tiết thiết kế xem [07-ui-design.md](07-ui-design.md).

1. **Board** (màn hình chính) — Kanban 3 cột To do / In progress / Done, kéo thả đổi trạng thái; bộ lọc nhanh Hôm nay / Quá hạn / 7 ngày tới.
2. **List view** — bảng task: lọc, sắp xếp, tìm kiếm.
3. **Chi tiết task** — sửa, task con, lịch sử nhắc.
4. **Templates** — danh sách template + trình tạo template.
5. **Điền form** — chọn template → điền → xem trước → tạo.
6. **Cài đặt** — kênh thông báo, lịch nhắc, giờ yên lặng, múi giờ.
7. **Đăng nhập** — một nút "Đăng nhập bằng Google".
8. **Hồ sơ** — tên, avatar (từ Google), múi giờ, kết nối Telegram (mở từ avatar trên header).
9. **Quản trị** (chỉ admin) — danh sách người dùng, khoá tài khoản, danh sách email / tên miền được phép.
