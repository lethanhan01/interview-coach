# Chương 4. Phân Tích, Thiết Kế Và Xây Dựng Sản Phẩm GR1

## 4.1 Giới Thiệu Sản Phẩm GR1

> Cần bổ sung: giới thiệu prototype InterviewAI trong GR1: mục tiêu, người dùng, luồng chính, giá trị cốt lõi và kết quả có thể demo.

Luồng chính gợi ý:

1. Người dùng khai báo hồ sơ/cấu hình cơ bản.
2. Người dùng nhập JD và cấu hình session.
3. Hệ thống sinh câu hỏi phỏng vấn.
4. Người dùng trả lời từng câu.
5. Hệ thống sinh feedback/report.
6. Người dùng xem nhận xét và action plan.

## 4.2 Đối Tượng Sử Dụng Và Kịch Bản Sử Dụng

> Cần bổ sung: nêu role của hệ thống, tối thiểu có Candidate. Nếu có Admin trong thiết kế nhưng chưa trong GR1, ghi rõ trạng thái.

| Tác nhân | Mô tả | Kịch bản chính | Trạng thái trong GR1 |
| --- | --- | --- | --- |
| Candidate | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Admin | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| AI Engine | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 4.3 Yêu Cầu Chức Năng Trong GR1

> Cần bổ sung: rút gọn từ SRS và MVP scope. Chỉ giữ các yêu cầu thực sự liên quan GR1.

| Mã yêu cầu | Tên yêu cầu | Mô tả ngắn | Độ ưu tiên | Trạng thái GR1 |
| --- | --- | --- | --- | --- |
| FR-01 | Quản lý hồ sơ cơ bản | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| FR-02 | Cấu hình phiên phỏng vấn | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| FR-03 | Sinh câu hỏi phỏng vấn | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| FR-04 | Trả lời câu hỏi | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| FR-05 | Sinh feedback | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| FR-06 | Xem báo cáo | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| FR-07 | Lưu lịch sử phiên | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 4.4 Yêu Cầu Phi Chức Năng

> Cần bổ sung: nêu các yêu cầu về hiệu năng, bảo mật, khả dụng, khả bảo trì, chất lượng AI, an toàn nội dung.

| Nhóm NFR | Yêu cầu | Cách đáp ứng trong GR1 | Cách đánh giá |
| --- | --- | --- | --- |
| Hiệu năng | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Bảo mật | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Độ tin cậy | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Bảo trì | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Chất lượng AI | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Riêng tư dữ liệu | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 4.5 Phạm Vi MVP/GR1 Và Các Chức Năng Để Sau

> Cần bổ sung: đưa bảng IN/OUT để tránh báo cáo mở rộng quá mức đã làm. Nên đối chiếu `docs/Design/MVP_Scope.md`, code hiện tại trong `client/` và `server/`.

| Hạng mục | Trong GR1 | Để GR2/Đồ án tốt nghiệp | Ghi chú |
| --- | --- | --- | --- |
| Session setup | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Question generation | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Interview turn | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Feedback/report | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Voice recording/transcription | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Reverse questions | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Rewrite & Compare | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Progress dashboard | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 4.6 Kiến Trúc Tổng Thể Hệ Thống

> Cần bổ sung: trình bày kiến trúc ở mức cao. Nên có hình C4 context/container hoặc sơ đồ frontend - backend - database - Redis - AI provider.

Hình cần bổ sung:

- Hình 4.1: Kiến trúc tổng thể InterviewAI.
- Hình 4.2: C4 Container Diagram.

Nội dung cần nêu:

- Client Next.js giao tiếp với backend qua `/api/v1`.
- Backend NestJS gồm các module nghiệp vụ.
- Prisma giao tiếp PostgreSQL/Supabase.
- BullMQ/Redis xử lý job AI bất đồng bộ và phát sự kiện SSE.
- OpenAI API được gọi qua gateway/processor có fallback.

## 4.7 Thiết Kế Module Backend

> Cần bổ sung: mô tả các module backend hiện có và trách nhiệm.

| Module | Thành phần chính | Trách nhiệm | Tệp code liên quan |
| --- | --- | --- | --- |
| AuthModule | Cần bổ sung | Cần bổ sung | `server/src/auth/` |
| UserModule/Profile | Cần bổ sung | Cần bổ sung | `server/src/user/` |
| SessionModule | Cần bổ sung | Cần bổ sung | `server/src/session/` |
| TurnModule | Cần bổ sung | Cần bổ sung | `server/src/turn/` |
| AIModule | Cần bổ sung | Cần bổ sung | `server/src/ai/` |
| ReportModule | Cần bổ sung | Cần bổ sung | `server/src/report/` |
| HealthModule | Cần bổ sung | Cần bổ sung | `server/src/health/` |
| SavedJobDescriptionModule | Cần bổ sung | Cần bổ sung | `server/src/saved-job-description/` |

