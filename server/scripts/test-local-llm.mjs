/**
 * Test script: gọi LM Studio với feedback request dài cho 1 câu trả lời phỏng vấn.
 * Usage: node scripts/test-local-llm.mjs [base_url] [model]
 *
 * Defaults:
 *   base_url = http://127.0.0.1:1234/v1
 *   model    = google/gemma-4-e4b (đọc từ OPENAI_CHAT_MODEL nếu set)
 */

const BASE_URL = process.argv[2] ?? process.env.OPENAI_BASE_URL ?? 'http://127.0.0.1:1234/v1';
const MODEL = process.argv[3] ?? process.env.OPENAI_CHAT_MODEL ?? 'google/gemma-4-e4b';
const TIMEOUT_MS = parseInt(process.env.OPENAI_FEEDBACK_TIMEOUT_MS ?? '300000', 10);

// --- Exact system prompt từ PromptBuilderService + TechnicalPipelineService + ContextPackService (VN) ---
// Replicates: buildBaseSystem('surgical-feedback') → applyStrategy('technical') → applyContextPack(VN)
const BASE_PROMPT = `You are an expert interview coach. Evaluate the candidate's answer and provide surgical, actionable feedback.

CRITICAL: model_answer must be a complete, concrete example answer of 3-5 sentences written as if a strong candidate is actually speaking. It must directly answer the question using specific details, demonstrate best practices, and read like a real spoken response — NOT a list of improvement tips, NOT meta-advice about what to say.

Return ONLY a valid JSON object with exactly this structure — no extra text, no markdown fences:
{
  "overall_score": <integer 1-100>,
  "model_answer": "<complete 3-5 sentence example answer spoken as a candidate>",
  "key_takeaway": "<one concise insight about the answer quality>",
  "annotated_segments": [
    {
      "segment_text": "<exact substring copied verbatim from the candidate answer>",
      "start_index": <integer: zero-based character offset where segment starts>,
      "end_index": <integer: zero-based character offset where segment ends>,
      "highlight_level": "strength",
      "annotation": "<why this is a strength>"
    },
    {
      "segment_text": "<exact substring copied verbatim from the candidate answer>",
      "start_index": <integer>,
      "end_index": <integer>,
      "highlight_level": "improvement",
      "annotation": "<what needs to improve>",
      "suggestion": "<specific rewording, optional>",
      "improved_version": "<rewritten segment, optional>"
    }
  ]
}`;

const STRATEGY_INSTRUCTIONS =
  'Focus on technical depth, applied problem-solving, trade-offs, debugging, system design, and engineering quality. Ask for reasoning and concrete implementation decisions.';

// rubricDimensions từ ContextPackService.getContextPack('VN') — behavioral + technical flattened
const RUBRIC_DIMENSIONS = [
  'Giao tiếp & Trình bày',
  'Tư duy & Giải quyết vấn đề',
  'Làm việc nhóm',
  'Thái độ & Động lực',
  'Phù hợp văn hóa',
  'Tự nhận thức',
  'Kiến thức nền tảng',
  'Khả năng áp dụng thực tế',
  'Tư duy hệ thống',
  'Code quality & Best practices',
  'Debug & Problem-solving',
];

const CULTURAL_NOTES =
  'Vietnamese workplace context: emphasize teamwork, respect for hierarchy, and practical problem-solving. Use Vietnamese cultural references when appropriate.';

const SYSTEM_PROMPT =
  BASE_PROMPT +
  `\n\nInterview strategy: ${STRATEGY_INSTRUCTIONS}` +
  `\n\nCultural context: ${CULTURAL_NOTES}\nScoring dimensions: ${RUBRIC_DIMENSIONS.join(', ')}.`;

// --- Sample JD, question, answer (tiếng Anh, realistic fresher scenario) ---
const JD = `
Job Title: Junior Frontend Developer
Company: TechVision Vietnam
Requirements:
- 0-12 months experience with React or Vue
- Understanding of HTML, CSS, JavaScript ES6+
- Experience with RESTful APIs and Git
- Ability to work in Agile teams
- Good communication and learning mindset
Responsibilities:
- Build and maintain UI components with React
- Collaborate with backend team on API integration
- Write clean, testable code with documentation
- Participate in code reviews and sprint ceremonies
`.trim();

