# TÀI LIỆU 05: PHASE 5 — VẬN HÀNH DEVOPS, QUAN SÁT PHÂN TÁN & QUẢN TRỊ SỰ CỐ
# (MASTER BLUEPRINT & NAVIGATION INDEX)

> **Trạng thái**: Approved / Production Architecture Specification  
> **Cấp độ**: Production Specification (System Architect / Lead SRE)  
> **Áp dụng cho**: Toàn bộ Monorepo (`client/`, `server/`, `ai-service/`), Hạ tầng Docker, OpenTelemetry, CI/CD, SRE  
> **Tài liệu tham chiếu**: [00_OVERVIEW_STRATEGIC_BLUEPRINT.md](00_OVERVIEW_STRATEGIC_BLUEPRINT.md), [01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md](01_PHASE_1_AUDIO_ENGINE_AND_PILOT.md)  
> **Thư mục tài liệu chi tiết**: [05_PHASE_5_DEV_OPS_INFRA/](05_PHASE_5_DEV_OPS_INFRA/00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0 (Đã phân rã thành bộ tài liệu chuyên sâu 5 tasks)  

---

## 1. TỔNG QUAN CHIẾN LƯỢC

Phase 5 thiết lập tiêu chuẩn vận hành cấp doanh nghiệp (Enterprise SRE & DevOps) cho toàn bộ hệ thống InterviewAI:
* **Quản trị Monorepo Đa ngôn ngữ (Polyglot Monorepo)**: Đồng bộ mã nguồn giữa Next.js (TypeScript), NestJS (TypeScript) và AI Service (Python) trong một Git repository duy nhất với quy trình đóng gói Multi-stage Docker tối ưu dung lượng và tốc độ build qua `uv`.
* **Kiểm thử Hợp đồng Đa ngôn ngữ Tự động (Automated Contract Testing)**: Chống rủi ro lệch schema giữa TypeScript DTOs và Python Pydantic models trong pipeline GitHub Actions trước khi merge mã nguồn.
* **Quan sát Phân tán Toàn diện (Distributed Observability)**: Chuẩn hóa W3C `traceparent` qua HTTP, WebSocket và hàng đợi BullMQ; đo lường chính xác các chỉ số p50/p95/p99 latency cho STT, TTS, RAG và GPU VRAM trên Prometheus/Grafana.
* **Sổ tay Ứng cứu Khẩn cấp (Production Runbooks P1/P2) & Zero-Downtime Rollback**: 4 kịch bản phục hồi sự cố tức thì với các dòng lệnh chuẩn xác, kỹ thuật migration CSDL an toàn không khóa bảng (`CREATE INDEX CONCURRENTLY` ngoài transaction), và cơ chế khôi phục khẩn cấp về baseline NestJS trong $< 3\text{ phút}$.

---

## 2. HỆ THỐNG TÀI LIỆU ĐẶC TẢ CHI TIẾT THEO TASK (TASK BREAKDOWN DIRECTORY)

Để tiến hành triển khai mã nguồn hoặc phân chia công việc cho các kỹ sư, vui lòng truy cập các tài liệu đặc tả độc lập theo từng task trong thư mục [05_PHASE_5_DEV_OPS_INFRA/](05_PHASE_5_DEV_OPS_INFRA/00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md):

```
docs/refactor-docs/05_PHASE_5_DEV_OPS_INFRA/
├── 00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md              # Kiến trúc tổng thể, SRE Blueprint & Roadmap Master
├── 01_POLYGLOT_MONOREPO_AND_MULTI_STAGE_CONTAINERS.md  # Task 5.1: Multi-stage Dockerfiles, uv & Docker Compose
├── 02_CI_CD_PIPELINE_AND_AUTOMATED_CONTRACT_TESTS.md   # Task 5.2: GitHub Actions Matrix & Wire Contract Testing
├── 03_DISTRIBUTED_OBSERVABILITY_OPENTELEMETRY_PROMETHEUS.md # Task 5.3: W3C Tracing, Prometheus Metrics & Alerts
├── 04_DISASTER_RECOVERY_RUNBOOKS_AND_CIRCUIT_BREAKERS.md# Task 5.4: P1/P2 Incident Runbooks & BullMQ Unstall
└── 05_ZERO_DOWNTIME_DEPLOYMENT_AND_ROLLBACK_STRATEGY.md# Task 5.5: Non-transactional Migrations & Baseline Rollback
```

### Bảng Tóm tắt Phân công & Phạm vi Từng Task:

| Task ID | Tên Tài liệu & Liên kết | Phạm vi Triển khai | Công nghệ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **5.1** | [01_POLYGLOT_MONOREPO_AND_MULTI_STAGE_CONTAINERS.md](05_PHASE_5_DEV_OPS_INFRA/01_POLYGLOT_MONOREPO_AND_MULTI_STAGE_CONTAINERS.md) | Monorepo Root, Dockerfiles | `uv`, Multi-stage builds, Alpine, Docker Compose |
| **5.2** | [02_CI_CD_PIPELINE_AND_AUTOMATED_CONTRACT_TESTS.md](05_PHASE_5_DEV_OPS_INFRA/02_CI_CD_PIPELINE_AND_AUTOMATED_CONTRACT_TESTS.md) | `.github/workflows/` | GitHub Actions, Paths-filter, Contract Verification |
| **5.3** | [03_DISTRIBUTED_OBSERVABILITY_OPENTELEMETRY_PROMETHEUS.md](05_PHASE_5_DEV_OPS_INFRA/03_DISTRIBUTED_OBSERVABILITY_OPENTELEMETRY_PROMETHEUS.md) | `server/`, `ai-service/`, Grafana | OpenTelemetry, W3C TraceContext, Prometheus, Alerts |
| **5.4** | [04_DISASTER_RECOVERY_RUNBOOKS_AND_CIRCUIT_BREAKERS.md](05_PHASE_5_DEV_OPS_INFRA/04_DISASTER_RECOVERY_RUNBOOKS_AND_CIRCUIT_BREAKERS.md) | Đội ngũ On-Call & SRE | P1/P2 Runbooks, Fast Cloud Failover, BullMQ Unstall |
| **5.5** | [05_ZERO_DOWNTIME_DEPLOYMENT_AND_ROLLBACK_STRATEGY.md](05_PHASE_5_DEV_OPS_INFRA/05_ZERO_DOWNTIME_DEPLOYMENT_AND_ROLLBACK_STRATEGY.md) | `server/prisma/`, DevOps | Non-transactional Indexing, Expand/Contract, Rollback |

---

## 3. CHỈ TIÊU NGHIỆM THU PHASE 5 (QUALITY GATES)

1. **Tính Ổn Định Vận Hành (High Availability)**: Cam kết mức độ sẵn sàng của nền tảng đạt $\ge 99.9\%$.
2. **Kháng Lệch Hợp Đồng Dữ Liệu**: $100\%$ các thay đổi schema/DTO đều phải vượt qua bộ kiểm thử hợp đồng trong CI trước khi được merge vào nhánh chính (`main`).
3. **Thời Gian Khắc Phục Sự Cố Khẩn Cấp (MTTR)**: Toàn bộ quá trình chuyển mạch sang Cloud API khi Python AI sập diễn ra trong $< 2\text{ phút}$.
4. **An Toàn Dữ Liệu Tuyệt Đối**: Quá trình migration pgvector HNSW và các kịch bản rollback khẩn cấp đảm bảo $0\%$ mất mát dữ liệu hoặc gián đoạn phiên thi của thí sinh.
