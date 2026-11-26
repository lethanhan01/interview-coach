# TÀI LIỆU 05: PHASE 5 — VẬN HÀNH DEVOPS, TRIỂN KHAI & STRUCTURED LOGGING
# (PRAGMATIC DEVOPS, DOCKER COMPOSE & OBSERVABILITY SPECIFICATION)

> **Trạng thái**: Approved / Pragmatic Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead DevOps)  
> **Áp dụng cho**: Toàn bộ Monorepo (`client/`, `server/`, `ai-service/`), Docker, GitHub Actions, Logging  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md](01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md)  
> **Thư mục tài liệu chi tiết**: [05_PHASE_5_DEV_OPS_INFRA/](05_PHASE_5_DEV_OPS_INFRA/00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 3.0.0 (Tinh giản thực dụng: Docker Compose 5 dịch vụ, CI GitHub Actions, Structured Logging có correlation-id)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Phase 5 thiết lập nền tảng hạ tầng vận hành tinh gọn, ổn định và dễ bảo trì lâu dài cho toàn bộ hệ sinh thái InterviewCoach:

$$\mathbf{Pragmatic\ DevOps} = \mathbf{Multi\text{-}Stage\ Docker\ Compose} + \mathbf{Automated\ CI\ Contract\ Matrix} + \mathbf{Structured\ JSON\ Logging}$$

1. **Đóng gói Docker Compose Đa dịch vụ Chuẩn hóa**:
   * Khởi chạy trọn gói 5 thành phần trong một câu lệnh duy nhất: PostgreSQL 16 (`pgvector`), Redis 7, NestJS Core (`server`), Python AI Service (`ai-service`), và Next.js (`client`).
   * Tối ưu hóa thời gian build của Python thông qua `uv`, hỗ trợ target `cpu` gọn nhẹ cho môi trường phát triển cục bộ và máy chủ phổ thông.
2. **Kiểm thử Hợp đồng Tự động trong CI/CD (GitHub Actions)**:
   * Ngăn chặn hoàn toàn rủi ro lệch Schema (Schema Drift) giữa TypeScript DTOs và Python Pydantic models trước khi merge mã nguồn.
   * Tự động chạy song song Jest tests cho Frontend/Backend và Pytest cho AI Service.
3. **Structured JSON Logging & Truy vết Correlation-ID**:
   * Chuẩn hóa log một dòng JSON có cấu trúc (`timestamp`, `level`, `service`, `correlationId`, `message`, `durationMs`).
   * Lan truyền header `x-correlation-id` xuyên suốt từ Client $\to$ NestJS API $\to$ BullMQ Outbox $\to$ Python FastAPI, giúp tra cứu lỗi tức thời mà không cần cụm OpenTelemetry hay Jaeger cồng kềnh.
4. **Chiến lược Migration An toàn & Cloud Rollback**:
   * Tạo index vector không khóa bảng (`CREATE INDEX CONCURRENTLY`).
   * Cơ chế Circuit Breaker tự ngắt mạch và chuyển sang OpenAI Cloud Fallback qua cờ `AI_FALLBACK_ENABLED=true` khi Python service gặp sự cố.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK

Thư mục [05_PHASE_5_DEV_OPS_INFRA/](05_PHASE_5_DEV_OPS_INFRA/00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md) được tinh giản thành 4 tasks cốt lõi:

```
docs/refactor-docs/05_PHASE_5_DEV_OPS_INFRA/
├── 00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md              # Kiến trúc tổng thể & Quality Gate 5
├── 01_POLYGLOT_MONOREPO_AND_MULTI_STAGE_CONTAINERS.md  # Task 5.1: Multi-stage Dockerfiles, uv & Docker Compose
├── 02_CI_CD_PIPELINE_AND_AUTOMATED_CONTRACT_TESTS.md   # Task 5.2: GitHub Actions Matrix & Wire Contract Testing
├── 03_STRUCTURED_LOGGING_AND_CORRELATION_ID.md          # Task 5.3: Structured JSON Logging & Correlation-ID
└── 05_ZERO_DOWNTIME_DEPLOYMENT_AND_ROLLBACK_STRATEGY.md# Task 5.4: Safe Migrations & Emergency Cloud Rollback
```

### Bảng Tóm tắt Phân công & Phạm vi Từng Task:

| Task ID | Tên Tài liệu & Liên kết | Phạm vi Triển khai | Công nghệ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **5.1** | [01_POLYGLOT_MONOREPO_AND_MULTI_STAGE_CONTAINERS.md](05_PHASE_5_DEV_OPS_INFRA/01_POLYGLOT_MONOREPO_AND_MULTI_STAGE_CONTAINERS.md) | Monorepo Root, Dockerfiles | `uv`, Multi-stage builds, Alpine, Docker Compose |
| **5.2** | [02_CI_CD_PIPELINE_AND_AUTOMATED_CONTRACT_TESTS.md](05_PHASE_5_DEV_OPS_INFRA/02_CI_CD_PIPELINE_AND_AUTOMATED_CONTRACT_TESTS.md) | `.github/workflows/` | GitHub Actions, Paths-filter, Contract Verification |
| **5.3** | [03_STRUCTURED_LOGGING_AND_CORRELATION_ID.md](05_PHASE_5_DEV_OPS_INFRA/03_STRUCTURED_LOGGING_AND_CORRELATION_ID.md) | `server/`, `ai-service/` | Structured JSON Logging, `x-correlation-id` Header, Structlog |
| **5.4** | [05_ZERO_DOWNTIME_DEPLOYMENT_AND_ROLLBACK_STRATEGY.md](05_PHASE_5_DEV_OPS_INFRA/05_ZERO_DOWNTIME_DEPLOYMENT_AND_ROLLBACK_STRATEGY.md) | `server/prisma/`, DevOps | Non-blocking Indexing, Circuit Breaker, Strict Toggle Rollback |

---

## 3. TIÊU CHÍ NGHIỆM THU (QUALITY GATE 5)

1. **Khởi động Một Lệnh (One-Command Boot)**: `docker compose up -d` khởi động thành công toàn bộ 5 dịch vụ trong $< 2\text{ phút}$.
2. **Kháng Lệch Hợp Đồng Tuyệt Đối**: 100% Contract Tests pass trong CI GitHub Actions trước khi merge code.
3. **Khả Năng Truy Vết Toàn Trình**: Tra cứu log bằng `correlationId` hiển thị đầy đủ chuỗi sự kiện từ NestJS sang Python và ngược lại.
4. **Thời Gian Phục Hồi Khi Có Sự Cố (MTTR)**: Tự động chuyển mạch sang Cloud API trong $< 1\text{s}$ khi Python service sập hoặc timeout.
