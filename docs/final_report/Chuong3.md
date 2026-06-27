# Chương 3. Cơ Sở Lý Thuyết Và Công Nghệ Nền Tảng

## 3.1 Tổng Quan Bài Toán AI Mock Interview Coach

> Cần bổ sung: mô tả hệ thống AI mock interview coach dưới góc nhìn chức năng và kỹ thuật.

Gợi ý:

- Input: hồ sơ người dùng, JD, cấu hình session, câu trả lời text/voice.
- Processing: sinh câu hỏi, đánh giá câu trả lời, tạo follow-up, tạo feedback và report.
- Output: danh sách câu hỏi, feedback theo câu, report tổng hợp, action plan.

## 3.2 Cơ Sở Lý Thuyết Về Phỏng Vấn Tuyển Dụng

### 3.2.1 Các Loại Phỏng Vấn Trong Tuyển Dụng CNTT

> Cần bổ sung: phỏng vấn HR/behavioral, technical knowledge, mixed interview, coding/system design nếu chỉ nêu như hướng phát triển.

### 3.2.2 Tiêu Chí Đánh Giá Ứng Viên Fresher

> Cần bổ sung: các nhóm năng lực như communication, problem-solving, technical depth, behavioral maturity, culture fit.

### 3.2.3 Phương Pháp STAR Và Cấu Trúc Câu Trả Lời

> Cần bổ sung: giải thích STAR (Situation, Task, Action, Result) và vai trò trong feedback behavioral. Nếu có dùng rubric riêng, đưa vào phụ lục.

## 3.3 Xử Lý Ngôn Ngữ Tự Nhiên Và Mô Hình Ngôn Ngữ Lớn

### 3.3.1 Khái Niệm LLM Và Ứng Dụng Trong Phân Tích Câu Trả Lời

> Cần bổ sung: mô tả khả năng của LLM trong hiểu ngữ cảnh, sinh câu hỏi, phân tích câu trả lời và tạo gợi ý cải thiện.

### 3.3.2 Prompt Engineering

> Cần bổ sung: trình bày vai trò của system prompt, task instruction, context, output schema, few-shot nếu có. Đối chiếu `server/src/ai/prompts/`.

### 3.3.3 Structured Output Và Kiểm Soát Kết Quả AI

> Cần bổ sung: giải thích vì sao cần schema validation, JSON output, Zod validator, fallback khi output không hợp lệ.

## 3.4 Speech-to-Text Và Phân Tích Câu Trả Lời Bằng Giọng Nói

> Cần bổ sung: trình bày cơ sở STT, vai trò của Whisper/OpenAI transcription nếu hệ thống có dùng, các chỉ số có thể khai thác như thời lượng, tốc độ nói, khoảng lặng, filler words.

Lưu ý:

- Nếu GR1 chưa hoàn thiện tất cả voice metrics, ghi rõ phạm vi đã thực hiện và phần để phát triển.
- Nếu demo bằng text là chính, không nên khẳng định voice analysis đã đầy đủ.

## 3.5 Feedback Tự Động Và Surgical Feedback

> Cần bổ sung: trình bày khái niệm feedback chi tiết theo từng câu trả lời, annotated transcript, highlight mức tốt/cảnh báo/nghiêm trọng, model answer và action plan.

| Thành phần feedback | Ý nghĩa | Dữ liệu đầu vào | Đầu ra mong đợi |
| --- | --- | --- | --- |
| Điểm tổng | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Nhận xét theo rubric | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Annotated segment | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Model answer | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Action plan | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 3.6 Kiến Trúc Ứng Dụng Web Hiện Đại

### 3.6.1 Frontend Với Next.js Và React

> Cần bổ sung: lý do chọn Next.js/React/TypeScript, routing, server/client component nếu cần, quản lý giao diện và gọi API.

### 3.6.2 Backend Với NestJS

> Cần bổ sung: lý do chọn NestJS, kiến trúc module/controller/service, dependency injection, validation pipe, exception filter.

### 3.6.3 REST API Và Server-Sent Events

> Cần bổ sung: phân biệt REST cho request/response và SSE cho cập nhật trạng thái phiên/report. Đối chiếu `docs/Design/DetailedDesign/api-design/API_design.md`.

## 3.7 Xử Lý Bất Đồng Bộ Với Hàng Đợi

> Cần bổ sung: trình bày vì sao các tác vụ AI cần xử lý bất đồng bộ: sinh câu hỏi, feedback, report có thể mất thời gian và cần retry/fallback. Giới thiệu Redis và BullMQ trong hệ thống.

## 3.8 Cơ Sở Dữ Liệu Và ORM

> Cần bổ sung: trình bày PostgreSQL/Supabase, Prisma ORM, schema, relation, migration/db push, seed data/question bank.

Nội dung nên có:

- Các nhóm bảng chính: users/profile, sessions/questions/answers, feedback/report, ai quality log.
- Quan hệ quan trọng: session - questions - answers - feedback - annotated segments.
- Lý do cần question bank fallback.

Nguồn nên đối chiếu: `docs/Design/DetailedDesign/database-design/Database.md` và `server/prisma/schema.prisma`.

## 3.9 Xác Thực, Bảo Mật Và Quyền Riêng Tư

> Cần bổ sung: trình bày các nguyên tắc bảo mật áp dụng cho hệ thống: JWT/Supabase Auth, validation input, rate limiting, bảo vệ PII, không lưu dữ liệu nhạy cảm không cần thiết, phân quyền truy cập dữ liệu.

## 3.10 Kiểm Thử Và Đánh Giá Chất Lượng Phần Mềm

> Cần bổ sung: trình bày các cấp kiểm thử cần có: unit, integration, e2e, smoke test, AI output schema test, manual review. Đối chiếu `docs/test-plan/strategy.md`.

## 3.11 Công Nghệ Và Công Cụ Sử Dụng

> Cần bổ sung: cập nhật chính xác theo `client/package.json`, `server/package.json` và tài liệu thiết kế.

| Nhóm | Công nghệ/công cụ | Vai trò trong dự án | Lý do lựa chọn |
| --- | --- | --- | --- |
| Frontend | Next.js, React, TypeScript | Cần bổ sung | Cần bổ sung |
| UI | Tailwind CSS, lucide-react | Cần bổ sung | Cần bổ sung |
| Backend | NestJS, TypeScript | Cần bổ sung | Cần bổ sung |
| Cơ sở dữ liệu | PostgreSQL/Supabase | Cần bổ sung | Cần bổ sung |
| ORM | Prisma | Cần bổ sung | Cần bổ sung |
| AI | OpenAI API, prompt pipeline | Cần bổ sung | Cần bổ sung |
| Queue/SSE | BullMQ, Redis, SSE | Cần bổ sung | Cần bổ sung |
| Kiểm thử | Jest, Playwright, Supertest | Cần bổ sung | Cần bổ sung |
| DevOps/local | Docker Compose, npm scripts | Cần bổ sung | Cần bổ sung |

## 3.12 Tổng Kết Chương

> Cần bổ sung: tóm tắt các lý thuyết và công nghệ nền tảng đã chọn, đóng vai trò làm cơ sở cho phần thiết kế và xây dựng ở Chương 4.

---
 