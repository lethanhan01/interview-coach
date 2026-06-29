# Plan xử lý lỗi feedback dimension khi giữ local model hiện tại

## Summary

Mục tiêu là giảm tối đa tình trạng câu trả lời bị mất đánh giá AI do local model trả sai `applied_dimensions`, nhưng vẫn giữ chuẩn chấm điểm của backend và không đổi model `google/gemma-4-e4b`.

Hướng xử lý chính: **backend sẽ tự normalize dimension ID an toàn trước khi fallback**, đồng thời **siết prompt để model copy đúng ID**, và chỉ fallback khi output thật sự không thể dùng được. Không cần đổi local model, không cần đổi DB schema, không cần đổi frontend contract.

## Key Changes

- Thêm helper normalize dimension trong feedback pipeline:
  - Nhận exact ID trước.
  - Sau đó nhận case-insensitive ID, ID sau khi bỏ khoảng trắng/gạch/ký tự thừa, và tên dimension nếu AI trả nhầm `name` thay vì `id`.
  - Chỉ map trong danh sách dimension hợp lệ của session type hiện tại: `hr` chỉ behavioral, `technical` chỉ technical, `mixed` dùng cả hai.
  - Không dùng fuzzy matching/semantic guessing để tránh map sai rubric.
  - Nếu AI trả vừa dimension hợp lệ vừa dimension sai, giữ phần hợp lệ và bỏ phần sai.
  - Nếu duplicate cùng một dimension, giữ bản hợp lệ đầu tiên để kết quả deterministic.
  - Score vẫn phải là integer `1-100`; không tự clamp score sai.

- Chỉnh prompt feedback để local model ít trả sai hơn:
  - Trong `PromptBuilderService.applyContextPackForEvaluation`, xuất allowed dimensions dưới dạng JSON-like rõ ràng:
    `{ "id": "D1", "name": "Communication" }`
  - Thêm rule bắt buộc: `applied_dimensions[].id must be copied exactly from allowedDimensionIds`.
  - Với HR/Technical/Mixed vẫn giữ rule không dùng dimension ngoài session type.

- Cập nhật `BasePipelineService.evaluateAnswer`:
  - Sau khi parse JSON và validate `FeedbackSchema`, gọi helper normalize dimension.
  - Nếu normalize ra ít nhất 1 dimension hợp lệ, tính lại weight/overallScore như hiện tại và lưu feedback thật với `isFallback=false`.
  - Nếu normalize vẫn bằng 0, mới ném `SCHEMA_VALIDATION_ERROR: AI returned no valid scoring dimensions`.
  - Log warning ngắn gọn khi có dimension bị loại/map lại, chỉ ghi count/ID metadata, không log raw answer hoặc raw AI content.

- Giữ fallback hiện tại làm lớp bảo vệ cuối:
  - JSON không parse được, schema thiếu field quan trọng, score sai kiểu, hoặc không có dimension nào map được vẫn ghi `isFallback=true`.
  - Report semantics hiện tại giữ nguyên: fallback không hiển thị điểm/dimension như feedback thật.

## Test Plan

- Unit test cho dimension normalization:
  - Exact ID hợp lệ vẫn pass.
  - ID sai casing như `d1` map về `D1`.
  - ID có khoảng trắng/ký tự thừa như `D 1`, `D-1`, `" D1 "` map về `D1`.
  - AI trả name như `Communication` map về ID tương ứng.
  - Technical dimension trong HR bị loại.
  - Mixed session nhận cả behavioral và technical.
  - Duplicate dimension giữ bản đầu tiên.
  - Không còn dimension hợp lệ thì vẫn throw `SCHEMA_VALIDATION_ERROR`.

- Processor/integration tests:
  - Case trước đây fallback vì ID hơi sai nay phải ghi `aiFeedback.isFallback=false`, có `dimensionScores`, có `overallScore`.
  - JSON/schema thật sự sai vẫn ghi fallback như cũ.
  - Report với feedback đã repair phải có `reportQuality=full` hoặc `partial` đúng theo dữ liệu, không biến thành `unavailable`.
  - Không làm đổi behavior skip question và fallback quota/timeout.

- Validation commands:
  - `cd server && npm test -- base-pipeline.service.spec.ts`
  - `cd server && npm test -- feedback.processor.spec.ts feedback-flow.integration.spec.ts report.service.spec.ts`
  - `cd server && npm run build`
  - Nếu có DB/local runtime sẵn: chạy một phiên phỏng vấn HR với local model, xác nhận backend log không còn lặp `AI returned no valid scoring dimensions` cho các case có thể repair.

## Completion Criteria

Hoàn thành khi tất cả điều kiện sau đều đạt:

- Local model hiện tại vẫn được dùng, không đổi `OPENAI_BASE_URL`, `OPENAI_CHAT_MODEL`, provider SDK, hoặc luồng LM Studio.
- Các response AI có dimension ID sai nhẹ hoặc trả tên dimension vẫn được lưu thành feedback thật (`isFallback=false`).
- Các response thật sự hỏng vẫn fallback an toàn, không làm kẹt report generation.
- Report vẫn load bình thường, không phát sinh lỗi mới ở `reportQuality`, transcript, score, hoặc `appliedDimensions`.
- Các test mục tiêu và `npm run build` pass.
- Log runtime sau sửa không còn fallback hàng loạt do lỗi dimension ID trong phiên phỏng vấn bình thường.
