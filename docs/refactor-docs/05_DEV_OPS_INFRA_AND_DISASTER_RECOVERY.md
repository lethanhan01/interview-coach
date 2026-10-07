# TÀI LIỆU 05: PHASE 5 — VẬN HÀNH DEVOPS, QUAN SÁT PHÂN TÁN & QUẢN TRỊ SỰ CỐ
# (MASTER BLUEPRINT & NAVIGATION INDEX)

> **Trạng thái**: Approved / Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead SRE)  
> **Áp dụng cho**: Toàn bộ Monorepo (`client/`, `server/`, `ai-service/`), Hạ tầng Docker, OpenTelemetry, CI/CD, SRE  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md](01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md)  
> **Thư mục tài liệu chi tiết**: [05_PHASE_5_DEV_OPS_INFRA/](05_PHASE_5_DEV_OPS_INFRA/00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.1.0 (Chuẩn hóa toàn diện chuỗi thực thi tuần tự & Thuật ngữ tiếng Anh kỹ thuật)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Phase 5 thiết lập tiêu chuẩn vận hành cấp doanh nghiệp (Enterprise SRE & DevOps) cho toàn bộ hệ sinh thái InterviewAI:
* **Quản trị Polyglot Monorepo**: Đồng bộ mã nguồn giữa Next.js (TypeScript), NestJS (TypeScript) và AI Service (Python) trong một Git repository duy nhất với quy trình đóng gói Multi-stage Docker tối ưu dung lượng và tốc độ build qua `uv`.
* **Automated Contract Testing**: Chống rủi ro Schema Drift giữa TypeScript DTOs và Python Pydantic models trong pipeline GitHub Actions trước khi merge mã nguồn.
* **Distributed Observability & Agent Tracing Toàn diện**: Chuẩn hóa W3C `traceparent` qua HTTP, WebSocket và hàng đợi BullMQ; truy vết chi tiết từng Node trong LangGraph StateGraph, Tool call latencies, và hạch toán chi phí Token Accounting trên Prometheus/Grafana.
* **Incident Runbooks P1/P2 & Zero-Downtime Rollback**: 4 kịch bản phục hồi sự cố tức thì với các dòng lệnh chuẩn xác, kỹ thuật migration CSDL an toàn không khóa bảng (`CREATE INDEX CONCURRENTLY` ngoài transaction), và cơ chế khôi phục khẩn cấp về baseline NestJS trong $< 3\text{ phút}$.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK (TASK BREAKDOWN DIRECTORY)

Để tiến hành triển khai mã nguồn tuần tự, AI Agent bắt buộc thực thi lần lượt các tài liệu đặc tả độc lập theo từng task trong thư mục [05_PHASE_5_DEV_OPS_INFRA/](05_PHASE_5_DEV_OPS_INFRA/00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md):

```
docs/refactor-docs/05_PHASE_5_DEV_OPS_INFRA/
├── 00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md              # Kiến trúc tổng thể, SRE Blueprint & Roadmap Master
├── 01_POLYGLOT_MONOREPO_AND_MULTI_STAGE_CONTAINERS.md  # Task 5.1: Multi-stage Dockerfiles, uv & Docker Compose
├── 02_CI_CD_PIPELINE_AND_AUTOMATED_CONTRACT_TESTS.md   # Task 5.2: GitHub Actions Matrix & Wire Contract Testing
├── 03_DISTRIBUTED_OBSERVABILITY_OPENTELEMETRY_PROMETHEUS.md # Task 5.3: W3C Tracing, LangGraph Spans, Tool Metrics & Token Accounting
├── 04_DISASTER_RECOVERY_RUNBOOKS_AND_CIRCUIT_BREAKERS.md# Task 5.4: P1/P2 Incident Runbooks & BullMQ Unstall
└── 05_ZERO_DOWNTIME_DEPLOYMENT_AND_ROLLBACK_STRATEGY.md# Task 5.5: Non-transactional Migrations & Baseline Rollback
```

### Bảng Tóm tắt Phân công & Phạm vi Từng Task:

| Task ID | Tên Tài liệu & Liên kết | Phạm vi Triển khai | Công nghệ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **5.1** | [01_POLYGLOT_MONOREPO_AND_MULTI_STAGE_CONTAINERS.md](05_PHASE_5_DEV_OPS_INFRA/01_POLYGLOT_MONOREPO_AND_MULTI_STAGE_CONTAINERS.md) | Monorepo Root, Dockerfiles | `uv`, Multi-stage builds, Alpine, Docker Compose |
| **5.2** | [02_CI_CD_PIPELINE_AND_AUTOMATED_CONTRACT_TESTS.md](05_PHASE_5_DEV_OPS_INFRA/02_CI_CD_PIPELINE_AND_AUTOMATED_CONTRACT_TESTS.md) | `.github/workflows/` | GitHub Actions, Paths-filter, Contract Verification |
| **5.3** | [03_DISTRIBUTED_OBSERVABILITY_OPENTELEMETRY_PROMETHEUS.md](05_PHASE_5_DEV_OPS_INFRA/03_DISTRIBUTED_OBSERVABILITY_OPENTELEMETRY_PROMETHEUS.md) | `server/`, `ai-service/`, Grafana | OpenTelemetry, LangGraph Spans, Tool Metrics, Token Accounting, Prometheus, Alerts |
| **5.4** | [04_DISASTER_RECOVERY_RUNBOOKS_AND_CIRCUIT_BREAKERS.md](05_PHASE_5_DEV_OPS_INFRA/04_DISASTER_RECOVERY_RUNBOOKS_AND_CIRCUIT_BREAKERS.md) | Đội ngũ On-Call & SRE | P1/P2 Runbooks, Fast Cloud Failover, BullMQ Unstall |
| **5.5** | [05_ZERO_DOWNTIME_DEPLOYMENT_AND_ROLLBACK_STRATEGY.md](05_PHASE_5_DEV_OPS_INFRA/05_ZERO_DOWNTIME_DEPLOYMENT_AND_ROLLBACK_STRATEGY.md) | `server/prisma/`, DevOps | Non-blocking Indexing, Expand/Contract, Baseline Rollback |

---

## 3. KHUNG BÀN GIAO & LIÊN KẾT TUẦN TỰ (PHASE 5 EXECUTION & HANDOVER PROTOCOL)

### 3.1 Tiền đề Bàn giao Nhận từ Phase 4 (Incoming Handover)
* Toàn bộ 4 tính năng AI (Audio STT/TTS, pgvector RAG, 2-Pass Assessment, và Full-Duplex vLLM) đã hoạt động hoàn chỉnh ở môi trường Dev.
* Đã vượt qua toàn bộ tiêu chí của **Quality Gate 4**.

### 3.2 Chuỗi Thực thi Tuần tự (Task Sequential Flow)
```
Task 5.1 (Monorepo & Docker) ──> Task 5.2 (CI/CD Contracts) ──> Task 5.3 (Observability)
                                                                            │
Task 5.5 (Zero-Downtime Deploy) <── Task 5.4 (Incident Runbooks) <──────────┘
```

### 3.3 Đóng góp Bootstrap Hạ tầng Cho Các Phase Trước (Cross-Phase Bootstrap)
* **Task 5.1**: Cung cấp mẫu Docker Compose đa dịch vụ phục vụ Tier 2 Live Testing cho Task 1.1, 2.1, 3.5 và 4.1.
* **Task 5.2**: Cung cấp runner kiểm thử hợp đồng tự động trên shared fixtures tại `contracts/fixtures/` cho Task 1.4 và Task 2.5.

### 3.4 Hoàn Tất Toàn Bộ Lộ Trình (Final Roadmap Completion)
* Sau khi hoàn thành Task 5.5 và vượt qua **Quality Gate 5**, toàn bộ hệ thống InterviewAI Polyglot Hybrid Architecture chính thức sẵn sàng Production.

---

## 4. CHỈ TIÊU NGHIỆM THU PHASE 5 (QUALITY GATE 5)

1. **High Availability Vận hành**: Cam kết mức độ sẵn sàng của nền tảng đạt $\ge 99.9\%$.
2. **Kháng Lệch Hợp Đồng (Zero Schema Drift)**: $100\%$ các thay đổi schema/DTO đều phải vượt qua bộ Contract Tests trong CI GitHub Actions trước khi được merge vào nhánh chính (`main`).
3. **Thời Gian Khắc Phục Sự Cố Khẩn Cấp (MTTR)**: Toàn bộ quá trình chuyển mạch sang Cloud Fallback khi Python AI sập diễn ra trong $< 2\text{ phút}$.
4. **An Toàn Dữ Liệu Tuyệt Đối**: Quá trình migration pgvector HNSW và các kịch bản rollback khẩn cấp đảm bảo $0\%$ mất mát dữ liệu hoặc gián đoạn phiên thi của thí sinh.
