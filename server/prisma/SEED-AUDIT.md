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

---

## Issue 2 — MEDIUM: QuestionBank idempotency guard count-based

**File**: `seed/02-question-bank.ts`

Guard hiện tại: `if (count >= 90) return`. Nếu bank có < 90 rows (seed bị gián đoạn), guard không skip và chạy `createMany` với `skipDuplicates: true`. Nhưng `QuestionBank` không có unique constraint trên `content`, nên `skipDuplicates` không có tác dụng — 90 rows mới được insert thêm, gây duplicate content.

**Fix**: Thay count guard bằng existence check trên content của câu hỏi đầu tiên.

**Status**: Fixed ✓

---

## Issue 3 — MEDIUM: JD strings có [SEED-Sx] prefix và nội dung quá ngắn

**File**: `seed/03-sessions.ts`

`[SEED-S1]`, `[SEED-S2]`, ... xuất hiện ở đầu JD string — hiển thị trong session list của demo user, trông như artifact hệ thống. JDs cũng quá ngắn (1-2 câu) so với JD thực tế.

**Fix**: Xóa prefix. Thay idempotency marker bằng `planJson: { _seed: 'SEED-Sx' }`. Viết lại JDs thực tế 3-4 câu với context công ty, stack cụ thể, mức lương.

**Status**: Fixed ✓

---

## Issue 4 — MEDIUM: AiQualityLog không có sessionId

**File**: `seed/04-ai-quality-log.ts`

Toàn bộ 12 entries có `sessionId = null`. Analytics query join quality log với sessions trả về rỗng. Schema cho phép nullable nhưng seed data nên liên kết với sessions thực tế để có ý nghĩa.

**Fix**: Thay đổi signature `seedAiQualityLog(prisma, sessionIds)`. `seedSessions()` trả về `Record<string, string>` với ID của 7 sessions, được truyền xuống cho quality log. Gán entries vào đúng session theo `jobType`.

**Status**: Fixed ✓

---

## Issue 5 — LOW: audioFileUrl là fake domain

**File**: `seed/03-sessions.ts`, S6

`audioFileUrl: 'https://storage.example.com/seed/audio-s6-q1.webm'` — domain không tồn tại.

**Decision**: Giữ nguyên. Mục đích là demonstrate audio-mode metadata (duration, size, voiceMetrics). URL không bị fetch trong seed và allowlist check chỉ chạy ở API layer. Không có real audio file để dùng.

**Status**: Accepted as-is.
