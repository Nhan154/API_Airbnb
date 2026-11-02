# Test Checklist

Cập nhật 2026-11-03. Chỉ đánh PASS sau khi test đã chạy.

Kết quả lần chạy cuối: `npm test` 18 PASS / 0 FAIL / 1 SKIPPED; `npm run test:integration` 7 PASS / 0 FAIL / 0 SKIPPED (gồm 6 nhóm API tích hợp).

| Hạng mục | Bằng chứng | Trạng thái |
|---|---|---|
| Auth | Signup/signin, duplicate, invalid input, no password hash | PASS: integration suite |
| JWT/RBAC | Missing/invalid/expired token, bad role, USER/ADMIN | PASS: unit + integration |
| Users | Create/read/update/delete, ownership, role escalation, email normalization, search/page, no hash | PASS: integration suite |
| Rooms | Create/read/update/delete, bad body/types, search/page, location filter, FK | PASS: integration suite |
| Locations | Create/read/update/delete, bad body/types, search/page, FK | PASS: integration suite |
| Bookings | Invalid/past/equal dates, capacity, owner spoofing, read/update/delete, simultaneous overlap | PASS: integration suite |
| Comments | Create/read/update/delete, empty body/content, invalid rating, author spoofing, ownership | PASS: integration suite |
| Upload | All three routes missing file/signature mismatch; oversize; signature helper/provider error | PASS: unit + integration |
| Cloudinary live | Valid image upload, persisted URL and actual provider outage | BLOCKED: not run against real account |
| Prisma | validate, generate, migrate status | PASS: local; 2 migrations up to date |
| Linux migration | Fresh apply on case-sensitive MySQL | BLOCKED: avatar migration name case mismatch |
| Postman | 36 method/path, DELETE query, room/location query and `formFile` | PASS: static assertions |
| Production | Deploy/live endpoint regression | BLOCKED: not deployed |

Run unit tests with `npm test`. Run DB-backed tests in PowerShell with `$env:RUN_INTEGRATION_TESTS = "1"; npm run test:integration; Remove-Item Env:RUN_INTEGRATION_TESTS`.
