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

## Kiểm thử

```bash
npm test
```

Integration tests dùng DB thật, tạo dữ liệu tạm có cleanup; chạy bằng PowerShell:

```powershell
$env:RUN_INTEGRATION_TESTS = "1"
npm run test:integration
Remove-Item Env:RUN_INTEGRATION_TESTS
```

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

Tên biến môi trường: `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
