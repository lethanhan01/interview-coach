# Luồng xử lý FeedbackProcessor — Phân tích chi tiết

Tài liệu này mô tả chính xác những gì xảy ra bên trong hệ thống từ khi người dùng submit một câu trả lời cho đến khi AI feedback được lưu vào database và thông báo về frontend.

Các file liên quan:

- `server/src/turn/turn.service.ts` — đẩy job vào hàng đợi
- `server/src/ai/processors/feedback.processor.ts` — worker xử lý job
- `server/src/ai/pipelines/base-pipeline.service.ts` — gọi AI và validate kết quả
- `server/src/ai/prompt-builder.service.ts` — xây dựng prompt
- `server/src/ai/openai.gateway.ts` — giao tiếp với OpenAI API
- `server/src/ai/pipelines/pipeline.schemas.ts` — Zod schema validate JSON từ AI
- `server/src/prisma/context-pack.data.ts` — rubric và cultural notes

---

## Phần 1: Job được tạo ra như thế nào

Khi người dùng submit câu trả lời text, `TurnService.submitAnswer()` (`turn.service.ts` dòng 262) đẩy một job vào BullMQ feedback queue:

```ts
await this.feedbackQueue.add(
  "feedback",
  {
    sessionId,
    turnId: answer.id,
    answerId: answer.id,
    questionText: question.questionText, // lấy từ DB, không phải từ client gửi lên
    answerText: answer.answerText,
    contextPack, // 'VN' | 'Western' — lấy từ session.contextPackId trong DB
    sessionType, // 'hr' | 'technical' | 'mixed' — lấy từ session trong DB
  },
  {
    jobId: `feedback-${answer.id}`, // BullMQ dedup — cùng answerId sẽ không tạo job trùng
    attempts: 2,
    backoff: { type: "fixed", delay: 2000 },
  },
);
```

Payload chỉ chứa những gì tối thiểu cần thiết. Worker sẽ tự load rubric và cultural notes từ bộ nhớ — không cần thêm gì từ phía client.

---

## Phần 2: FeedbackProcessor xử lý job

Class `FeedbackProcessor` (`feedback.processor.ts`) annotated bằng `@Processor(FEEDBACK_QUEUE)` — BullMQ tự gọi method `process(job)` mỗi khi có job mới trong queue.

### Bước 2.1 — Load context pack (không gọi database)

```ts
const contextPackConfig = this.contextPackService.getContextPack(contextPack);
```

`ContextPackService.getContextPack()` đọc từ object `CONTEXT_PACK_DATA` hardcoded trong bộ nhớ (`context-pack.data.ts`) — không query database. Trả về `ContextPackConfig` gồm:

**VN pack:**

- `culturalNotes`: `"Vietnamese workplace context: emphasize teamwork, respect for hierarchy, and practical problem-solving..."`
- `rubricDimensions`: 11 tiêu chí — 6 behavioral (Giao tiếp & Trình bày, Tư duy & Giải quyết vấn đề, Làm việc nhóm, Thái độ & Động lực, Phù hợp văn hóa, Tự nhận thức) + 5 technical (Kiến thức nền tảng, Khả năng áp dụng thực tế, Tư duy hệ thống, Code quality & Best practices, Debug & Problem-solving)
- `scoringWeights`: `{ behavioral_weight: 0.5, technical_weight: 0.5 }`

**Western pack:**

- `culturalNotes`: `"Western workplace context: emphasize initiative, quantifiable impact, and leadership potential. STAR format preferred."`
- `rubricDimensions`: 11 tiêu chí — 6 behavioral (Communication & Presentation, Critical Thinking, Collaboration & Teamwork, Leadership & Initiative, Culture Fit & Values, Self-Awareness & Growth) + 5 technical (tương tự VN nhưng tên tiếng Anh)
- `scoringWeights`: `{ behavioral_weight: 0.45, technical_weight: 0.55 }`

### Bước 2.2 — Chọn pipeline strategy theo loại phỏng vấn

```ts
const strategy = this.factory.getStrategy(sessionType);
// 'hr'        → HrPipelineService
// 'technical' → TechnicalPipelineService
// 'mixed'     → MixedPipelineService
```

Cả ba class đều extend `BasePipelineService`. Chúng chỉ khác nhau ở property `strategyInstructions` — một chuỗi mô tả phong cách đánh giá riêng cho từng loại phỏng vấn. Toàn bộ logic gọi AI và validate nằm trong `BasePipelineService.evaluateAnswer()`.

