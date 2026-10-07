# PHÂN HỆ NESTJS CORE PLATFORM & CLEAN ARCHITECTURE (BACKEND-CORE)

> **Trạng thái**: 🟡 Planned (Tài liệu chuẩn hóa kiến trúc lõi backend)  
> **Cấp độ**: Core Platform Specification  
> **Áp dụng cho**: `server/src/`, `server/prisma/`, Bounded Contexts Modules  
> **Tài liệu cha**: [docs/architecture/README.md](../README.md)  
> **Quy chuẩn Kỹ thuật Liên quan**: [server/CONVENTIONS.md](../../../server/CONVENTIONS.md)  

---

## 1. TỔNG QUAN PHÂN HỆ LÕI
Phân hệ NestJS Core Platform là trái tim điều phối của hệ thống InterviewCoach:
1. **Kiến trúc Modular Monolith & Clean Architecture 3 Lớp**: Presentation Layer (Controllers, DTOs, Guards), Application/Domain Layer (Use Case Services, Facades), Data/Persistence Layer (Prisma, Repositories).
2. **Giao tiếp Xuyên Module qua Facade Pattern**: Mọi tương tác giữa các Bounded Contexts (Auth, Session, Media, Assessment, Question) bắt buộc thông qua thư mục `@modules/<context>/contracts`.
3. **Tính Toàn vẹn Dữ liệu (ACID Interactive Transactions)**: Toàn bộ quá trình biến đổi trạng thái nhiều bảng được bao bọc trong `prisma.$transaction`.
4. **Hệ thống Xử lý Bất đồng bộ BullMQ & Outbox Pattern**: Đảm bảo các tác vụ sinh câu hỏi, chấm điểm và gửi thông báo diễn ra bền bỉ, có khả năng retry tự động khi gặp sự cố.

*Xem chi tiết toàn bộ quy tắc kỹ thuật và mã mẫu tại: [server/CONVENTIONS.md](../../../server/CONVENTIONS.md).*
