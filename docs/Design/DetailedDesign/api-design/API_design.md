# API Design - InterviewAI

Tài liệu trong thư mục này được đối chiếu với controller, DTO, service và Prisma schema trong `server/src` tại ngày 2026-06-09.

Base path thực tế: `/api/v1`.

## API đang được backend expose

| Nhóm | Tài liệu | Số API |
|------|----------|--------|
| Health check và quy ước chung | [01_overview.md](01_overview.md) | 1 |
| Authentication | [02_auth.md](02_auth.md) | 2 |
| Interview session và SSE | [03_session.md](03_session.md) | 7 |
| Turn/answer | [04_answer.md](04_answer.md) | 1 |
| Report | [05_report.md](05_report.md) | 1 |
| Profile | [08_profile.md](08_profile.md) | 2 |

Tổng cộng: **14 API**.

Ma trận đối chiếu controller và trạng thái tài liệu nằm tại [07_backend_api_inventory.md](07_backend_api_inventory.md).

## API chưa được triển khai

[06_rewrite.md](06_rewrite.md) là tài liệu dự kiến cho chức năng rewrite. Các endpoint trong file đó chưa có controller và không được tính vào API backend hiện tại.

Các endpoint OAuth callback, progress, upload CV và API đọc turn/feedback từng phần trong thiết kế cũ cũng chưa tồn tại trong `server/src`. Danh sách đầy đủ nằm ở phần cuối file inventory.

## Lưu ý về response

- Backend chưa dùng success envelope thống nhất. Phần lớn API trả raw object; riêng `POST /auth/refresh` trả `{ success, data }`.
- Mọi lỗi HTTP đi qua `InterviewAIExceptionFilter` và dùng dạng `{ success, errorCode, message, path, timestamp }`.
- Tên trường JSON dùng camelCase theo code TypeScript/Prisma.