### Bước 2.3 — Xây dựng prompt theo 3 lớp

`BasePipelineService.evaluateAnswer()` (`base-pipeline.service.ts`) build system message theo 3 bước chồng lên nhau:

**Lớp 1 — Base prompt:**

```ts
const base = this.promptBuilder.buildBaseSystem("surgical-feedback");
```

Trả về chuỗi định nghĩa vai trò AI và yêu cầu output JSON chính xác:

```
You are an expert interview coach. Evaluate the candidate's answer and provide surgical, actionable feedback.

CRITICAL: model_answer must be a complete, concrete example answer of 3-5 sentences written as if a
strong candidate is actually speaking...

Return ONLY a valid JSON object with exactly this structure — no extra text, no markdown fences:
{
  "applied_dimensions": [
    { "id": "<dimension id exactly as listed in the system instructions>", "score": <integer 0-100> }
  ],
  "model_answer": "<complete 3-5 sentence example answer spoken as a candidate>",
  "key_takeaway": "<one concise insight about the answer quality>",
  "annotated_segments": [...]
}
```

**Lớp 2 — Strategy instructions:**

```ts
const withStrategy = this.applyStrategy(base, sessionType);
// Kết quả: base + "\n\nInterview strategy: <strategy instructions của hr/technical/mixed>"
```

**Lớp 3 — Context pack:**

```ts
const withPack = this.promptBuilder.applyContextPack(
  withStrategy,
  contextPackConfig,
);
// Kết quả: withStrategy
//   + "\n\nCultural context: Vietnamese workplace context: emphasize teamwork..."
//   + "\nScoring dimensions: Giao tiếp & Trình bày, Tư duy & Giải quyết vấn đề, ..."
```

### Bước 2.4 — Tạo mảng messages gửi cho AI

```ts
const messages = this.promptBuilder.injectDynamicContext({
  systemMessage: withPack,
  jobDescription: "", // cố ý để trống — JD chỉ dùng khi sinh câu hỏi
  sessionType,
  question: input.questionText,
  answer: input.answerText,
});
```

Kết quả là mảng 2 phần tử:

```ts
[
  {
    role: "system",
    content: "<toàn bộ system message 3 lớp đã build ở trên>",
  },
  {
    role: "user",
    content: `<job_description>
</job_description>

<session_type>hr</session_type>

<question>
Hãy mô tả một tình huống bạn phải làm việc dưới áp lực cao...
</question>

<answer>
Trong dự án cuối kỳ nhóm tôi gặp deadline gấp...
</answer>`,
  },
];
```

### Bước 2.5 — Gọi AI model

```ts
const raw = await this.openai.chatCompletion({
  messages,
  temperature: 0.2, // thấp — cần kết quả nhất quán, không sáng tạo
  maxTokens: 3000,
  responseFormat: "json_object",
  task: "feedback", // quyết định timeout sẽ dùng
});
```

Bên trong `OpenAIGateway.chatCompletion()` (`openai.gateway.ts`):

- Task `'feedback'` → dùng `feedbackTimeoutMs` (mặc định 180,000ms = 180 giây).
- Base URL mặc định: `http://127.0.0.1:1234/v1` (LM Studio local). Override bằng env `OPENAI_BASE_URL`.
- Model mặc định: `google/gemma-4-e4b`. Override bằng env `OPENAI_CHAT_MODEL`.
- Nếu `OPENAI_JSON_MODE=true` → thêm `response_format: { type: 'json_object' }` vào request OpenAI.
- Xử lý rate limit 429: tự retry 2 lần với delay 1s → 2s. Nếu vẫn fail → throw `AI_RATE_LIMIT`.
- Quota exhausted (lỗi `insufficient_quota`): không retry, set cooldown 60 giây, throw `AI_QUOTA_EXCEEDED`.
- `extractJsonContent()`: strip markdown fences ` ```json ... ``` ` nếu model trả về thay vì JSON thuần.

### Bước 2.6 — Parse và validate JSON từ AI

```ts
const parsed = JSON.parse(raw);
const validated = this.zodValidator.validate(FeedbackSchema, parsed);
```

`FeedbackSchema` (`pipeline.schemas.ts`) enforce chính xác:

