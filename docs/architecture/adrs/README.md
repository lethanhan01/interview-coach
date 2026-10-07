# TỔNG HỢP CÁC QUYẾT ĐỊNH KIẾN TRÚC (ARCHITECTURAL DECISION RECORDS - ADRs)

> **Trạng thái**: 🟢 Living Index  
> **Cấp độ**: System Decisions Index  
> **Tài liệu cha**: [docs/architecture/README.md](../README.md)  
> **Thư mục ADRs gốc**: [docs/Design/ArchitecturalDesign/ADRs/](../../Design/ArchitecturalDesign/ADRs/)  

---

## 1. MỤC ĐÍCH CỦA ADR
Mỗi tài liệu ADR (Architectural Decision Record) ghi lại một quyết định kiến trúc quan trọng, bối cảnh ra quyết định, các phương án đã cân nhắc và hệ quả kỹ thuật nhằm bảo đảm tính minh bạch cho các kỹ sư gia nhập dự án trong tương lai.

---

## 2. DANH MỤC CÁC QUYẾT ĐỊNH KIẾN TRÚC ĐÃ THỐNG NHẤT

| Mã ADR | Tiêu Đề Quyết Định | Trạng Thái | Ngày Quyết Định |
| :---: | :--- | :---: | :---: |
| **ADR-001** | [Lựa chọn Next.js App Router & React 19 cho Giao diện](../../Design/ArchitecturalDesign/ADRs/ADR-001-tech-stack-core.md) | Chấp thuận | Giai đoạn Khởi tạo |
| **ADR-002** | [Lựa chọn NestJS Modular Monolith cho Core Backend](../../Design/ArchitecturalDesign/ADRs/ADR-002-state-management.md) | Chấp thuận | Giai đoạn Khởi tạo |
| **ADR-003** | [Lựa chọn PostgreSQL 16 & Prisma ORM cho Persistence](../../Design/ArchitecturalDesign/ADRs/ADR-003-speech-to-text.md) | Chấp thuận | Giai đoạn Khởi tạo |
| **ADR-004** | [Áp dụng Kiến trúc Pragmatic Polyglot (NestJS + Python FastAPI)](../overview/README.md) | Chấp thuận | Refactor Roadmap |
| **ADR-005** | [Áp dụng Zero-Disk In-Memory Audio DSP qua PyAV](../audio-engine/stt-pipeline.md) | Chấp thuận | Phase 1 (Pilot) |
| **ADR-006** | [Sử dụng Hybrid TTS: Kokoro-82M (EN) & EdgeTTS (VI)](../audio-engine/tts-pipeline.md) | Chấp thuận | Phase 1 (Pilot) |
| **ADR-007** | [Chuẩn hóa Wire Contract camelCase & Dual Contract Testing](../audio-engine/contracts-and-testing.md) | Chấp thuận | Phase 1 (Pilot) |

*Khi có bất kỳ quyết định kiến trúc mới nào mang tính bước ngoặt, hãy tạo tệp ADR tương ứng và bổ sung vào bảng trên.*
