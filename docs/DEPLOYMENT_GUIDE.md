# Deployment Guide

## Trạng thái hiện tại

Chưa deploy và chưa xác minh URL production. Repo chưa có cấu hình Vercel. App Express hiện có thể được khởi chạy bằng `npm start`; Prisma 7 dùng MariaDB adapter. Cần có MySQL/MariaDB production và Cloudinary credentials trước khi triển khai.

### Migration blocker trên MySQL/Linux

Schema và migrations hiện dùng thống nhất tên bảng vật lý `nguoidung`: model Prisma giữ tên `NguoiDung`, hai foreign key và migration avatar cũng trỏ tới tên lowercase. Cả hai migration đã apply thành công từ đầu trên một database `_test` mới ở máy local, nhưng local báo `lower_case_table_names=1`; chưa kiểm chứng trên Linux với `lower_case_table_names=0`. [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html#sysvar_lower_case_table_names) mô tả khác biệt này.

Initial migration đã áp dụng trên database phát triển trước khi file SQL được sửa để chuẩn hóa tên bảng. Không chạy `prisma migrate deploy`, `prisma migrate reset`, `prisma migrate resolve` hoặc sửa `_prisma_migrations` trên DB phát triển cũ. Không yêu cầu migrate lại DB này. Không có production DB hiện hữu; database Railway mới có thể dùng migration source hiện tại sau khi kiểm chứng trên môi trường Linux/MySQL đích. Không tuyên bố Linux đã được xác minh.

## Chuẩn bị

1. Push source lên GitHub bằng thao tác của chủ repo; không commit `.env`.
2. Tạo MySQL/MariaDB production và cho phép truy cập từ runtime.
3. Cấu hình `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NODE_ENV=production` trên hosting.
4. Chọn Node runtime đáp ứng phiên bản packages và thử `npm ci`, `npm start`.
5. Chạy migration đã review bằng `npx prisma migrate deploy --config prisma7.config.ts`; không dùng reset.
6. Kiểm tra root, `/api/health/db`, signup/signin, API public, API cần token, API ADMIN và upload.

## Nền tảng

Vercel serverless cần kiểm tra kỹ tương thích Prisma MariaDB adapter và quản lý kết nối trong vòng đời function. Không có bằng chứng chạy production hiện tại nên chưa cung cấp `vercel.json` như thể deploy đã sẵn sàng. Nền tảng chạy Node process lâu dài có thể đơn giản hơn cho adapter MariaDB; chọn sau khi biết nơi lưu DB và giới hạn mạng của nhà cung cấp.

## Vận hành

Lưu secrets trong dashboard hosting, đặt CORS theo domain frontend, bật log chỉ chứa thông tin lỗi không nhạy cảm, theo dõi health check và backup database. Không ghi URL production vào README cho tới khi kiểm tra thực tế.