const QUESTION = `Tell me about a time you faced a technical challenge during a project and how you solved it.`;

const ANSWER = `
In my final year project at university, I was building a task management web app using React and Node.js. About two weeks before the deadline, I ran into a major performance issue: the app was loading very slowly because I was fetching all tasks from the database at once — around 500 records — and rendering them all in the DOM at the same time. The page took about 8 seconds to load, which was completely unacceptable.

I searched online and found that the problem was related to not using pagination and rendering too many DOM elements simultaneously. I learned about virtual scrolling and implemented a simple pagination approach first, because it was faster to implement. I added a limit and offset parameter to the API, then updated the frontend to only fetch 20 items per page. This brought the load time down to under 1 second.

After the project, I also read about react-window for virtual lists, which I plan to use in future projects when the dataset is much larger. The experience taught me to think about data volume early in the design phase, not just at the end.
`.trim();

// --- Xây user message theo PromptBuilderService.injectDynamicContext ---
const USER_CONTENT =
  `<job_description>\n${JD}\n</job_description>` +
  `\n\n<session_type>technical</session_type>` +
  `\n\n<question>\n${QUESTION}\n</question>` +
  `\n\n<answer>\n${ANSWER}\n</answer>`;

const messages = [
  { role: 'system', content: SYSTEM_PROMPT },
  { role: 'user', content: USER_CONTENT },
];

function extractJson(raw) {
  const trimmed = raw.trim();
  try { JSON.parse(trimmed); return trimmed; } catch {}
  const blockMatch = /```(?:json)?\s*\n?([\s\S]*?)\n?```/.exec(trimmed);
  if (blockMatch) {
    const inner = blockMatch[1].trim();
    try { JSON.parse(inner); return inner; } catch {}
  }
  const objMatch = /(\{[\s\S]*\})/.exec(trimmed);
  if (objMatch) {
    try { JSON.parse(objMatch[1]); return objMatch[1]; } catch {}
  }
  return raw;
}