```ts
FeedbackSchema = z.object({
  applied_dimensions: z.array(
    z.object({
      id: z.string(),
      score: z.number().int().min(0).max(100),
    }),
  ).min(1),
  model_answer: z.string(),
  key_takeaway: z.string(),
  annotated_segments: z.array(
    z.object({
      segment_text: z.string(), // đoạn text trích nguyên văn từ câu trả lời
      start_index: z.number().int(),
      end_index: z.number().int(),
      highlight_level: z.enum(["strength", "improvement"]),
      annotation: z.string(),
      suggestion: z.string().optional(),
      improved_version: z.string().optional(),
    }),
  ),
});
```

Nếu AI trả về JSON không khớp schema (thiếu field, sai type, score ngoài 0–100...) → Zod throw → job fail → BullMQ retry lần tiếp theo.

Trước khi gọi AI, backend resolve criteria hợp lệ của câu hỏi từ metadata và context pack. Metadata rỗng hoặc không còn criteria hợp lệ sẽ bị chặn bằng `SCHEMA_VALIDATION_ERROR`; criteria invalid bị bỏ trước khi đưa vào prompt. Sau khi validate output AI thành công, backend lọc `applied_dimensions` theo target criteria đã resolve, điền `score=0` cho criteria hợp lệ bị AI bỏ sót, rồi tự tính `overallScore`:

```ts
return {
  overallScore: weightedScoreFromResolvedDimensions,
  modelAnswer: validated.model_answer,
  keyTakeaway: validated.key_takeaway,
  promptVersion: "surgical-feedback-v1.1",
  appliedDimensions,
  annotatedSegments: validated.annotated_segments.map((s) => ({
    segmentText: s.segment_text,
    startIndex: s.start_index,
    endIndex: s.end_index,
    highlightLevel: s.highlight_level,
    annotation: s.annotation,
    suggestion: s.suggestion,
    improvedVersion: s.improved_version,
  })),
};
```

---

## Phần 3: Ghi kết quả vào database — 1 transaction, 3 lệnh

Toàn bộ ghi DB được wrap trong `$transaction` để đảm bảo atomic:

```ts
await this.prisma.$transaction(async (tx) => {
  // Lệnh 1: Upsert bảng AiFeedback
  // (update nếu đã có record cho answerId này, create nếu chưa)
  const aiFeedback = await tx.aiFeedback.upsert({
    where: { userAnswerId: answerId },
    create: {
      userAnswerId: answerId,
      overallScore: feedback.overallScore,
      modelAnswer: feedback.modelAnswer,
      keyTakeaway: feedback.keyTakeaway,
      promptVersion: "surgical-feedback-v1.1",
      isFallback: false,
    },
    update: {
      overallScore: feedback.overallScore,
      modelAnswer: feedback.modelAnswer,
      keyTakeaway: feedback.keyTakeaway,
      promptVersion: "surgical-feedback-v1.1",
      isFallback: false,
    },
  });

  // Lệnh 2: Xóa toàn bộ annotated segments cũ rồi insert lại
  // (clean replace — tránh tình trạng segment cũ và mới lẫn lộn nếu job retry)
  await tx.annotatedSegment.deleteMany({
    where: { aiFeedbackId: aiFeedback.id },
  });
  if (feedback.annotatedSegments.length > 0) {
    await tx.annotatedSegment.createMany({
      data: feedback.annotatedSegments.map((seg) => ({
        aiFeedbackId: aiFeedback.id,
        segmentText: seg.segmentText,
        startIndex: seg.startIndex,
        endIndex: seg.endIndex,
        highlightLevel: seg.highlightLevel, // 'strength' | 'improvement'
        annotation: seg.annotation,
        suggestion: seg.suggestion ?? null,
        improvedVersion: seg.improvedVersion ?? null,
      })),
    });
  }

  // Lệnh 3: Đánh dấu câu trả lời đã được xử lý feedback
  await tx.userAnswer.update({
    where: { id: answerId },
    data: { feedbackGenerated: true },
  });
});
```

Nếu bất kỳ lệnh nào trong transaction fail → rollback toàn bộ, `feedbackGenerated` vẫn là `false`, job sẽ retry.

---

## Phần 4: Thông báo về frontend qua SSE

```ts
await this.sseService.emit(
  `sse:session:${sessionId}`, // channel Redis Pub/Sub
  "turn.feedback_ready", // event name
  { answerId, hasAnnotations }, // hasAnnotations = annotatedSegments.length > 0
);
```

Backend publish lên Redis channel, SSE endpoint trên NestJS đang subscribe nhận được và đẩy về browser. Frontend nhận event này biết `answerId` nào vừa xong, và cờ `hasAnnotations` để quyết định có render highlight transcript không.

---

