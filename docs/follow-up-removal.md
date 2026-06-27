# Remove Follow-Up Question — Progress Tracker

**Branch:** `feat/mvp`  
**Plan file:** `C:\Users\An\.claude\plans\2026-06-28-remove-follow-up-question.md`  
**Status:** In progress — Tasks 1–2 complete, Task 3 là bước tiếp theo

---

## Tổng quan

Xóa hoàn toàn tính năng follow-up question khỏi server và client. Không ảnh hưởng đến feedback, transcription, report, và các tính năng khác.

**Quy trình mỗi task:** sửa code → build/test pass → xác nhận với user → cập nhật file này → chuyển task tiếp. Không commit theo yêu cầu.

---

## Trạng thái hiện tại

| Task | Trạng thái | Build/Test | Ghi chú |
|------|-----------|------------|---------|
| Task 1 — AI layer | DONE | build pass | Unstaged (chưa commit) |
| Task 2 — Turn & Transcription | DONE | build pass | Unstaged (chưa commit) |
| Task 3 — Tests | Chưa bắt đầu | — | Bước tiếp theo |
| Task 4 — DB schema + migration | Chưa bắt đầu | — | Cần DB connection |
| Task 5 — Seed cleanup | Chưa bắt đầu | — | — |
| Task 6 — Client-side | Chưa bắt đầu | — | — |
| Task 7 — CLAUDE.md sync | Chưa bắt đầu | — | — |

---

## Tasks

### Task 1 — Xóa AI layer (processor, pipeline, prompt) ✓ DONE
- [x] Xóa `follow-up.processor.ts`, `follow-up.processor.spec.ts`, `followup-v1.0.ts`
- [x] Sửa `interview-pipeline.interface.ts` — xóa FollowUpInput, FollowUpResult, generateFollowUp()
- [x] Sửa `base-pipeline.service.ts` — xóa generateFollowUp() implementation
- [x] Sửa `pipeline.schemas.ts` — xóa FollowUpSchema
- [x] Sửa `prompt-builder.service.ts` — xóa 'follow-up' task
- [x] Sửa `ai.module.ts` — xóa FollowUpProcessor + FOLLOW_UP_QUEUE
- [x] `npm run build` pass (exit 0)
- [ ] Commit: `chore: remove follow-up AI pipeline, processor, and prompt`

### Task 2 — Xóa Turn & Transcription layer ✓ DONE
- [x] Xóa `follow-up-coordinator.service.ts`, `follow-up-coordinator.service.spec.ts`
- [x] Sửa `turn-response.dto.ts` — xóa `followUpQueued`
- [x] Sửa `queue.constants.ts` — xóa FOLLOW_UP_QUEUE, FOLLOW_UP_JOB_ATTEMPTS
- [x] Sửa `turn.service.ts` — xóa coordinator injection, followUpQueue, enqueue block, tất cả `followUpQueued` trong return
- [x] Sửa `turn.module.ts` — xóa coordinator + FOLLOW_UP_QUEUE registration
- [x] Sửa `transcription.processor.ts` — xóa coordinator injection, followUpQueue, session numQuestions query, enqueue block
- [x] `npm run build` pass hoàn toàn
- [ ] Commit: `chore: remove follow-up from turn service and transcription processor`

### Task 3 — Cập nhật tests (TIẾP THEO)
- [ ] Sửa `mock-factories.ts` — xóa createMockFollowUpCoordinatorService
- [ ] Sửa `turn.service.spec.ts` — xóa 2 follow-up test cases + mocks
- [ ] Sửa `turn.controller.spec.ts` — xóa followUpQueued từ mock result
- [ ] `npm run test` pass
- [ ] Commit: `chore: remove follow-up test utilities and assertions`

