# Seed Audit — Issues Found

Audit của `server/prisma/seed/` — thực hiện 2026-06-20.

---

## Issue 1 — CRITICAL: startIndex/endIndex sai trong AnnotatedSegment

**File**: `seed/03-sessions.ts`

20/22 segment entries có `startIndex`/`endIndex` hardcode sai. Hai entry đúng tình cờ là S7-Q1-seg1 và S7-Q3-seg1.

| Session | Answer | Segment | Seed | Actual |
|---------|--------|---------|------|--------|
| S1-Q1 | vừa tốt nghiệp CNTT... | "vừa tốt nghiệp CNTT tại Bách Khoa Hà Nội" | [8,48] | [24,64] |
| S1-Q1 | | "xây dựng một hệ thống quản lý task nhỏ" | [92,130] | [111,149] |
| S1-Q2 | đọc documentation... | "đọc documentation và làm theo tutorial" | [90,128] | [83,121] |
| S1-Q2 | | "build project nhỏ để thực hành" | [133,163] | [126,156] |
| S1-Q3 | REST là architectural... | "stateless (mỗi request độc lập)" | [115,145] | [107,138] |
| S1-Q3 | | "dùng standard HTTP methods GET/POST/PUT/DELETE" | [165,211] | [159,205] |
| S2-Q1 | Tôi là sinh viên... | "muốn đóng góp cho team" | [78,99] | [103,125] |
| S2-Q2 | Điểm yếu... | "đặt time-box cho mỗi task" | [110,135] | [120,145] |
| S3-Q1 | REST stands for... | "Stateless — each request must..." | [145,234] | [137,228] |
| S3-Q1 | | "easy to test with tools like Postman" | [490,526] | [584,620] |
| S3-Q2 | My debugging process... | "binary search on code (commenting out halves)" | [112,156] | [157,202] |
| S3-Q2 | | "add a regression test" | [450,471] | [461,482] |
| S3-Q3 | For a URL shortener... | "base62 encoding of the auto-increment ID" | [230,270] | [229,269] |
| S3-Q3 | | "cache top 1% links in Redis (LRU)" | [380,413] | [466,499] |
| S4-Q1 | Tôi thích làm việc nhóm... | "phối hợp với bạn làm frontend qua Git" | [120,157] | [122,159] |
| S4-Q2 | Môi trường tôi muốn... | "cơ hội được mentor bởi senior" | [80,109] | [88,117] |
| S6-Q1 | Tôi thường sử dụng Git... | "yêu cầu code review từ teammate" | [150,181] | [152,183] |
| S6-Q3 | Tôi chọn IT vì... | "thích giải quyết vấn đề" | [10,33] | [15,38] |
| S7-Q2 | I usually just Google... | "I usually just Google it" | [0,23] | [0,24] |
| S7-Q2 | | "I'm not sure what else to say" | [38,66] | [41,70] |

**Fix**: Thêm helper `segAt(answerText, segmentText, opts)` vào `_helpers.ts` — tính `startIndex` bằng `indexOf()` tại runtime, ném lỗi nếu không tìm thấy. Thay toàn bộ hardcoded index pairs bằng `segAt()`.

**Status**: Fixed ✓

**Implemented 2026-06-20**: Thêm `segAt()` helper vào `_helpers.ts` (tính startIndex bằng `indexOf()`, throw nếu không tìm thấy). Thay toàn bộ 20 hardcoded `{ segmentText, startIndex, endIndex, ... }` literals trong `03-sessions.ts` bằng `segAt(answerText, segmentText, opts)`. Bổ sung import `segAt` và extract mỗi `answerText` ra biến riêng (`a1Text`, `s2q1Text`, ...) để dùng làm argument. Chạy `npm run format` + `npm run lint` — clean.

---

## Issue 2 — MEDIUM: QuestionBank idempotency guard count-based

**File**: `seed/02-question-bank.ts`

Guard hiện tại: `if (count >= 90) return`. Nếu bank có < 90 rows (seed bị gián đoạn), guard không skip và chạy `createMany` với `skipDuplicates: true`. Nhưng `QuestionBank` không có unique constraint trên `content`, nên `skipDuplicates` không có tác dụng — 90 rows mới được insert thêm, gây duplicate content.