## Phần 5: Kiểm tra điều kiện tạo báo cáo tổng hợp

```ts
await this.reportService.enqueueIfAllFeedbacksReady(
  sessionId,
  sessionType,
  contextPack,
);
```

Hàm này query DB đếm số `UserAnswer` của session có `feedbackGenerated=true`. Nếu đủ tất cả các câu → tự động enqueue job `comprehensive-report`.

Đây là trigger tự động để tạo báo cáo: thay vì client phải gọi thêm API, hệ thống tự nhận ra khi câu trả lời cuối cùng được xử lý xong.

---

## Phần 6: Xử lý lỗi

Khi AI fail hoặc validate fail, `FeedbackProcessor` xử lý theo từng tình huống:

| Tình huống                                   | Hành vi                                                                                      |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Lần thử 1 fail, lỗi thông thường             | Throw — BullMQ tự retry sau 2 giây                                                           |
| Lần thử cuối (attempt 2) fail                | Vào fallback path                                                                            |
| Quota exhausted (bất kỳ lần nào)             | Vào fallback path ngay lập tức, không chờ hết attempts                                       |
| Đã có `AiFeedback` trong DB từ lần thử trước | Chỉ update `feedbackGenerated=true`, giữ nguyên dữ liệu cũ                                   |
| Chưa có `AiFeedback` nào                     | Tạo record `isFallback=true, overallScore=0, modelAnswer='', keyTakeaway=<fallback message>` |
| Cả fallback insert cũng fail                 | Throw — BullMQ đánh dấu job failed hẳn                                                       |

Dù thành công hay rơi vào fallback, hai việc này luôn được thực hiện:

- Emit SSE `turn.feedback_ready` để frontend không bị chờ mãi.
- Gọi `enqueueIfAllFeedbacksReady` để phiên không bị kẹt khi một câu trả lời gặp lỗi.

---

## Sơ đồ toàn luồng

```
TurnService.submitAnswer()
  └── feedbackQueue.add('feedback', payload)
        ↓ (BullMQ dequeue)
FeedbackProcessor.process(job)
  ├── ContextPackService.getContextPack(contextPack)
  │     └── đọc CONTEXT_PACK_DATA (in-memory, không gọi DB)
  │         → trả về rubricDimensions + culturalNotes + scoringWeights
  │
  ├── PipelineStrategyFactory.getStrategy(sessionType)
  │     └── trả về HrPipelineService | TechnicalPipelineService | MixedPipelineService
  │
  └── strategy.evaluateAnswer(input)   [BasePipelineService]
        │
        ├── PromptBuilderService.buildBaseSystem('surgical-feedback')
        │     └── lấy base prompt từ BASE_PROMPTS (hardcoded string)
        ├── applyStrategy(base, sessionType)
        │     └── nối thêm strategy instructions của hr/technical/mixed
        ├── applyContextPack(withStrategy, contextPackConfig)
        │     └── nối thêm culturalNotes + rubricDimensions
        ├── injectDynamicContext(...)
        │     └── tạo messages = [{ role: 'system', ... }, { role: 'user', ... }]
        │
        ├── OpenAIGateway.chatCompletion({ messages, temperature: 0.2, maxTokens: 3000 })
        │     ├── set timeout theo task='feedback' (mặc định 180 giây)
        │     ├── gọi chatClient.chat.completions.create(...)
        │     ├── xử lý rate limit 429: retry 1s → 2s (tối đa 2 lần)
        │     ├── xử lý quota exceeded: cooldown 60s, không retry
        │     └── extractJsonContent(): strip markdown fences nếu có
        │
        ├── JSON.parse(raw)
        └── ZodValidatorService.validate(FeedbackSchema, parsed)
              └── enforce: applied_dimensions score int 0-100, annotated_segments shape, ...

  ↓ (kết quả SurgicalFeedback)

prisma.$transaction([
  aiFeedback.upsert(overallScore, modelAnswer, keyTakeaway, isFallback=false)
  annotatedSegment.deleteMany()  +  annotatedSegment.createMany(segments[])
  userAnswer.update(feedbackGenerated=true)
])

  ↓

SseService.emit('turn.feedback_ready', { answerId, hasAnnotations })
  └── Redis Pub/Sub → SSE endpoint → EventSource trong browser

  ↓

reportService.enqueueIfAllFeedbacksReady(sessionId, ...)
  └── nếu tất cả UserAnswer có feedbackGenerated=true
      → enqueue job 'comprehensive-report'
```