### Task 4 — DB schema + migration
- [ ] Sửa `schema.prisma` — xóa FollowUpQuestion model + relation trên UserAnswer
- [ ] Chạy `npx prisma migrate dev --name drop_follow_up_questions`
- [ ] `npx prisma generate` + `npm run build` pass
- [ ] Commit: `chore: drop follow_up_questions table from schema and migration`

### Task 5 — Seed cleanup
- [ ] Sửa `_helpers.ts` — xóa createFollowUp + FollowUpOpts
- [ ] Sửa `03-sessions.ts` — xóa 2 lần gọi createFollowUp
- [ ] `npm run build` pass
- [ ] Commit: `chore: remove follow-up seed data helpers`

### Task 6 — Client-side
- [ ] Sửa `[sessionId]/page.tsx` — xóa followUp state, SSE listener, setFollowUp(null), fix QuestionCard prop
- [ ] `npm run lint` pass (client/)
- [ ] Commit: `chore: remove follow-up question from interview page`

### Task 7 — CLAUDE.md sync
- [ ] Sửa `server/src/turn/CLAUDE.md`
- [ ] Sửa `server/src/ai/CLAUDE.md`
- [ ] Sửa `server/CLAUDE.md`
- [ ] Sửa `client/app/(app)/sessions/CLAUDE.md`
- [ ] Commit: `docs: sync CLAUDE.md files after follow-up feature removal`

---

## Quyết định quan trọng

| Quyết định | Lý do |
|-----------|-------|
| Xóa `followUpQueued` khỏi `TurnResponseDto` hoàn toàn | Field này không còn ý nghĩa sau khi feature bị xóa; giữ lại sẽ gây hiểu nhầm cho client |
| Xóa session `numQuestions` query trong `TranscriptionProcessor` | Query đó chỉ tồn tại để feed vào `shouldGenerateFollowUp()`; không có use case nào khác |
| Xóa `FollowUpCoordinatorService` thay vì chỉ empty class | Class không còn caller nào; giữ lại là dead code |
| Không commits theo yêu cầu của user | User muốn kiểm soát commit thời điểm riêng |

---

## Files thay đổi

| File | Action |
|------|--------|
| `server/src/ai/processors/follow-up.processor.ts` | DELETE |
| `server/src/ai/processors/follow-up.processor.spec.ts` | DELETE |
| `server/src/ai/prompts/followup-v1.0.ts` | DELETE |
| `server/src/turn/follow-up-coordinator.service.ts` | DELETE |
| `server/src/turn/follow-up-coordinator.service.spec.ts` | DELETE |
| `server/src/ai/pipelines/interview-pipeline.interface.ts` | MODIFY |
| `server/src/ai/pipelines/base-pipeline.service.ts` | MODIFY |
| `server/src/ai/pipelines/pipeline.schemas.ts` | MODIFY |
| `server/src/ai/prompt-builder.service.ts` | MODIFY |
| `server/src/ai/ai.module.ts` | MODIFY |
| `server/src/ai/processors/transcription.processor.ts` | MODIFY |
| `server/src/turn/turn.service.ts` | MODIFY |
| `server/src/turn/turn.module.ts` | MODIFY |
| `server/src/turn/dto/turn-response.dto.ts` | MODIFY |
| `server/src/common/constants/queue.constants.ts` | MODIFY |
| `server/src/test-utils/mock-factories.ts` | MODIFY |
| `server/src/turn/turn.service.spec.ts` | MODIFY |
| `server/src/turn/turn.controller.spec.ts` | MODIFY |
| `server/prisma/schema.prisma` | MODIFY |
| `server/prisma/seed/_helpers.ts` | MODIFY |
| `server/prisma/seed/03-sessions.ts` | MODIFY |
| `client/app/(app)/sessions/[sessionId]/page.tsx` | MODIFY |
| `server/src/turn/CLAUDE.md` | MODIFY |
| `server/src/ai/CLAUDE.md` | MODIFY |
| `server/CLAUDE.md` | MODIFY |
| `client/app/(app)/sessions/CLAUDE.md` | MODIFY |