async function run() {
  console.log(`\n=== Test: Local LLM Feedback Request ===`);
  console.log(`  base_url : ${BASE_URL}`);
  console.log(`  model    : ${MODEL}`);
  console.log(`  timeout  : ${TIMEOUT_MS / 1000}s`);
  console.log(`  prompt tokens (estimate): ~${Math.round((SYSTEM_PROMPT.length + USER_CONTENT.length) / 4)} tokens`);
  console.log('');

  // Kiểm tra server còn sống không
  try {
    const healthRes = await fetch(`${BASE_URL}/models`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!healthRes.ok) {
      console.error(`[ERROR] GET ${BASE_URL}/models returned ${healthRes.status}`);
      process.exit(1);
    }
    const models = await healthRes.json();
    const loaded = models.data?.map((m) => m.id) ?? [];
    console.log(`[OK] LM Studio reachable. Loaded models: ${loaded.join(', ') || '(none)'}`);
    if (loaded.length > 0 && !loaded.includes(MODEL)) {
      console.warn(`[WARN] Model "${MODEL}" not in loaded list. Proceeding anyway.`);
    }
  } catch (err) {
    console.error(`[ERROR] Cannot reach LM Studio at ${BASE_URL}: ${err.message}`);
    console.error(`        Make sure LM Studio is running and the model is loaded.`);
    process.exit(1);
  }

  console.log(`\n[→] Sending feedback request...`);
  const start = Date.now();

  let raw;
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer lm-studio' },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const elapsed = Date.now() - start;

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[ERROR] HTTP ${res.status} after ${elapsed}ms:`);
      console.error(errBody.slice(0, 500));
      process.exit(1);
    }

    const data = await res.json();
    raw = data.choices?.[0]?.message?.content ?? '';

    console.log(`[OK] Response received in ${elapsed}ms`);
    console.log(`     finish_reason : ${data.choices?.[0]?.finish_reason ?? 'unknown'}`);
    if (data.usage) {
      console.log(`     tokens        : prompt=${data.usage.prompt_tokens} completion=${data.usage.completion_tokens} total=${data.usage.total_tokens}`);
    }
  } catch (err) {
    const elapsed = Date.now() - start;
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.error(`[ERROR] Request timed out after ${elapsed}ms (limit ${TIMEOUT_MS / 1000}s)`);
    } else {
      console.error(`[ERROR] Fetch failed after ${elapsed}ms: ${err.message}`);
    }
    process.exit(1);
  }

  console.log(`\n--- Raw response (first 600 chars) ---`);
  console.log(raw.slice(0, 600));
  if (raw.length > 600) console.log(`... (${raw.length} chars total)`);

  // Cố parse JSON
  const jsonStr = extractJson(raw);
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error(`\n[FAIL] JSON parse failed. Raw output is not valid JSON.`);
    console.error(`       Full raw:\n${raw}`);
    process.exit(1);
  }

  // Validate cấu trúc cơ bản — mirrors FeedbackSchema Zod rules exactly
  const issues = [];
  if (typeof parsed.overall_score !== 'number') {
    issues.push('overall_score missing or not a number');
  } else {
    if (!Number.isInteger(parsed.overall_score))
      issues.push(`overall_score must be integer, got: ${parsed.overall_score}`);
    if (parsed.overall_score < 1 || parsed.overall_score > 100)
      issues.push(`overall_score out of range [1-100]: ${parsed.overall_score}`);
  }
  if (typeof parsed.model_answer !== 'string' || parsed.model_answer.trim() === '') issues.push('model_answer missing or empty');
  if (typeof parsed.key_takeaway !== 'string') issues.push('key_takeaway missing');
  if (!Array.isArray(parsed.annotated_segments)) {
    issues.push('annotated_segments missing or not array');
  } else {
    for (const [i, seg] of parsed.annotated_segments.entries()) {
      if (typeof seg.segment_text !== 'string') issues.push(`segment[${i}].segment_text missing`);
      if (typeof seg.start_index !== 'number') {
        issues.push(`segment[${i}].start_index missing`);
      } else if (!Number.isInteger(seg.start_index)) {
        issues.push(`segment[${i}].start_index must be integer, got: ${seg.start_index}`);
      }
      if (typeof seg.end_index !== 'number') {
        issues.push(`segment[${i}].end_index missing`);
      } else if (!Number.isInteger(seg.end_index)) {
        issues.push(`segment[${i}].end_index must be integer, got: ${seg.end_index}`);
      }
      if (!['strength', 'improvement'].includes(seg.highlight_level))
        issues.push(`segment[${i}].highlight_level invalid: "${seg.highlight_level}" (must be "strength" or "improvement")`);
    }
  }

  if (issues.length > 0) {
    console.error(`\n[FAIL] Schema validation failed:`);
    issues.forEach((i) => console.error(`  - ${i}`));
    console.log(`\nParsed JSON:\n${JSON.stringify(parsed, null, 2)}`);
    process.exit(1);
  }

  // Tóm tắt kết quả
  console.log(`\n=== Result Summary ===`);
  console.log(`  overall_score      : ${parsed.overall_score}`);
  console.log(`  key_takeaway       : ${parsed.key_takeaway}`);
  console.log(`  model_answer       : ${parsed.model_answer.slice(0, 120)}...`);
  console.log(`  annotated_segments : ${parsed.annotated_segments.length} segments`);
  for (const [i, seg] of parsed.annotated_segments.entries()) {
    const textPreview = seg.segment_text.slice(0, 60).replace(/\n/g, ' ');
    console.log(`    [${i}] ${seg.highlight_level.padEnd(11)} [${seg.start_index}–${seg.end_index}] "${textPreview}..."`);
  }
  console.log(`\n[PASS] All checks passed.`);
}

run();
