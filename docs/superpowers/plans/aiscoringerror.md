# Plan: Khắc phục lỗi AI scoring fallback với gemma-4-e4b

## Bối cảnh

Trong một phiên phỏng vấn HR (session `04fe8472-46c8-4486-9289-44fa191c4d65`), phần lớn câu
trả lời rơi vào fallback rỗng (`overallScore: 0`, `isFallback: true`) thay vì nhận đánh giá AI.
Log lặp lại `SCHEMA_VALIDATION_ERROR: "AI returned no valid scoring dimensions"`.

## Root cause (đã xác định, không phán đoán)

1. Log dán nhãn sai. Câu `throw` ở [base-pipeline.service.ts:147](../../../server/src/ai/pipelines/base-pipeline.service.ts)
   nằm bên trong khối `try`, nên `catch` ở dòng 184 bắt luôn exception tự ném và log nhầm
   thành `[feedback] Zod validation failed`. Thực tế **Zod đã pass**.
2. Lỗi thật ở [base-pipeline.service.ts:146-152](../../../server/src/ai/pipelines/base-pipeline.service.ts):
   sau khi lọc `applied_dimensions` theo tập id hợp lệ, `selected.length === 0`.
3. Phiên HR nên tập id hợp lệ chỉ là `behavioralDimensions` = `D1..D6`
   ([context-pack.data.ts:24-31](../../../server/src/prisma/context-pack.data.ts)).
4. `FeedbackSchema` chỉ kiểm `id` là string bất kỳ + `score` 1-100
   ([pipeline.schemas.ts:22-29](../../../server/src/ai/pipelines/pipeline.schemas.ts)) — không
   ràng buộc id phải thuộc `D1..D6`. Response pass Zod dù id sai.
5. Bước lọc `allowedById.get(d.id)` là so khớp chuỗi **chính xác**, không normalize. Model
   `google/gemma-4-e4b` (≈4B, phần cứng giới hạn không đổi model được) không bám đúng yêu cầu
   "dùng id chính xác" — trả về tên dimension, id bịa, hoặc biến thể → tất cả `.get()` trả `null`
   → `selected` rỗng → throw `SCHEMA_VALIDATION_ERROR`.
6. `SCHEMA_VALIDATION_ERROR` nằm trong `FALLBACK_ELIGIBLE_AI_ERRORS`
   ([ai-error.utils.ts:4-11](../../../server/src/ai/ai-error.utils.ts)) → FeedbackProcessor
   không retry, đi thẳng vào fallback ([feedback.processor.ts:142,154](../../../server/src/ai/processors/feedback.processor.ts)).

### Bằng chứng bất định của model nhỏ

Cùng prompt, cùng tập id, ~3/12 câu khớp id đúng (raw length 2500/2104/2326 — không có WARN
theo sau), ~9/12 thất bại. Đặc trưng model quá nhỏ không tuân thủ ổn định format id, không phải
bug logic cố định.

## Mục tiêu

Giảm tỷ lệ feedback rơi fallback rỗng với gemma-4-e4b, đồng thời sửa log gây nhầm. Không đổi
schema, không đổi luồng processor. Đạt mục tiêu này bằng hai cơ chế bổ trợ — matching id linh hoạt
và retry cho lỗi stochastic — chứ không chỉ matching.

Cảnh báo phạm vi: matching chỉ giải quyết **format** id sai, không giải quyết **semantic** sai.
Nếu gemma trả dimension hợp lệ nhưng sai bản chất (vd trả `D1` cho mọi câu), matcher vẫn khớp và
hệ thống vẫn chấm — điểm sẽ vô nghĩa mà không có dấu hiệu. Đây là tradeoff có chủ đích: tránh
fallback rỗng đổi lấy nguy cơ điểm sai. Mitigation: log khi entry khớp qua nhánh fuzzy (bước 4-5)
để theo dõi tỷ lệ.

## Phương pháp & thứ tự triển khai

Bằng chứng hiện có (raw length 2500/2104/2326) chỉ nói về độ dài response của 3 case **thành
công**, KHÔNG cho biết gemma trả id dạng gì trong 9 case **fail**. Không thiết kế matcher dựa trên
giả định về failure mode chưa quan sát. Trình tự bắt buộc:

1. **Phase A (ship trước, rủi ro thấp)**: Thay đổi 2 — sửa log dán nhãn sai + log `returnedIds`
   thực tế khi không khớp. Giá trị độc lập kể cả khi matcher chưa có.
2. **Phase B (thu dữ liệu)**: chạy 2-3 session HR, đọc log `returnedIds` để biết gemma thật sự
   trả id dạng gì.
3. **Phase C (matcher theo dữ liệu thật)**: Thay đổi 1 + 3 — cài các nhánh resolve khớp **đúng
   pattern quan sát được**, cắt nhánh không bao giờ xảy ra. Phần dưới mô tả tập nhánh ứng viên;
   chốt lại sau Phase B.
