# Airbnb Backend API

REST API cho ứng dụng đặt phòng kiểu Airbnb, xây dựng bằng Node.js, Express 5, Prisma ORM 7, MariaDB/MySQL, JWT, bcrypt và Cloudinary.

## Chức năng

- Đăng ký, đăng nhập và phân quyền USER/ADMIN bằng JWT.
- CRUD người dùng, vị trí, phòng, đặt phòng và bình luận.
- Tìm kiếm, phân trang, tìm phòng theo vị trí.
- Tải avatar, ảnh phòng và ảnh vị trí lên Cloudinary.
- Health check server và database.

## Cấu trúc chính

```text
src/config       Prisma và Cloudinary
src/controllers  Xử lý request và nghiệp vụ
src/middlewares  JWT, role, upload
src/routes       Khai báo API
src/utils        Tiện ích upload
prisma           Schema và migration
docs             API, audit, deploy, demo, checklist
test             Kiểm thử tự động
```

## Database

Prisma khai báo 5 model: `NguoiDung`, `ViTri`, `Phong`, `DatPhong`, `BinhLuan`. Phòng thuộc một vị trí; đặt phòng và bình luận tham chiếu phòng và người dùng. Các quan hệ dùng `onDelete: Restrict` để không xóa mất dữ liệu liên quan.

## Cài đặt và chạy

Yêu cầu Node.js tương thích với dependencies trong `package-lock.json`, và một MySQL/MariaDB có thể truy cập.

```bash
npm ci
```

Sao chép `.env.example` thành `.env`, điền các giá trị riêng của môi trường. Không commit `.env`.

```bash
npx prisma validate --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
npx prisma migrate status --config prisma7.config.ts
npm run dev
```

Chỉ áp dụng migration đã review bằng `npx prisma migrate deploy --config prisma7.config.ts` trên môi trường đích. Không dùng lệnh reset với dữ liệu cần giữ.

Lưu ý: file initial migration đã được chuẩn hóa tên bảng người dùng thành `nguoidung` sau khi database phát triển hiện tại đã áp dụng migration cũ. Không chạy `migrate deploy`, `migrate reset`, `migrate resolve` hoặc sửa `_prisma_migrations` trên database phát triển cũ. Migration mới đã được chạy từ đầu trên database local mới, nhưng chưa kiểm chứng trên MySQL Linux với `lower_case_table_names=0`; xem [hướng dẫn deploy](docs/DEPLOYMENT_GUIDE.md).

## Kiểm thử

```bash
npm test
```

Integration tests chỉ chạy trên database local riêng có tên kết thúc bằng `_test`. Script tạo DB nếu chưa có và chạy `prisma migrate deploy` trước test; không reset hoặc xóa database. Nếu không khai báo `TEST_DATABASE_URL`, script tạo URL cùng server bằng cách thêm hậu tố `_test` vào tên DB trong `DATABASE_URL`.

Chạy bằng PowerShell:

```bash
npm run test:integration
```

Để kiểm tra toàn bộ migration từ đầu trên một DB tên mới chưa từng migrate, chạy `npm run test:integration -- --fresh-db`. DB test tạo ra được giữ lại; không đụng tới DB phát triển hay DB test cũ.

Các test upload xác minh lỗi đầu vào và giới hạn file; không upload file lên tài khoản Cloudinary thật. Xem [checklist](docs/TEST_CHECKLIST.md) và [audit](docs/PROJECT_AUDIT.md).

## Tài liệu và liên kết

- [Đặc tả API và ma trận quyền](docs/API_DOCUMENTATION.md)
- [Postman collection](postman/AirbnbBackend.postman_collection.json)
- [Postman environment mẫu](postman/AirbnbBackend.postman_environment.json)
- [Hướng dẫn deploy](docs/DEPLOYMENT_GUIDE.md)
- [Kịch bản demo](docs/DEMO_SCRIPT.md)
- GitHub: https://github.com/Nhan154/API_Airbnb
- Production URL: chưa xác minh
- Video YouTube: chưa đăng

Tên biến môi trường: `PORT`, `NODE_ENV`, `DATABASE_URL`, `TEST_DATABASE_URL` (tùy chọn; DB local riêng, hậu tố `_test`), `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
