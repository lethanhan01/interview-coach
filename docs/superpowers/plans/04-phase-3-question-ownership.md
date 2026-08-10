# Phase 3 — Question ownership và question-generation worker

**Mục tiêu:** Question Bank, Criterion mapping, question metadata và question generation cùng một owner; `AiModule` không còn sở hữu worker này.

## Current state và ràng buộc

`QuestionGenerationProcessor` hiện ở `src/ai/processors`, import Prisma/SSE/ContextPack/Pipeline/QuestionBank/QuestionCriteria/OpenAI và tự làm hybrid generation, fallback, persistence, active status/event. `QuestionBankModule` đã import `QuestionCriteriaModule`.

Giữ nguyên queue `question-generation`, job name/payload/retry, hybrid AI-bank ratio, metadata normalization, random selection, order index, rubric criterion links, error/active status và SSE `session.status`.

## Nhiệm vụ

- [ ] Tạo `QuestionModule` facade chứa/expose `QuestionBankService` và `QuestionCriteriaService`; migrate module imports trước khi xóa hai module cũ.
- [ ] Move question-specific prompt strategy và `question-metadata.ts` về Question khi import graph cho phép.
- [ ] Extract `GenerateSessionQuestions` application service từ processor.
- [ ] Chuyển vào use case: call AI strategy, normalize metadata, choose bank fallback, merge, build criterion data và persist transaction.
- [ ] Để processor làm deserialize job, call use case, map BullMQ retry/failure và emit SSE; không thêm business branch mới.
- [ ] Move processor/DTO vào Question, bảo đảm một và chỉ một `@Processor(QUESTION_GEN_QUEUE)` được đăng ký.
- [ ] Kiểm tra cancel/error race: worker không activate session đã stopped; fallback fail set `error` như cũ.
- [ ] Xóa exports/providers AI cũ sau search caller và build pass.

## Test bắt buộc

- AI + bank hybrid; AI unavailable -> bank; bank unavailable -> AI-only; cả hai fail -> error.
- Invalid metadata bị loại, question/criterion rows persist atomically, duplicate job không duplicate.
- Exact SSE payload `session.status` cho active/error và HTTP read questions/status.

## Exit criteria

- Question là owner duy nhất của queue consumer và business generation.
- Không có `AiModule` import vì question worker.
- Queue/SSE/database contracts pass và old processor/provider đã bị remove.