4. **Phase D (tùy chọn)**: Thay đổi 4 (siết prompt) + đánh giá retry (xem dưới).

## Phương án thay thế — retry (cân nhắc, không loại trừ)

Lỗi là stochastic: cùng prompt/input, ~3/12 ngẫu nhiên đúng. Với lỗi stochastic, retry là
mitigation rẻ và độc lập với matching. Hiện `SCHEMA_VALIDATION_ERROR` nằm trong
`FALLBACK_ELIGIBLE_AI_ERRORS` ([ai-error.utils.ts:4-11](../../../server/src/ai/ai-error.utils.ts))
nên [feedback.processor.ts:142](../../../server/src/ai/processors/feedback.processor.ts) **không
retry** mà đi thẳng fallback.

Hai lựa chọn (quyết ở Phase D sau khi đo hiệu quả matcher):

- Giữ nguyên (chỉ matching) nếu matcher đã đẩy tỷ lệ fallback xuống đủ thấp.
- Cho retry case "no dimensions matched": tách error code riêng (vd `AI_DIMENSION_MATCH_FAILED`)
  KHÔNG nằm trong fallback-eligible → đi nhánh retry ([feedback.processor.ts:142](../../../server/src/ai/processors/feedback.processor.ts),
  `attempts: 2`) → 2 lần thử độc lập, mỗi lần ~25% đúng. Chi phí: +1 lần gọi LLM (queue 15s) mỗi
  câu fail. Lựa chọn này ĐỔI error code — nằm ngoài ràng buộc ban đầu, chỉ làm nếu matching một
  mình không đủ.

## Thay đổi 1 — Pure function resolver matching (file mới) — Phase C

File mới: `server/src/ai/pipelines/dimension-matcher.ts`

Export `resolveAppliedDimensions(applied, allowedDims)` trả mảng `{ id, name, baseWeight, score }`
đã khớp + dedupe. **Không bao giờ throw** — entry không khớp thì bỏ qua, mảng rỗng là kết quả hợp
lệ (service quyết định throw, xem Thay đổi 2). Lý do: matcher là code thuần dễ có bug; nếu nó throw
`Error` thường (không phải `InterviewAIException`), `isAIFallbackEligible` trả false →
[feedback.processor.ts](../../../server/src/ai/processors/feedback.processor.ts) đi nhánh
`logger.error` "failed after N attempts" thay vì fallback. Giữ matcher total để tránh nhánh này.

Hàm `normalizeKey` xử lý tiếng Việt:

```ts
// strip dấu tiếng Việt (U+0300–U+036F), đ→d, lowercase, bỏ ký tự không phải [a-z0-9]
// Dùng escape \u thay vì ký tự combining-mark literal để không hỏng khi encoding/editor đụng vào.
normalizeKey(s) = s.normalize('NFD').replace(/[̀-ͯ]/g, '')
                   .replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '')
```

(`đ`/`Đ` không decompose qua NFD nên cần `.replace(/đ/gi, 'd')` riêng — `i` flag bắt cả `Đ`.)

Tập nhánh resolve ứng viên cho mỗi `{ id, score }` (schema chỉ có `id`+`score`, nên `id` có thể
chứa id thật, tên, hoặc "id + tên"). **Chốt danh sách nhánh thực cài sau Phase B** — cắt nhánh nào
dữ liệu thật chứng minh không bao giờ xảy ra:

1. Khớp `id` chính xác (hành vi hiện tại — giữ nguyên cho case đã chạy đúng).
2. Khớp id sau normalize (bắt `d1`, ` D1 `, `D-1` qua bước strip non-alnum).
3. Trích regex code `/\bT?D\s*\d+\b/i` bất kỳ đâu trong chuỗi → normalize token khớp (bắt
   `"D1: Giao tiếp"`, `"D1 Communication"`). Trong mixed pack, `T?D` ưu tiên ăn `T` nên `TD1`
   không nhầm thành `D1`.
4. Khớp `name` sau normalize (bắt khi gemma trả nguyên tên thay vì id).
5. Fallback substring 2 chiều giữa normalize(raw) và normalize(name), chỉ khi name normalize
   ≥ 4 ký tự (giảm false positive). Khi khớp qua nhánh này → `logger.debug` để theo dõi tần suất
   fuzzy-match (xem cảnh báo quality ở Mục tiêu).
6. Không khớp → bỏ qua entry đó (KHÔNG throw).

Lý do tách file: pure function dễ unit test độc lập (TDD), không phụ thuộc Nest DI.

### Dedupe — tách riêng, là behavior change thật (không phải "trung tính")

