# Tài liệu dự án InterviewAI (AI Mock Interview)

InterviewAI là ứng dụng AI Mock Interview — nền tảng luyện phỏng vấn cho sinh viên CNTT Việt Nam. Thư mục này chứa toàn bộ tài liệu từ giai đoạn khám phá vấn đề đến thiết kế hệ thống.

## Tài liệu hiện có

### Khám phá và yêu cầu

| Tài liệu | Mô tả | Trạng thái |
|----------|-------|------------|
| [Discovery Document](RequirementAnalysis/discovery-docs/Discovery_Document.md) | Vấn đề cần giải quyết, người dùng mục tiêu, phân tích thị trường | Hoàn thành |
| [SRS](RequirementAnalysis/SRS/SRS_InterviewAI_Full.md) | Đặc tả yêu cầu đầy đủ — 13 use cases, các yêu cầu phi chức năng | Hoàn thành |
| [User Stories](RequirementAnalysis/user-stories/) | 16 user stories (US-001 → US-016) | Bản nháp |
| [Traceability Matrix](RequirementAnalysis/SRS/RTM_InterviewAI.md) | Bảng liên kết UC → AC → User Story | Hoàn thành |
| [Glossary](glossary.md) | Định nghĩa các thuật ngữ trong dự án | Hoàn thành |
| [Competitive Analysis](RequirementAnalysis/competitive-analysis/) | Đánh giá sâu 4 đối thủ (Final Round AI, Pramp, Yoodli, interviewing.io), ma trận định vị, gap analysis | Hoàn thành |

### Thiết kế kiến trúc

| Tài liệu | Mô tả | Trạng thái |
|----------|-------|------------|
| [SAD](Design/ArchitecturalDesign/SAD_InterviewAI_v1.0.md) | Kiến trúc tổng thể, tech stack, thiết kế AI pipeline | Hoàn thành |
| [HLD](Design/ArchitecturalDesign/HLD_InterviewAI_v1.0.md) | Thiết kế cấp cao — 5 luồng dữ liệu, ~35 API endpoints | Hoàn thành |
| [MVP Scope](Design/MVP_Scope.md) | Quick reference IN/OUT cho MVP — 5 UCs, 11 tables, 5 routes, NFR implementation | Hoàn thành |
| [ADR-001 → ADR-007](Design/ArchitecturalDesign/ADRs/) | 7 quyết định kiến trúc quan trọng (Next.js, NestJS, Supabase, v.v.) | Hoàn thành |
| [Session Type Spec](Design/ArchitecturalDesign/interview_ai_coach_session_type_spec.md) | Đặc tả 3 loại phỏng vấn: HR, Technical, Mixed | Hoàn thành |

### Thiết kế chi tiết

| Tài liệu | Mô tả | Trạng thái |
|----------|-------|------------|
| [Database Design](Design/DetailedDesign/database-design/) | Schema 15 bảng, DDL, RLS, indexes, 9 quyết định thiết kế DB | Hoàn thành |
| [API Design](Design/DetailedDesign/api-design/) | Đặc tả 23 MVP endpoints (6 files): auth, session, answer, report, profile + v1.1 placeholders | Hoàn thành |
| [UI/UX Design](Design/DetailedDesign/uiux-design/) | Sitemap, 5 MVP routes, design tokens, user flows (auth/interview/report), annotated transcript interaction | Hoàn thành |
| [LLD](Design/DetailedDesign/lld/LLD_design.md) | Class interfaces, DTOs, BullMQ contracts, sequence diagrams — 5 NestJS modules (7 files) | Hoàn thành |

### Kiểm thử và vận hành

| Tài liệu | Mô tả | Trạng thái |
|----------|-------|------------|
| [Test Plan](test-plan/strategy.md) | Chiến lược kiểm thử, phạm vi, môi trường | Hoàn thành |
| [Phase Log](PHASES.md) | Lịch sử chuyển phase và trạng thái hiện tại | Hoàn thành |

## Trình tự đọc

**Người mới vào dự án:**
Discovery Document → Glossary → SRS (phần tổng quan) → HLD

**Bắt đầu thiết kế backend:**
HLD → Database Design → SAD (phần AI pipeline)

**Bắt đầu thiết kế frontend:**
HLD → Session Type Spec → UI/UX Design (khi có)

**Xem lý do chọn công nghệ:**
ADR-001 → ADR-007 (mỗi file ~1 trang, đọc theo thứ tự)

## Cập nhật tài liệu này

Khi thêm tài liệu mới: bổ sung vào bảng tương ứng ở trên.
Quy tắc tạo tài liệu: `.claude/rules/doc-generation.md`.
