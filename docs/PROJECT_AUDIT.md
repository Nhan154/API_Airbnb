# Project Audit

Ngày audit: 2026-11-03. `swagger.json`, PDF đề bài và ERD không có trong repo; đối chiếu API dựa trên 36 operations trong yêu cầu và route source hiện tại. Không đọc/ghi giá trị thật từ `.env`.

## Hiện trạng và các sửa đổi

- Stack hiện tại: Express 5, Prisma 7.10, MariaDB adapter, bcrypt, JWT, Cloudinary, Multer memory storage; schema có 5 model chính.
- Bổ sung JWT và kiểm tra owner cho Booking/Comment; User không giả mạo chủ tài nguyên trong body. ADMIN quản trị toàn cục.
- Thêm validation body object/non-empty, kiểu dữ liệu, email lowercase, mật khẩu tối thiểu 8 ký tự, profile fields; password hash không được trả về.
- Booking từ chối ngày nhận trong quá khứ theo UTC, ngày trả phải sau ngày nhận, kiểm tra sức chứa và khoảng giao nhau dạng `[check-in, check-out)`. Transaction khóa dòng `Phong` (`FOR UPDATE`) trước khi kiểm tra và ghi để serialize các đặt phòng cùng phòng.
- Thêm magic-byte check JPG/PNG/WEBP/GIF; giữ Multer memory storage và giới hạn 5 MiB. Signup/signin có in-memory limiter 20 lần/15 phút.
- Known Prisma errors được map sang 400/404/409. Log chỉ có loại/code lỗi; client không nhận stack trace hoặc secret. Body JSON malformed trả 400.
- Thêm Postman assertions cho đủ 36 method/path và các query/form-data chính.

## Môi trường và Git

- `.env.example` có placeholder; `.env` bị ignore, không tracked và không thấy trong `git log --all -- .env`. `node_modules` không tracked.
- Pattern scan credentials thông dụng trên local Git history không có kết quả. Đây là quét heuristic, không phải chứng nhận tuyệt đối.
- Repo GitHub [đang public](https://github.com/Nhan154/API_Airbnb) và có một commit theo trang repo; danh sách file root không có `.env`. Repo public hiện có `.agents`, `.claude`, `.windsurf`; không xóa hay rewrite lịch sử trong lượt này.
- README/docs/Postman là file bàn giao mới. Không push.

## Chuẩn hóa tên bảng `nguoidung`

Prisma model vẫn là `NguoiDung`; `@@map("nguoidung")` ánh xạ sang tên bảng vật lý viết thường. Initial migration tạo `nguoidung`, hai foreign key từ `DatPhong` và `BinhLuan` tham chiếu `nguoidung`, và migration avatar dùng `ALTER TABLE nguoidung`. Không tìm thấy raw SQL trong `src` tham chiếu bảng người dùng.

Initial migration đã được áp dụng trên database phát triển trước khi file migration được chuẩn hóa. Không sửa `_prisma_migrations` hoặc checksum. Database dev không bị reset hay migrate lại; tuyệt đối không chạy `prisma migrate deploy` lên database đó với source đã sửa. `migrate status` chỉ là thao tác kiểm tra trạng thái, không xác nhận checksum hay cho phép deploy lịch sử đã sửa. Chi tiết ở [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

Đã tạo database mới `airbnb_db_casefix_1793643198702_e7200b_test` (tên đầy đủ trong output lệnh; hậu tố `_test`) và apply từ đầu cả hai migration thành công. MySQL local báo `lower_case_table_names=1`; đây không phải kiểm chứng Linux với `lower_case_table_names=0`. MySQL mô tả khác biệt trong [Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html#sysvar_lower_case_table_names). Chưa có môi trường Linux thật nên trạng thái Linux là BLOCKED, không tuyên bố đã xác minh trên Linux.

## Trạng thái kiểm thử

- `npm test`: 18 PASS, 0 FAIL, 1 integration suite SKIPPED theo mặc định.
- `npm run test:integration -- --fresh-db`: tạo database `_test` tên mới (không xóa DB test cũ), áp dụng cả hai migration từ đầu, rồi chạy Auth, Users, Rooms, Locations, Bookings, Comments và upload validation. Kết quả: 7 PASS, 0 FAIL. Test chạy trên local `lower_case_table_names=1`, không phải Linux case-sensitive.
- Prisma validate/generate và migration status: PASS trên local (2 migrations up to date).
- Postman static assertions: PASS, 36 operations.
- Chưa upload ảnh hợp lệ lên tài khoản Cloudinary thật; Cloudinary helper lỗi được unit test với fake client. Chưa chạy migration fresh trên Linux và chưa deploy production.
- Swagger gốc không có trong workspace, vì vậy chưa thể xác nhận schema request/response chính xác so với Swagger.