## 4.8 Thiết Kế Giao Diện Frontend

> Cần bổ sung: mô tả các route/page/component chính. Nên có ảnh màn hình sau khi demo ổn định.

| Route | Mục đích | Component chính | Trạng thái GR1 |
| --- | --- | --- | --- |
| `/` | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| `/login` hoặc auth callback | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| `/profile` | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| `/setup` hoặc `/sessions/new` | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| `/sessions` | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| `/sessions/[id]` | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| `/sessions/[id]/report` | Cần bổ sung | Cần bổ sung | Cần bổ sung |

Nội dung nên có:

- Nguyên tắc UI/UX.
- Luồng thao tác của người dùng.
- Trạng thái loading/error/empty.
- Responsive nếu có.

Nguồn nên đối chiếu: `docs/Design/DetailedDesign/uiux-design/` và `client/app/`, `client/components/`.

## 4.9 Thiết Kế Cơ Sở Dữ Liệu

> Cần bổ sung: mô tả schema thực tế và các nhóm bảng chính. Nên chèn ERD.

| Nhóm bảng | Bảng | Vai trò |
| --- | --- | --- |
| Lookup/question | `context_packs`, `question_bank`, `question_usage` | Cần bổ sung |
| User/profile | `users`, `user_profiles`, `resume` nếu dùng | Cần bổ sung |
| Session | `interview_sessions`, `saved_job_descriptions`, `session_questions` | Cần bổ sung |
| Answer | `user_answers`, `follow_up_questions` | Cần bổ sung |
| Feedback/report | `ai_feedbacks`, `annotated_segments`, report JSON fields | Cần bổ sung |
| Audit | `ai_quality_log` | Cần bổ sung |

Nội dung cần nêu:

- Quan hệ giữa session, câu hỏi, câu trả lời và feedback.
- Các ràng buộc quan trọng: unique answer theo session/question, cascade delete, soft delete nếu có.
- Các điểm khác biệt giữa thiết kế ban đầu và schema thực tế nếu báo cáo cần minh bạch.

Nguồn nên đối chiếu: `server/prisma/schema.prisma` và `docs/Design/DetailedDesign/database-design/Database.md`.

## 4.10 Thiết Kế API

> Cần bổ sung: tổng hợp các API backend expose, không cần chép đầy đủ request/response nếu đã có phụ lục.

| Nhóm API | Endpoint tiêu biểu | Chức năng | Ghi chú |
| --- | --- | --- | --- |
| Health | `GET /api/v1/health` | Cần bổ sung | Cần bổ sung |
| Auth | `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` | Cần bổ sung | Cần bổ sung |
| Profile | `GET/PATCH /api/v1/profile` | Cần bổ sung | Cần bổ sung |
| Session | `POST/GET /api/v1/sessions` | Cần bổ sung | Cần bổ sung |
| Session events | `GET /api/v1/sessions/:id/events` | Cần bổ sung | SSE |
| Turn/answer | `POST /api/v1/sessions/:sessionId/turns` | Cần bổ sung | Cần bổ sung |
| Report | `GET /api/v1/sessions/:sessionId/report` | Cần bổ sung | Cần bổ sung |
| Saved JD | `GET/POST /api/v1/saved-job-descriptions` | Cần bổ sung | Cần bổ sung |

Nguồn nên đối chiếu: `docs/Design/DetailedDesign/api-design/API_design.md`, `server/src/*/*.controller.ts`.

## 4.11 Thiết Kế AI Pipeline

> Cần bổ sung: mô tả pipeline AI của hệ thống. Đây là phần trọng tâm kỹ thuật của đề tài.

### 4.11.1 Question Generation

> Cần bổ sung: mô tả cách hệ thống tạo câu hỏi từ JD, loại session, context pack, question bank/fallback.

### 4.11.2 Follow-up Generation

> Cần bổ sung: nếu có implement, mô tả điều kiện tạo câu hỏi phụ, giới hạn số follow-up và vai trò trong phỏng vấn.

### 4.11.3 Feedback Generation

> Cần bổ sung: mô tả cách đánh giá câu trả lời, sinh model answer, key takeaway, annotated segments.