Sau resolve: dedupe theo `id`, giữ entry đầu tiên. Đây KHÔNG phải thay đổi trung tính: nếu một
trong 3 case đang chạy đúng có gemma trả trùng id, code hiện tại đếm trùng → chuẩn hóa weight lệch
→ `overallScore` hiện tại sẽ KHÁC sau dedupe. Vì vậy dedupe cần test riêng chứng minh chênh lệch
là đúng ý (vá lỗi đếm trùng), không gộp vào tuyên bố "superset của exact-match".

## Thay đổi 2 — Refactor `evaluateAnswer` + sửa log — Phase A (ship trước)

File: [base-pipeline.service.ts:118-189](../../../server/src/ai/pipelines/base-pipeline.service.ts)

Phase A ship phần sửa log + `returnedIds` **trước**, dùng matching inline hiện tại (`allowedById.get`).
Khi matcher (Thay đổi 1) sẵn sàng ở Phase C, thay dòng dựng `selected` bằng
`resolveAppliedDimensions(...)`. Phần tách `try` và log dưới đây áp dụng cho cả hai phase.

Tách khối `try` để chỉ Zod validate nằm trong đó:

```ts
let validated;
try {
  validated = this.zodValidator.validate(FeedbackSchema, parsed);
} catch (err) {
  this.logger.warn(`[feedback] Zod validation failed. rawLength=${raw.length}`, err);
  throw err;
}

const allowedDims = /* chọn theo sessionType — giữ nguyên logic dòng 121-129 */;
const selected = resolveAppliedDimensions(validated.applied_dimensions, allowedDims);

if (selected.length === 0) {
  this.logger.warn(
    `[feedback] No scoring dimensions matched after normalization. ` +
    `returnedIds=${JSON.stringify(validated.applied_dimensions.map(d => d.id))} ` +
    `allowedIds=${JSON.stringify(allowedDims.map(d => d.id))} rawLength=${raw.length}`,
  );
  throw new InterviewAIException(
    ErrorCode.SCHEMA_VALIDATION_ERROR, HttpStatus.UNPROCESSABLE_ENTITY,
    'AI returned no valid scoring dimensions',
  );
}
// baseSum, appliedDimensions, overallScore — giữ nguyên dòng 154-182
```

Kết quả:

- Log "Zod validation failed" chỉ còn xuất hiện khi Zod thật sự fail.
- Trường hợp không khớp dimension log đúng bản chất, kèm `returnedIds` thực tế — lần chạy sau
  thấy chính xác gemma trả id dạng gì, phục vụ tinh chỉnh tiếp.
- Bỏ block `try/catch` bao trùm cũ (dòng 118, 183-189).

## Thay đổi 3 — Tests (TDD: viết test đỏ trước) — Phase C

File mới: `server/src/ai/pipelines/dimension-matcher.spec.ts` — test matcher với **dimension data
thật** (import `CONTEXT_PACK_DATA` / dựng `RubricDimensionEntry[]` từ pack VN), phủ:

- exact id (`D1`), id lowercase (`d1`), id có dấu cách/dấu gạch (`D-1`, ` D1 `).
- `"D1: Giao tiếp & Trình bày"` → D1 (regex code).
- nguyên tên có dấu `"Giao tiếp & Trình bày"` → D1 (name normalize).
- tên tiếng Anh khi pack VN: khớp được qua substring hoặc xác nhận trả `[]` khi không khớp.
- id bịa `"communication"` không thuộc danh sách → bỏ qua (không có trong kết quả).
- dedupe khi trùng id (test riêng, kiểm cả score giữ entry đầu).
- HR pack: `TD1` → bỏ qua (không thuộc tập behavioral).
- Mixed pack: `TD1` → resolve đúng TD1 (positive case, đảm bảo `T?D` không nuốt nhầm).
- matcher KHÔNG throw với input rác (mảng id toàn không khớp) → trả `[]`.

File sửa: `server/src/ai/pipelines/base-pipeline.service.spec.ts`. Lưu ý: mock pack trong spec này
dùng tên English (`Communication`/`Teamwork` cho D1/D2, [base-pipeline.service.spec.ts:232-233](../../../server/src/ai/pipelines/base-pipeline.service.spec.ts)),
KHÁC tên VN thật. Các test ở spec này phải dùng tên khớp mock — không trộn tên VN vào đây (test
tên VN thuộc về `dimension-matcher.spec.ts`).

- Test cũ (dòng 214, 238, 259, 368) phải tiếp tục xanh — đã verify logic mới không phá:
  `ZZ`→bỏ qua → `selected` rỗng vẫn throw; `TD1` với HR vẫn bị loại; Zod throw vẫn log
  "Zod validation failed".
- Thêm: gemma trả `[{id:'d1',score:80},{id:'Teamwork',score:60}]` → resolve ra D1+D2 (khớp tên
  mock English).
- Thêm: không khớp → log chứa `returnedIds=` và `No scoring dimensions matched`.

