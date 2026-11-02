# API Documentation

Base URL local: `http://localhost:5000`. JSON APIs nhận/gửi JSON. DELETE người dùng theo contract dùng query `id`. Upload nhận multipart field `formFile`; room/location nhận thêm query ID. Cấu trúc response hiện có khác nhau giữa các controller; xem response mẫu khi chạy API, không nên dựa vào một wrapper chung.

## Xác thực và phân quyền

Gửi `Authorization: Bearer <JWT>` cho route cần đăng nhập. Signup luôn tạo role `USER`. Danh sách dưới đây ghi quyền theo routes hiện tại sau khi bổ sung bảo vệ booking/comment.

| Nhóm | Method và path | Quyền |
|---|---|---|
| Auth | POST `/api/auth/signup` | Public |
| Auth | POST `/api/auth/signin` | Public |
| Users | GET `/api/users` | ADMIN |
| Users | POST `/api/users` | ADMIN |
| Users | GET `/api/users/phan-trang-tim-kiem?pageIndex=1&pageSize=10&keyword=` | ADMIN |
| Users | GET `/api/users/search/{TenNguoiDung}` | ADMIN |
| Users | GET `/api/users/{id}` | USER own / ADMIN |
| Users | PUT `/api/users/{id}` | USER own / ADMIN |
| Users | DELETE `/api/users?id={id}` | ADMIN |
| Users | POST `/api/users/upload-avatar` | USER own / ADMIN; form `formFile` |
| Rooms | GET `/api/phong-thue` | Public |
| Rooms | POST `/api/phong-thue` | ADMIN |
| Rooms | GET `/api/phong-thue/lay-phong-theo-vi-tri?maViTri={id}` | Public |
| Rooms | GET `/api/phong-thue/phan-trang-tim-kiem?pageIndex=1&pageSize=10&keyword=` | Public |
| Rooms | GET `/api/phong-thue/{id}` | Public |
| Rooms | PUT `/api/phong-thue/{id}` | ADMIN |
| Rooms | DELETE `/api/phong-thue/{id}` | ADMIN |
| Rooms | POST `/api/phong-thue/upload-hinh-phong?maPhong={id}` | ADMIN; form `formFile` |
| Locations | GET `/api/vi-tri` | Public |
| Locations | POST `/api/vi-tri` | ADMIN |
| Locations | GET `/api/vi-tri/phan-trang-tim-kiem?pageIndex=1&pageSize=10&keyword=` | Public |
| Locations | GET `/api/vi-tri/{id}` | Public |
| Locations | PUT `/api/vi-tri/{id}` | ADMIN |
| Locations | DELETE `/api/vi-tri/{id}` | ADMIN |
| Locations | POST `/api/vi-tri/upload-hinh-vitri?maViTri={id}` | ADMIN; form `formFile` |
| Bookings | GET `/api/dat-phong` | ADMIN |
| Bookings | POST `/api/dat-phong` | USER/ADMIN |
| Bookings | GET `/api/dat-phong/{id}` | Owner / ADMIN |
| Bookings | PUT `/api/dat-phong/{id}` | Owner / ADMIN |
| Bookings | DELETE `/api/dat-phong/{id}` | Owner / ADMIN |
| Bookings | GET `/api/dat-phong/lay-theo-nguoi-dung/{MaNguoiDung}` | Own user / ADMIN |
| Comments | GET `/api/binh-luan` | Public |
| Comments | POST `/api/binh-luan` | USER/ADMIN |
| Comments | PUT `/api/binh-luan/{id}` | Owner / ADMIN |
| Comments | DELETE `/api/binh-luan/{id}` | Owner / ADMIN |
| Comments | GET `/api/binh-luan/lay-binh-luan-theo-phong/{MaPhong}` | Public |

Tổng: 36 operations theo danh sách đề bài. Upload dùng bộ nhớ tạm, giới hạn 5 MiB, MIME allowlist JPG/PNG/WEBP/GIF. Kiểm tra nội dung file thực tế vẫn cần bổ sung để chống MIME spoofing.

## Payload mẫu

Signup `POST /api/auth/signup`:

```json
{"name":"Nguyen An","email":"an@example.com","password":"replace-with-strong-password","phone":"0900000000","birthday":"1998-01-01","gender":true}
```

Signin `POST /api/auth/signin` trả `content.user` và `content.token`. Không trả password/hash.

Room create `POST /api/phong-thue`:

```json
{"tenPhong":"Studio trung tâm","khach":2,"phongNgu":1,"giuong":1,"phongTam":1,"moTa":"Gần trung tâm","giaTien":900000,"maViTri":1,"wifi":true,"dieuHoa":true}
```

Booking `POST /api/dat-phong`:

```json
{"maPhong":1,"ngayDen":"2026-12-10T00:00:00.000Z","ngayDi":"2026-12-12T00:00:00.000Z","soLuongKhach":2}
```

USER booking lấy người đặt từ JWT; giá trị client gửi trong `maNguoiDung` bị bỏ qua. Comment `POST /api/binh-luan` có `maPhong`, `ngayBinhLuan`, `noiDung`, `saoBinhLuan`; người bình luận lấy từ JWT.

## Status code

`400` đầu vào không hợp lệ; `401` token thiếu/sai/hết hạn; `403` không đủ quyền; `404` không có tài nguyên; `409` xung đột khóa/unique; `413` file quá lớn; `500` lỗi không dự kiến. Tài liệu này mô tả contract quan sát từ source hiện tại, cần đối chiếu lại với swagger.json gốc khi được cung cấp.