**Fix**: Thay count guard bằng existence check trên content của câu hỏi đầu tiên.

**Status**: Fixed ✓

**Implemented 2026-06-20**: Thay `count >= 90` bằng `findFirst({ where: { content: QUESTIONS[0].content } })`. Guard giờ là idempotent thực sự — không bị ảnh hưởng bởi seed bị gián đoạn.

---

## Issue 3 — MEDIUM: JD strings có [SEED-Sx] prefix và nội dung quá ngắn

**File**: `seed/03-sessions.ts`

`[SEED-S1]`, `[SEED-S2]`, ... xuất hiện ở đầu JD string — hiển thị trong session list của demo user, trông như artifact hệ thống. JDs cũng quá ngắn (1-2 câu) so với JD thực tế.

**Fix**: Xóa prefix. Thay idempotency marker bằng `planJson: { _seed: 'SEED-Sx' }`. Viết lại JDs thực tế 3-4 câu với context công ty, stack cụ thể, mức lương.

**Status**: Fixed ✓

**Implemented 2026-06-20**: Xóa `[SEED-Sx]` khỏi tất cả 7 JD strings, viết lại thành 3–4 câu với tên công ty, tech stack và mức lương cụ thể. Thêm `planJson: { _seed: 'SEED-Sx' }` vào data block của mỗi `interviewSession.create`. Đổi `alreadySeeded()` query từ `jobDescription: { contains: marker }` sang `planJson: { path: ['_seed'], equals: marker }`.

---

## Issue 4 — MEDIUM: AiQualityLog không có sessionId

**File**: `seed/04-ai-quality-log.ts`

Toàn bộ 12 entries có `sessionId = null`. Analytics query join quality log với sessions trả về rỗng. Schema cho phép nullable nhưng seed data nên liên kết với sessions thực tế để có ý nghĩa.

**Fix**: Thay đổi signature `seedAiQualityLog(prisma, sessionIds)`. `seedSessions()` trả về `Record<string, string>` với ID của 7 sessions, được truyền xuống cho quality log. Gán entries vào đúng session theo `jobType`.

**Status**: Fixed ✓

**Implemented 2026-06-20**: Mỗi `seedSX` đổi return type sang `Promise<string>`, trả về `session.id` (hoặc `''` khi đã seeded). `seedSessions` trả về `Record<string, string>`. `seedAiQualityLog` nhận `sessionIds` param và map 12 entries qua `SESSION_MAP`. `index.ts` truyền `sessionIds` từ `seedSessions` xuống `seedAiQualityLog`.

---

## Issue 5 — LOW: audioFileUrl là fake domain

**File**: `seed/03-sessions.ts`, S6

`audioFileUrl: 'https://storage.example.com/seed/audio-s6-q1.webm'` — domain không tồn tại.

**Decision**: Giữ nguyên. Mục đích là demonstrate audio-mode metadata (duration, size, voiceMetrics). URL không bị fetch trong seed và allowlist check chỉ chạy ở API layer. Không có real audio file để dùng.

**Status**: Accepted as-is.

---

## Tiến độ thực hiện

**Cập nhật lần cuối**: 2026-06-20

### Tóm tắt

| Issue | Mức độ | Trạng thái |
|-------|--------|------------|
| Issue 1 — startIndex/endIndex sai | CRITICAL | Hoàn thành |
| Issue 2 — QuestionBank count guard | MEDIUM | Hoàn thành |
| Issue 3 — JD prefix + idempotency | MEDIUM | Hoàn thành |
| Issue 4 — AiQualityLog thiếu sessionId | MEDIUM | Hoàn thành |
| Issue 5 — audioFileUrl fake domain | LOW | Accepted as-is |

### Issue 1 — HOÀN THÀNH