## Thay đổi 4 (tùy chọn) — Siết prompt cho gemma — Phase D

File: [prompt-builder.service.ts:91-95](../../../server/src/ai/prompt-builder.service.ts) — thêm
ví dụ cụ thể format id vào `selectionRules`, nhấn mạnh "copy the code token exactly, e.g. D1, D3
— do not translate or rename". Giảm lỗi tại nguồn, bổ trợ matching. Nếu sửa prompt, bump
`PROMPT_VERSION` → `surgical-feedback-v1.5` ([pipeline.schemas.ts:3](../../../server/src/ai/pipelines/pipeline.schemas.ts)).
Test [base-pipeline.service.spec.ts:235](../../../server/src/ai/pipelines/base-pipeline.service.spec.ts)
import const nên tự theo. Khi bump version phải sửa `server/src/ai/CLAUDE.md` ở **2 chỗ** hardcode
`surgical-feedback-v1.4` (mục Per-question Scoring + dòng "Prompt version hiện tại").

Tách bước này để quyết riêng vì nó đổi prompt version (ảnh hưởng tracking); Thay đổi 1-3 là phần
logic cốt lõi.

## Đánh giá rủi ro

| Rủi ro | Mức | Giảm thiểu |
|--------|-----|-----------|
| Thiết kế matcher cho failure mode chưa quan sát | Trung bình | Phase A thu `returnedIds` thật trước; chốt nhánh resolve sau Phase B |
| Matching đúng format nhưng sai semantic → điểm vô nghĩa | Trung bình | Ngoài tầm sửa của plan (model 4B); `logger.debug` khi khớp fuzzy để theo dõi |
| Substring fallback khớp nhầm dimension | Thấp | Yêu cầu name ≥ 4 ký tự; tập chỉ 5-6 dim tên phân biệt rõ; ưu tiên id/code trước name |
| Phá test cũ | Thấp | Đã đối chiếu từng test; nhánh exact-match giữ nguyên là bước 1 |
| Đổi hành vi case có trùng id | Có (chấp nhận) | Dedupe đổi `overallScore` nếu case đó từng trùng id; có test riêng chứng minh hướng đổi đúng |
| Matcher throw runtime error → vào nhánh error thay vì fallback | Thấp | Matcher total (trả `[]`, không throw); service quyết throw `InterviewAIException` |

## Phạm vi file

- Phase A: sửa `base-pipeline.service.ts` (tách try + log), `base-pipeline.service.spec.ts` (test log).
- Phase C: mới `dimension-matcher.ts`, `dimension-matcher.spec.ts`; sửa `base-pipeline.service.ts`
  (gọi matcher) + `base-pipeline.service.spec.ts`.
- Phase D tùy chọn: `prompt-builder.service.ts` + `pipeline.schemas.ts` (bump version); nếu chọn
  retry: `error-code.enum.ts` (thêm `AI_DIMENSION_MATCH_FAILED`) + `ai-error.utils.ts` (KHÔNG thêm
  vào `FALLBACK_ELIGIBLE_AI_ERRORS`) + `base-pipeline.service.ts` (throw code mới).
- Cập nhật `server/src/ai/CLAUDE.md` (mục Per-question Scoring: ghi rõ matching có normalize;
  2 chỗ PROMPT_VERSION nếu bump) + `CHANGELOG.md` theo rule sync.

## Skills & Subagents

- `superpowers:test-driven-development` — viết test đỏ cho dimension-matcher trước khi implement.
- `feature-dev:feature-dev` — khi sửa logic service backend.
- `superpowers:verification-before-completion` + chạy `npm run test` + `npm run lint` trước khi
  báo done.

## Trạng thái

Phase A (ship trước):
- [ ] Thay đổi 2 — sửa log dán nhãn sai + log `returnedIds` (matching inline hiện tại)
- [ ] Verify + deploy

Phase B (thu dữ liệu):
- [ ] Chạy 2-3 session HR, đọc log `returnedIds` → chốt tập nhánh resolve thực cần

Phase C (matcher theo dữ liệu thật):
- [ ] Thay đổi 3 — viết test đỏ (dimension-matcher.spec + base-pipeline.service.spec)
- [ ] Thay đổi 1 — dimension-matcher.ts (total, không throw) + dedupe có test riêng
- [ ] Thay base dòng dựng `selected` sang `resolveAppliedDimensions`

Phase D (tùy chọn):
- [ ] Đánh giá hiệu quả matcher → quyết định retry (tách error code) hay giữ nguyên
- [ ] Thay đổi 4 — siết prompt + bump PROMPT_VERSION (sửa ai/CLAUDE.md 2 chỗ)

Chung:
- [ ] Cập nhật CLAUDE.md + CHANGELOG.md
- [ ] Verify: npm run test + npm run lint
