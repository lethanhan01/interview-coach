# Kế hoạch refactor backend

Đây là điểm vào cho refactor `server/`. File roadmap tổng giữ các quyết định kiến trúc, contract bất biến và risk register; mỗi phase dưới đây là tài liệu thực thi chính thức cho phase đó.

| Thứ tự | Phase | Trạng thái | Tài liệu |
| --- | --- | --- | --- |
| 0 | Baseline và safety net | Hoàn tất | [Phase 0](./01-phase-0-safety-net.md) · [Contract inventory](./00-phase-0-contract-inventory.md) |
| 1 | Rubric Catalog về Assessment | Hoàn tất | [Phase 1](./02-phase-1-rubric-catalog.md) |
| 2 | Cô lập OpenAI/provider boundary | Hoàn tất | [Phase 2](./03-phase-2-ai-provider-boundary.md) |
| 3 | Question ownership và worker | Hoàn tất | [Phase 3](./04-phase-3-question-ownership.md) |
| 4 | Voice, storage và transcription | Hoàn tất | [Phase 4](./05-phase-4-voice-storage-transcription.md) |
| 5 | Assessment và feedback | Hoàn tất | [Phase 5](./06-phase-5-assessment-feedback.md) |
| 6 | Reporting workflow | Hoàn tất | [Phase 6](./07-phase-6-reporting-workflow.md) |
| 7 | Session lifecycle | Hoàn tất | [Phase 7](./08-phase-7-session-lifecycle.md) |
| 8 | Turn/answer workflow | Chưa bắt đầu | [Phase 8](./09-phase-8-turn-answer-workflow.md) |
| 9 | Infrastructure placement | Chưa bắt đầu | [Phase 9](./10-phase-9-infrastructure-cleanup.md) |
| 10 | Identity review | Chưa bắt đầu | [Phase 10](./11-phase-10-identity-review.md) |

Theo dõi cập nhật sau mỗi PR tại [Refactor progress](./refactor-progress.md). Không bắt đầu phase sau khi phase trước chưa đạt exit criteria.

## Quy tắc dùng tài liệu

1. Trước PR, chuyển task tương ứng từ `- [ ]` sang `- [~]` trong file phase và thêm entry “Bắt đầu” vào progress log.
2. Sau PR merge, ghi commit/PR, evidence test, contract đã kiểm tra và quyết định mới vào progress log; sau đó tick task.
3. Khi phát hiện scope mới, thêm vào phase đang làm hoặc phase sau; không âm thầm thay đổi contract chung.
4. Chỉ đánh dấu phase hoàn tất khi toàn bộ exit criteria trong file phase và common verification trong roadmap tổng đều đạt.

## Tài liệu nền

- [Roadmap tổng và đánh giá kiến trúc](./2026-08-10-server-backend-refactor-roadmap.md)
- [Tiến độ refactor](./refactor-progress.md)
- [Contract inventory Phase 0](./00-phase-0-contract-inventory.md)
