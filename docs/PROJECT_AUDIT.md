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

## Migration case mismatch — blocker Linux

Migration đầu tạo bảng `NguoiDung`; migration avatar chạy `ALTER TABLE nguoidung`. DB local thực tế trả `lower_case_table_names=1`, và tên bảng lưu là `nguoidung`; `migrate status` thấy 2 migrations up to date. MySQL Linux thường mặc định `lower_case_table_names=0`, phân biệt hoa thường, nên fresh migration có thể lỗi. Không sửa migration đã áp dụng và không reset DB. Production Linux phải dừng trước migration cho tới khi chốt cách xử lý; xem [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md). MySQL mô tả khác biệt này trong [Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html#sysvar_lower_case_table_names).

## Trạng thái kiểm thử

- `npm test`: 18 PASS, 0 FAIL, 1 integration suite SKIPPED theo mặc định.
- `RUN_INTEGRATION_TESTS=1 npm run test:integration`: PASS trên DB local cho Auth, Users, Rooms, Locations, Bookings, Comments và upload validation; suite tạo fixture tạm và cleanup.
- Prisma validate/generate và migration status: PASS trên local (2 migrations up to date).
- Postman static assertions: PASS, 36 operations.
- Chưa upload ảnh hợp lệ lên tài khoản Cloudinary thật; Cloudinary helper lỗi được unit test với fake client. Không chạy migration fresh trên Linux và chưa deploy production.
- Swagger gốc không có trong workspace, vì vậy chưa thể xác nhận schema request/response chính xác so với Swagger.