### 4.11.4 Comprehensive Report

> Cần bổ sung: mô tả cách tổng hợp feedback thành báo cáo: overall score, executive summary, competency heatmap, action plan.

### 4.11.5 Fallback Và Degraded Mode

> Cần bổ sung: mô tả cách hệ thống xử lý khi AI lỗi, hết quota, output không hợp lệ hoặc job timeout. Ghi rõ không nên hiển thị điểm sai lệch nếu không có dữ liệu chấm điểm.

Hình gợi ý:

- Hình 4.x: Sequence diagram sinh câu hỏi.
- Hình 4.y: Sequence diagram submit câu trả lời -> feedback -> report.

Nguồn nên đối chiếu: `docs/Design/ArchitecturalDesign/SAD_InterviewAI_v1.0.md`, `docs/Design/ArchitecturalDesign/HLD_InterviewAI_v1.0.md`, `server/src/ai/`.

## 4.12 Thiết Kế Luồng Nghiệp Vụ Chính

### 4.12.1 Luồng Cấu Hình Và Tạo Phiên Phỏng Vấn

> Cần bổ sung: mô tả từ khi người dùng nhập JD/cấu hình đến khi session được tạo và câu hỏi sẵn sàng.

### 4.12.2 Luồng Thực Hiện Phiên Phỏng Vấn

> Cần bổ sung: mô tả hiển thị câu hỏi, người dùng trả lời, lưu answer, sinh feedback/follow-up, cập nhật trạng thái session.

### 4.12.3 Luồng Sinh Và Xem Báo Cáo

> Cần bổ sung: mô tả trạng thái completing/completed, job report, SSE `report.ready`, và màn hình report.

### 4.12.4 Luồng Xử Lý Lỗi

> Cần bổ sung: mô tả các lỗi dự kiến: lỗi network, validation, AI quota, Redis/queue, transcription, session state drift. Nêu rõ cách hiển thị cho người dùng.

## 4.13 Tổ Chức Mã Nguồn

> Cần bổ sung: mô tả cấu trúc repo để người đọc hiểu cách triển khai.

| Thư mục/tệp | Vai trò |
| --- | --- |
| `client/` | Ứng dụng frontend Next.js |
| `client/app/` | Routes/pages theo App Router |
| `client/components/` | Component UI, profile, interview, report, setup |
| `server/` | Ứng dụng backend NestJS |
| `server/src/` | Source code module backend |
| `server/prisma/` | Prisma schema, seed, migration/db scripts |
| `docs/RequirementAnalysis/` | Tài liệu yêu cầu, SRS, user stories |
| `docs/Design/` | Tài liệu thiết kế kiến trúc, UI/UX, API, DB, LLD |
| `docs/test-plan/` | Chiến lược kiểm thử |
| `compose.yaml` | Dịch vụ hạ tầng local, ví dụ Redis |

## 4.14 Cách Thức Xây Dựng Và Triển Khai Local

> Cần bổ sung: mô tả quy trình cài đặt/chạy hệ thống ở mức báo cáo, không cần chi tiết như runbook.

Nội dung nên có:

- Điều kiện môi trường: Node.js, npm, Docker, Supabase/PostgreSQL, Redis.
- Chạy Redis bằng Docker Compose.
- Chạy backend NestJS.
- Chạy frontend Next.js.
- Kiểm tra health/API.
- Biến môi trường quan trọng: database URL, Redis, OpenAI API key, auth.

Nguồn nên đối chiếu: `README.md`, `server/README.md`, `client/README.md`.

## 4.15 Kiểm Soát Chất Lượng Trong Quá Trình Xây Dựng

> Cần bổ sung: mô tả các biện pháp dùng trong phát triển: TypeScript, DTO validation, Zod output validation, Jest unit tests, Playwright e2e, lint/build, smoke check.

| Biện pháp | Áp dụng ở đâu | Mục đích |
| --- | --- | --- |
| TypeScript | Client/server | Cần bổ sung |
| DTO validation | Backend API | Cần bổ sung |
| Zod validation | AI output | Cần bổ sung |
| Unit test | Services/processors | Cần bổ sung |
| E2E test | Client luồng chính | Cần bổ sung |
| Runtime smoke check | Backend/local | Cần bổ sung |

## 4.16 Tổng Kết Chương

> Cần bổ sung: tóm tắt sản phẩm GR1 đã được phân tích và thiết kế như thế nào, nhấn mạnh các thành phần chính sẽ được đánh giá ở Chương 5.

---
 