**Thực hiện**: `segAt()` đã có sẵn trong `_helpers.ts` (được implement trước audit). Thay toàn bộ 20 hardcoded `{ segmentText, startIndex, endIndex }` literals trong `03-sessions.ts` bằng `segAt(answerText, segmentText, opts)`. Mỗi answer text được extract ra biến riêng (`a1Text`, `s2q1Text`, ...) để dùng làm argument cho cả `answerText:` và `segAt()`. Xóa `const a1` unused trong seedS1. Chạy `npm run format` + `npm run lint` — clean.

**Kết quả**: `03-sessions.ts` không còn hardcoded index nào. Mọi segment sẽ throw tại seed time nếu text không khớp, thay vì insert dữ liệu sai im lặng.

### Issue 2 — CHƯA LÀM

**File**: `seed/02-question-bank.ts`

**Việc cần làm**: Thay `const count = await prisma.questionBank.count(); if (count >= 90) return;` bằng:

```ts
const existing = await prisma.questionBank.findFirst({
  where: { content: QUESTIONS[0].content },
  select: { id: true },
});
if (existing) {
  console.log('question_bank: already seeded, skipping');
  return;
}
```

**Lý do**: `QuestionBank` không có unique constraint trên `content`, nên `skipDuplicates: true` trong `createMany` không có tác dụng. Count guard cũng không bảo vệ được nếu seed bị gián đoạn (< 90 rows). Existence check trên content của câu hỏi đầu tiên là idempotent thực sự.

### Issue 3 — CHƯA LÀM

**File**: `seed/03-sessions.ts`

**Việc cần làm** (3 phần):

1. **Xóa `[SEED-Sx]` prefix** khỏi tất cả 7 JD strings trong `JDS` object — thay bằng JD thực tế 3-4 câu với context công ty, tech stack cụ thể, mức lương.

2. **Thêm `planJson: { _seed: 'SEED-Sx' }` vào mỗi `interviewSession.create`** — dùng làm idempotency marker thay cho JD text.

3. **Đổi `alreadySeeded()`** từ `where: { userId, jobDescription: { contains: marker } }` sang `where: { userId, planJson: { path: ['_seed'], equals: marker } }`. Để giữ đơn giản, function giữ nguyên tên và signature — chỉ đổi query bên trong.

**Quyết định**: Không đổi `alreadySeeded` thành `getExistingSessionId` (từng plan) vì Issue 4 có thể giải quyết bằng cách khác (xem dưới). Giữ return type `boolean`.

### Issue 4 — CHƯA LÀM

**File**: `seed/04-ai-quality-log.ts`, `seed/index.ts`

**Việc cần làm**:

1. `seedSessions(prisma, userId)` trả về `Record<string, string>` — map `'s1' | 's2' | ... | 's7'` → session ID.

2. Mỗi `seedSX` function trả về `string` (session ID từ `prisma.interviewSession.create`) thay vì `void`. Với S5 (không create được vì status `generating` không có session trả về có ý nghĩa) — trả về ID bình thường.

3. `seedAiQualityLog(prisma, sessionIds: Record<string, string>)` — gán `sessionId` theo mapping:

| Entry | jobType | Session |
|-------|---------|---------|
| 0 | question-gen | s1 |
| 1 | question-gen | s3 |
| 2 | answer-feedback | s1 |
| 3 | answer-feedback | s3 |
| 4 | answer-feedback | s6 |
| 5 | answer-feedback (fallback) | s7 |
| 6 | session-summary | s1 |
| 7 | session-summary | s3 |
| 8 | follow-up-gen | s6 |
| 9 | question-gen (OPENAI_TIMEOUT) | s5 |
| 10 | opening-transcript | s6 |
| 11 | comm-analysis | s1 |

4. `index.ts`: `const sessionIds = await seedSessions(prisma, userId); await seedAiQualityLog(prisma, sessionIds);`

### Bước tiếp theo

1. Issue 2 — nhỏ, 5-10 dòng thay đổi trong `02-question-bank.ts`
2. Issue 3 — viết lại JDs + đổi idempotency query trong `03-sessions.ts`
3. Issue 4 — đổi return type `seedSessions`, cập nhật `04-ai-quality-log.ts` và `index.ts`
