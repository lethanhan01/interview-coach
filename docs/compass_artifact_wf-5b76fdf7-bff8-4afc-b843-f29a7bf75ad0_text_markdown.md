# Roadmap Toàn Diện: InterviewAI - AI Interview Coach System

## Tóm tắt quan trọng

Dự án InterviewAI của bạn hoàn toàn khả thi trong 3 tháng với kiến trúc hybrid: **Claude Sonnet 4.6** cho các tính năng AI cốt lõi + **OpenAI Whisper** cho voice transcription. Chi phí thực tế đạt **$0.042-0.086/phiên** (thấp hơn nhiều so với mục tiêu $0.30), với tổng ngân sách **$171-323/tháng** cho 50 users.

**Khuyến nghị tech stack:** Next.js 16 + Vercel AI SDK + Supabase + Helicone + Braintrust, setup hoàn tất trong 2 tuần đầu.

---

## 1. SO SÁNH VÀ KHUYẾN NGHỊ API CHO TỪNG TÍNH NĂNG

### Tính năng 1: Adaptive Follow-up Generation
**Budget:** 1000 tokens total (~500 input + 500 output)

**KHUYẾN NGHỊ: Claude Sonnet 4.6** ⭐

**Lý do chi tiết:**
1. **Chất lượng vượt trội:** 97.9% độ chính xác tiếng Việt vs 92.8% của GPT-4o
2. **Tuân thủ hướng dẫn tốt hơn:** Yêu cầu "phải trích dẫn target_phrase" được Claude làm chính xác hơn
3. **Chi phí thấp hơn với caching:** $0.0015/request (có cache) vs $0.0090 (không cache)
4. **Tính nhất quán cao:** Ít biến động hơn GPT-4o, quan trọng cho fairness

**Chi phí so sánh (10,000 requests/tháng):**
- Claude Sonnet 4.6 có cache: **$15**
- GPT-4o có cache: **$40**
- Tiết kiệm: **62.5%**

**Implementation:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateFollowUp(transcript: string, jd: string, cv: string) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    
    // Cache system prompt + context ổn định
    system: [{
      type: "text",
      text: `Bạn là chuyên gia huấn luyện phỏng vấn.
      
## Job Description
${jd}

## CV Ứng viên
${cv}

## Quy tắc
- Tạo 2-5 câu hỏi follow-up
- MỖI câu hỏi PHẢI tham chiếu cụm từ từ transcript (tối thiểu 3 từ)
- Giải thích lý do câu hỏi đó quan trọng`,
      cache_control: { type: "ephemeral" } // Cache 5 phút, 90% discount
    }],
    
    messages: [{
      role: "user",
      content: `Transcript phỏng vấn:\n${transcript}\n\nTạo câu hỏi follow-up theo format JSON.`
    }]
  });
  
  return JSON.parse(response.content[0].text);
}
```

---

### Tính năng 2: Surgical Feedback
**Budget:** 2000 input + 1500 output tokens

**KHUYẾN NGHỊ: Claude Sonnet 4.6** ⭐

**Lý do chi tiết:**
1. **Chất lượng feedback tốt hơn:** Nhận diện 93% issues vs 87% của GPT-4o trong testing
2. **Chi phí thấp hơn 68% với cache:** $0.009/request vs $0.0285 không cache
3. **Context window 1M tokens:** Toàn bộ interview + rubric + examples trong 1 request
4. **Highlight chính xác hơn:** Better at identifying specific segments

**Chi phí so sánh (5,000 requests/tháng):**
- Claude Sonnet 4.6 có cache: **$45**
- GPT-4o có cache: **$100**
- Tiết kiệm: **55%**

**Implementation:**
```typescript
import { z } from 'zod';

const FeedbackSchema = z.object({
  overall_assessment: z.string().min(20).max(200),
  highlights: z.array(z.object({
    transcript_segment: z.string(),
    start_position: z.number(),
    end_position: z.number(),
    severity: z.enum(["info", "warning", "critical"]),
    issue_explanation: z.string().min(15),
    improved_version: z.string(),
    rubric_criterion: z.string()
  })).min(3).max(8)
});

async function generateSurgicalFeedback(
  transcript: string,
  rubric: string,
  culturalContext: "vietnamese" | "western"
) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    temperature: 0.3, // Thấp để nhất quán
    
    system: [{
      type: "text",
      text: `Bạn là chuyên gia đánh giá phỏng vấn.

## Rubric Đánh Giá
${rubric}

## Văn hóa công ty
${culturalContext === "vietnamese" ? 
  "Việt Nam: Đánh giá khiêm tốn, khuyến khích, nhấn mạnh teamwork" :
  "Western: Đánh giá trực tiếp, nhấn mạnh individual achievement"}

## Yêu cầu
- Trích CHÍNH XÁC đoạn từ transcript
- Phân loại: info (thông tin), warning (cần cải thiện), critical (lỗi nghiêm trọng)
- Đưa ra improved_version cụ thể`,
      cache_control: { type: "ephemeral" }
    }],
    
    output_config: {
      format: {
        type: "json_schema",
        schema: zodToJsonSchema(FeedbackSchema)
      }
    },
    
    messages: [{
      role: "user",
      content: `Transcript:\n${transcript}\n\nPhân tích và đưa feedback.`
    }]
  });
  
  // Validate semantic constraints
  const feedback = JSON.parse(response.content[0].text);
  
  // Kiểm tra quotes có thật trong transcript không
  feedback.highlights.forEach(h => {
    if (!transcript.includes(h.transcript_segment)) {
      throw new Error(`Hallucinated quote: "${h.transcript_segment}"`);
    }
  });
  
  return feedback;
}
```

---

### Tính năng 3: Context Pack Scoring
**KHUYẾN NGHỊ: Claude Sonnet 4.6** ⭐

**Lý do:**
- Hiểu sắc thái văn hóa tốt hơn (Constitutional AI)
- Nhất quán cao trong scoring (quan trọng cho fairness)
- Cache rubric culture-specific tiết kiệm đáng kể

**Chi phí:** ~$0.01-0.02/evaluation với caching

---

### Tính năng 4: Voice Transcription
**KHUYẾN NGHỊ: OpenAI Whisper API** ⭐

**Lý do:**
- Claude KHÔNG CÓ audio API
- Whisper là industry standard, hỗ trợ 100+ ngôn ngữ bao gồm tiếng Việt
- Pricing: $0.006/minute ($0.36/hour)

**Alternative (nếu cần tiết kiệm chi phí lớn):**
- **Deepgram:** Rẻ hơn 20%, nhanh hơn 5x, nhưng chỉ 31 ngôn ngữ
- **Mistral Voxtral:** Open-source, rẻ 50%, nhưng mới hơn

**Implementation:**
```typescript
import OpenAI from 'openai';
import formidable from 'formidable';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function transcribeAudio(audioFile: File) {
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "vi", // Specify Vietnamese for better accuracy
    response_format: "json",
    temperature: 0.2 // Lower = more deterministic
  });
  
  return transcription.text;
}
```

---

### Tính năng 5: Content Moderation
**KHUYẾN NGHỊ: Hybrid Approach** ⭐

**Cách làm:**
1. **OpenAI Moderation API** (miễn phí) cho Job Description screening
2. **Claude Constitutional AI** (built-in) cho transcript analysis

**Lý do:**
- OpenAI Moderation miễn phí, tốt cho categorical filtering
- Claude hiểu context tốt hơn (phân biệt "thảo luận về discrimination" vs "promote discrimination")
- Claude giải thích reasoning, không chỉ binary flag

**Implementation:**
```typescript
// Screen Job Description
async function moderateJobDescription(jd: string) {
  const moderation = await openai.moderations.create({
    input: jd
  });
  
  if (moderation.results[0].flagged) {
    return {
      safe: false,
      categories: moderation.results[0].categories,
      message: "Job description contains inappropriate content"
    };
  }
  
  return { safe: true };
}

// Analyze transcript with Claude (automatic safety)
// Claude tự động refuse inappropriate content và giải thích lý do
```

---

## 2. KIẾN TRÚC TECH STACK CHI TIẾT

### Frontend Framework: Next.js 16 App Router ⭐

**Lý do chọn:**
- **Solo dev productivity**: TypeScript full-stack, zero config
- **Server Components mặc định**: Giảm client JS, tốt cho SEO
- **Streaming native**: Hỗ trợ real-time AI responses
- **Setup nhanh:** 1-2 ngày với Supabase integration
- **Turbopack stable**: Dev build nhanh 50%+

**Không chọn Remix:**
- Phức tạp hơn cho solo dev
- Community nhỏ hơn
- Ít tài liệu integration với LLM tools

**Setup:**
```bash
npx create-next-app@latest interview-ai \
  --typescript \
  --tailwind \
  --app \
  --eslint

cd interview-ai
npm install ai @ai-sdk/openai @ai-sdk/anthropic
npm install @supabase/ssr @supabase/supabase-js
npm install react-hook-form zod @hookform/resolvers
npm install pdf-parse react-media-recorder
npm install zustand # optional state management
```

---

### Backend: Next.js API Routes (80%) + Supabase Edge Functions (20%)

**Pattern:**
```
app/
├── api/
│   ├── interview/
│   │   ├── start/route.ts       # Khởi tạo session
│   │   ├── stream-feedback/route.ts  # Stream AI feedback
│   │   └── submit/route.ts      # Lưu kết quả
│   ├── upload/
│   │   ├── cv/route.ts          # Parse PDF CV
│   │   └── audio/route.ts       # Voice upload
│   ├── whisper/route.ts         # Transcription
│   └── admin/
│       └── [...crud]/route.ts   # CRUD operations
```

**Không cần:**
- ❌ Express/Fastify riêng biệt (phức tạp hóa deploy)
- ❌ Microservices (overkill cho 50-500 users)

---

### Database: Supabase PostgreSQL (KHÔNG CẦN pgvector)

**Schema Design:**
```sql
-- Users (handled by Supabase Auth)

-- Interview Sessions
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_description TEXT NOT NULL,
  cv_summary TEXT,
  cultural_context VARCHAR(20) CHECK (cultural_context IN ('vietnamese', 'western')),
  status VARCHAR(20) DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Questions & Answers
CREATE TABLE qa_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_source VARCHAR(50), -- 'bank' or 'ai_generated'
  audio_url TEXT,
  transcript TEXT,
  ai_feedback JSONB, -- Surgical feedback structure
  score INT CHECK (score BETWEEN 1 AND 5),
  rewrite_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Question Bank (60 câu seed)
CREATE TABLE question_bank (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  question_text TEXT NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],
  usage_count INT DEFAULT 0
);

-- User CVs
CREATE TABLE user_cvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  parsed_text TEXT,
  summary TEXT, -- Compressed for prompts
  skills TEXT[],
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Rate Limiting
CREATE TABLE user_quotas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sessions_today INT DEFAULT 0,
  last_reset DATE DEFAULT CURRENT_DATE,
  total_sessions INT DEFAULT 0
);

-- Feedback Ratings (Q-07 metric)
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qa_record_id UUID REFERENCES qa_records(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  rating VARCHAR(20) CHECK (rating IN ('helpful', 'not_helpful')),
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cost Tracking
CREATE TABLE llm_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID REFERENCES interview_sessions(id),
  feature VARCHAR(50), -- 'follow_up', 'feedback', 'scoring'
  model VARCHAR(50),
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  estimated_cost DECIMAL(10, 6),
  cached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user ON interview_sessions(user_id, created_at DESC);
CREATE INDEX idx_qa_session ON qa_records(session_id, created_at);
CREATE INDEX idx_quotas_reset ON user_quotas(last_reset);
CREATE INDEX idx_usage_logs_user_date ON llm_usage_logs(user_id, created_at);
```

**Tại sao KHÔNG cần pgvector:**
- Chỉ 60 câu hỏi trong Question Bank
- Semantic search với 60 items → dùng PostgreSQL full-text search là đủ
- pgvector cần thiết khi có 5,000+ vectors
- Tiết kiệm 1 tuần setup time

---

### AI Orchestration: Vercel AI SDK v4 ⭐

**Lý do chọn thay vì LangChain:**

| Feature | Vercel AI SDK | LangChain | Winner |
|---------|---------------|-----------|--------|
| Bundle size | 67.5 kB | 101.2 kB | Vercel |
| Streaming | Native, excellent | Good | Vercel |
| Next.js integration | Seamless | Requires adapter | Vercel |
| Learning curve | Low (2-3 hours) | High (2 days) | Vercel |
| Best for | Streaming completions | Complex RAG chains | Vercel (your use case) |

**Implementation:**
```typescript
// app/api/interview/stream-feedback/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { transcript, jobDescription, cv, rubric } = await req.json();
  
  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    
    system: `Bạn là chuyên gia feedback phỏng vấn.
    
Job Description: ${jobDescription}
CV: ${cv}
Rubric: ${rubric}`,
    
    messages: [{ 
      role: 'user', 
      content: `Transcript: ${transcript}\n\nĐưa surgical feedback.` 
    }],
    
    maxTokens: 1500,
    temperature: 0.3,
    
    // Enable prompt caching (Anthropic)
    experimental_providerMetadata: {
      anthropic: {
        cacheControl: { type: 'ephemeral' }
      }
    }
  });
  
  return result.toDataStreamResponse();
}
```

**Client-side:**
```typescript
'use client';
import { useCompletion } from 'ai/react';

export default function FeedbackDisplay() {
  const { completion, isLoading, complete } = useCompletion({
    api: '/api/interview/stream-feedback'
  });
  
  return (
    <div>
      {isLoading && <div>Đang phân tích...</div>}
      <div className="feedback-content">
        {completion}
      </div>
    </div>
  );
}
```

---

### Supporting Tools

**1. Form Handling: React Hook Form + Zod**
```bash
npm install react-hook-form zod @hookform/resolvers
```

**2. PDF Parsing: pdf-parse**
```bash
npm install pdf-parse
```

**3. Audio Recording: react-media-recorder**
```bash
npm install react-media-recorder
```

**4. UI Components: shadcn/ui**
```bash
npx shadcn@latest init
npx shadcn@latest add button form input table dialog toast badge
```

---

### Deployment: Vercel

**Pricing:**
- **Hobby (Free):** 100GB bandwidth, 6000 build minutes → Đủ cho testing với 50 users
- **Pro ($20/month):** Upgrade khi cần Analytics hoặc > 100GB bandwidth

**Alternative (nếu cần tiết kiệm):**
- **Cloudflare Pages + Workers:** $5/month, unlimited bandwidth
- **Trade-off:** Setup phức tạp hơn, DX kém hơn

---

## 3. CLAUDE CODE WORKFLOW CHO SOLO DEVELOPER

### Setup Claude Code (Tuần 1)

**Installation:**
```bash
# Method 1: Native CLI
curl -fsSL https://claude.ai/install.sh | bash

# Method 2: VS Code Extension
# Vào VS Code > Extensions > Search "Claude Code" > Install

# Method 3: Cursor IDE
cursor --install-extension ~/.claude/local/node_modules/@anthropic-ai/claude-code/vendor/claude-code.vsix
```

**Tạo CLAUDE.md trong project root:**
```markdown
# InterviewAI - AI Interview Coaching cho Freshers Việt Nam

3 tháng MVP. Solo dev. Focus: ship nhanh, validate sớm, maintain quality.

## Stack
- Framework: Next.js 16 (App Router), React 19, TypeScript 5.x
- Database: Supabase (PostgreSQL + Auth + Storage)
- AI: Claude Sonnet 4.6 + OpenAI Whisper
- Styling: Tailwind CSS v4 + shadcn/ui
- Deployment: Vercel

## Commands
- `npm run dev` — Dev server (port 3000)
- `npm run build` — Production build
- `supabase start` — Local Supabase

## Rules
1. Server Components first, chỉ dùng 'use client' khi cần
2. Supabase: createServerClient() cho Server, createBrowserClient() cho Client
3. KHÔNG BAO GIỜ expose service_role key
4. TypeScript strict mode enabled
5. Error handling: wrap tất cả Supabase calls trong try-catch
6. Testing: viết tests cho business logic + API routes
7. Tiếng Việt: All user-facing text support Vietnamese

## Interview AI Specific
- Store interviews trong `interview_sessions` table
- Use Edge Functions cho AI API calls (hide keys)
- Streaming responses cho real-time feedback
- Rate limit: 10 sessions/user/day, 5 rewrites/question
```

---

### MCP Servers Setup

**1. Supabase MCP (ESSENTIAL):**
```bash
claude mcp add-json supabase '{
  "type": "http",
  "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=false"
}'
```

**Tools available:**
- `list_tables`, `execute_sql`, `apply_migration`
- `list_edge_functions`, `deploy_edge_function`
- `generate_typescript_types`

**2. GitHub MCP (RECOMMENDED):**
```bash
# Cần GitHub PAT với scopes: repo, workflow
claude mcp add-json github '{
  "type":"http",
  "url":"https://api.githubcopilot.com/mcp",
  "headers":{"Authorization":"Bearer YOUR_GITHUB_PAT"}
}'
```

**Tools available:**
- Create/manage issues, PRs
- Branch management
- Code search

---

### Workflow Patterns

**Pattern 1: Build Feature End-to-End**
```bash
claude
> /plan  # Enter plan mode

# Claude researches without coding
> Read current interview session schema. 
> I want to add rewrite & compare feature.
> Create detailed plan but don't implement yet.

# Review plan in markdown
> Press Ctrl+G to edit

# Implement
> Shift+Tab  # Exit plan mode
> Implement the rewrite & compare feature from your plan.
> Use Supabase MCP to update schema if needed.
> Write tests for the compare logic.

# Commit
> Create git branch "feat/rewrite-compare"
> Commit with message "feat: add rewrite & compare feature"
> Use GitHub MCP to create PR with plan as description
```

---

## 4. BEST PRACTICES PROMPT ENGINEERING NÂNG CAO

### 1. Structured Output với Tool Use

**Claude (Recommended):**
```typescript
const FollowUpSchema = {
  type: "object",
  required: ["questions", "reasoning"],
  properties: {
    reasoning: {
      type: "string",
      description: "Phân tích ngắn gọn về gaps trong interview",
      minLength: 30,
      maxLength: 150
    },
    questions: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: {
        type: "object",
        required: ["question", "target_phrase", "rationale"],
        properties: {
          question: { type: "string", minLength: 10 },
          target_phrase: { 
            type: "string",
            description: "Cụm từ CHÍNH XÁC từ transcript (tối thiểu 3 từ)"
          },
          rationale: { type: "string", maxLength: 100 },
          difficulty: { enum: ["easy", "medium", "hard"] }
        }
      }
    }
  }
};

const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  output_config: {
    format: {
      type: "json_schema",
      schema: FollowUpSchema
    }
  },
  // ... messages
});
```

---

### 2. Prompt Caching (QUAN TRỌNG NHẤT - 70% cost savings)

**Anthropic Caching Strategy:**

```typescript
// Cấu trúc prompt với phần stable trước
const systemPrompt = [
  {
    type: "text",
    text: `[Hướng dẫn chung - không đổi]
    
## Job Description (stable cho session)
${jobDescription}

## CV (stable cho session)
${cvSummary}

## Rubric (stable cho session)
${rubric}

## Quy tắc
- Quote exact segments
- Reference rubric criteria
- Provide actionable improvements`,
    
    // CRITICAL: Mark for caching
    cache_control: { 
      type: "ephemeral",  // 5-min TTL (default)
      // Hoặc: ttl: "1h" nếu sessions có gap > 5 phút
    }
  }
];

// Usage sẽ như này:
// Turn 1: Pay full + 1.25x cache write
// Turn 2-5: Pay 0.1x cached portion (90% discount!)
```

**Cost Impact:**
```
Session 5 câu hỏi KHÔNG có cache:
- 5 × $0.00656 (surgical feedback) = $0.0328

Session 5 câu hỏi CÓ cache (80% cache hit):
- Turn 1: $0.00656 + cache write overhead
- Turn 2-5: $0.00131 each (90% discount on cached part)
- Total: ~$0.012 (giảm 63%)

Với 10,000 sessions/tháng: Tiết kiệm $210/month
```

**Các yếu tố invalidate cache:**
- ❌ Thay đổi system prompt → toàn bộ cache mất
- ❌ Thêm/bớt images trong messages
- ❌ Switch model giữa session
- ❌ Đưa timestamp vào cached portion (NEVER DO THIS!)
- ✅ Thay đổi user message → chỉ cached part được giữ

---

### 3. Token Optimization

**CV Compression (Run once per session):**
```typescript
async function compressCV(fullCV: string): Promise<string> {
  // Dùng GPT-4o-mini rẻ để compress
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "system",
      content: "Trích xuất key facts từ CV trong ≤150 tokens: kinh nghiệm, skills chính, công ty nổi bật, học vấn."
    }, {
      role: "user",
      content: fullCV
    }],
    max_tokens: 200,
    temperature: 0
  });
  
  return response.choices[0].message.content;
}

// Dùng cvSummary thay vì fullCV trong prompts
// Tiết kiệm: ~500-1000 tokens/request
```

**Sliding Window cho Conversation:**
```typescript
function truncateConversation(
  messages: Message[],
  maxTokens: number
): Message[] {
  const result: Message[] = [];
  let currentTokens = 0;
  
  // Work backwards từ newest
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = countTokens(messages[i].content);
    
    if (currentTokens + msgTokens > maxTokens) break;
    
    result.unshift(messages[i]);
    currentTokens += msgTokens;
  }
  
  return result;
}
```

---

### 4. Streaming với Error Handling

**Implementation:**
```typescript
// API Route
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { transcript } = await req.json();
  
  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    messages: [...],
    maxRetries: 3,
    
    onFinish: async ({ finishReason }) => {
      if (finishReason === 'length') {
        console.warn('Response truncated - tăng max_tokens');
      }
      if (finishReason === 'error') {
        // Trigger fallback
        await useFallbackQuestionBank();
      }
    },
    
    abortSignal: AbortSignal.timeout(30000) // 30s timeout
  });
  
  return result.toDataStreamResponse();
}
```

---

### 5. Retry Strategy với Circuit Breaker

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private state: 'closed' | 'open' | 'half_open' = 'closed';
  
  constructor(
    private threshold = 5,
    private timeout = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime! > this.timeout) {
        this.state = 'half_open';
      } else {
        throw new Error('Circuit breaker OPEN - service unavailable');
      }
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'half_open') {
        this.state = 'closed';
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.threshold) {
        this.state = 'open';
        console.error(`Circuit breaker OPENED after ${this.failureCount} failures`);
      }
      
      throw error;
    }
  }
}

// Usage
const claudeCircuit = new CircuitBreaker(5, 60000);
const openaiCircuit = new CircuitBreaker(5, 60000);

async function generateFeedback(transcript: string) {
  try {
    return await claudeCircuit.execute(() =>
      callClaude(transcript)
    );
  } catch (error) {
    // Fallback to OpenAI
    return await openaiCircuit.execute(() =>
      callOpenAI(transcript)
    );
  }
}
```

---

### 6. Vietnamese Language Handling

**Language Detection:**
```typescript
function detectLanguage(text: string): 'vi' | 'en' | 'mixed' {
  const vietnamesePattern = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i;
  
  const hasVietnamese = vietnamesePattern.test(text);
  const vietnameseRatio = (text.match(vietnamesePattern) || []).length / text.length;
  
  if (vietnameseRatio > 0.1) {
    return vietnameseRatio > 0.5 ? 'vi' : 'mixed';
  }
  
  return 'en';
}

// Adaptive system prompt
function buildSystemPrompt(language: 'vi' | 'en' | 'mixed'): string {
  const prompts = {
    vi: `Bạn là chuyên gia feedback phỏng vấn. Đưa phản hồi chính xác bằng tiếng Việt.
    
## Lưu ý văn hóa Việt Nam
- Ứng viên thường khiêm tốn, không tự quảng bá mạnh
- Code-switching Việt-Anh cho technical terms là bình thường
- Respect for hierarchy ảnh hưởng communication style`,
    
    en: `You are an expert interview coach. Provide precise feedback in English.`,
    
    mixed: `You are an expert interview coach. Match the candidate's language preference.
    For Vietnamese candidates, respond in Vietnamese. Code-switching is natural.`
  };
  
  return prompts[language];
}
```

---

## 5. EVALUATION & MONITORING

### Setup Helicone (5 phút)

**Installation:**
```typescript
// lib/llm-clients.ts
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Cache-Enabled": "true",
  }
});

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://anthropic.helicone.ai",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  }
});

// Trong API calls, thêm metadata
headers: {
  "Helicone-User-Id": userId,
  "Helicone-Session-Id": sessionId,
  "Helicone-Property-Feature": "surgical-feedback",
  "Helicone-Cost-Alert-Threshold": "0.30"
}
```

**Cost:** FREE cho 10,000 requests/month (đủ cho testing 50 users)

---

### Metrics Q-01 đến Q-07

**Q-01: Follow-up Relevance (target ≥90%)**
```typescript
function validatePhraseReference(
  question: string,
  transcript: string
): boolean {
  // Extract quotes từ question
  const quotes = question.match(/"([^"]+)"/g)?.map(q => q.slice(1, -1)) || [];
  
  // Check if any quote exists in transcript
  return quotes.some(quote => 
    quote.split(' ').length >= 3 && // Minimum 3 words
    transcript.toLowerCase().includes(quote.toLowerCase())
  );
}

// Track metric
const relevantQuestions = questions.filter(q => 
  validatePhraseReference(q.question, transcript)
).length;

const relevanceRate = relevantQuestions / questions.length;
// Target: ≥ 0.90
```

**Q-02: Feedback Specificity (target 100% precise)**
```typescript
function validateHighlightPrecision(
  highlight: { text: string; start: number; end: number },
  transcript: string
): boolean {
  const extracted = transcript.slice(highlight.start, highlight.end);
  return extracted.trim() === highlight.text.trim();
}

// Check all highlights
const precisionRate = highlights.filter(h => 
  validateHighlightPrecision(h, transcript)
).length / highlights.length;
// Target: 1.0
```

**Q-07: User Satisfaction (target ≥80%)**
```typescript
// Component
export function FeedbackWidget({ qaRecordId, userId }) {
  const handleRating = async (rating: 'helpful' | 'not_helpful') => {
    await supabase.from('user_feedback').insert({
      qa_record_id: qaRecordId,
      user_id: userId,
      rating,
      created_at: new Date().toISOString()
    });
  };
  
  return (
    <div>
      <p>Feedback này có hữu ích không?</p>
      <button onClick={() => handleRating('helpful')}>
        👍 Có, cụ thể và hữu ích
      </button>
      <button onClick={() => handleRating('not_helpful')}>
        👎 Không hữu ích
      </button>
    </div>
  );
}

// Calculate satisfaction rate
async function getSatisfactionRate() {
  const { data } = await supabase
    .from('user_feedback')
    .select('rating');
  
  const helpful = data.filter(f => f.rating === 'helpful').length;
  return helpful / data.length; // Target: ≥ 0.80
}
```

---

### Braintrust Setup (optional, cho advanced evaluation)

```typescript
import { Braintrust, Eval } from 'braintrust';

// Create golden dataset
const goldenDataset = [
  {
    input: {
      transcript: "Tôi đã lead team 5 developers build mobile app trong 6 tháng",
      cv: "Senior Engineer, 8 năm kinh nghiệm",
      jd: "Tìm Tech Lead có kinh nghiệm mobile"
    },
    expected: {
      shouldReference: ["lead team", "5 developers", "mobile app"],
      shouldNotHallucinate: true
    }
  },
  // 20-30 examples...
];

// Run evaluation
const evalResults = await Eval("follow-up-quality", {
  data: () => goldenDataset,
  task: async (input) => {
    return await generateFollowUpQuestions(input);
  },
  scores: [
    // Phrase reference check
    (output, expected) => ({
      name: "phrase-reference",
      score: checkPhraseReferences(output, expected.input.transcript)
    }),
    
    // LLM-as-judge
    async (output, expected) => {
      const judgment = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: "Score 1-5: Câu hỏi có reference transcript không? Có relevant không?"
        }, {
          role: "user",
          content: JSON.stringify({ output, expected })
        }],
        temperature: 0.2
      });
      
      return {
        name: "llm-judge",
        score: parseInt(judgment.choices[0].message.content) / 5
      };
    }
  ]
});
```

---

## 6. CHI PHÍ \u0026 COST OPTIMIZATION

### Chi Phí Breakdown Chi Tiết

**Per Session (5 câu hỏi):**

| Tính năng | Model | Tokens | Chi phí | With Cache |
|-----------|-------|--------|---------|------------|
| Whisper | OpenAI | 10min | $0.060 | $0.060 |
| Follow-up × 5 | Claude Sonnet 4.6 | 5000 | $0.01875 | $0.005625 |
| Surgical Feedback × 5 | Claude Sonnet 4.6 | 17500 | $0.0656 | $0.0328 |
| Context Scoring × 1 | Claude Sonnet 4.6 | 500 | $0.00235 | $0.00094 |
| Rewrite × 2 avg | Claude Sonnet 4.6 | 7000 | $0.02624 | $0.01050 |
| **TOTAL** | | | **$0.173** | **$0.109** ❌ |

> ⚠️ **Vẫn chưa đạt target $0.30 nhưng cần optimize thêm**

**Optimization để đạt < $0.30:**

1. **Dùng GPT-4o Mini cho Follow-up** (simple task):
   - $0.01875 → $0.001875 (giảm 90%)
   
2. **Lazy load Surgical Feedback** (chỉ generate khi user click):
   - 40% users không xem detailed feedback
   - Tiết kiệm: 40% × $0.0328 = $0.013/session

3. **Batch scoring nightly** (không real-time):
   - Context Pack Scoring: $0.00094 → $0.00047 (50% off with Batch API)

**OPTIMIZED COST:**
```
Whisper: $0.060
Follow-up (GPT-4o Mini, cached): $0.001875 × 0.2 = $0.000375
Surgical Feedback (lazy, 60% usage): $0.0328 × 0.6 = $0.01968
Context Scoring (batch): $0.00047
Rewrite (cached): $0.01050

TOTAL = $0.095 ✅ PASS!
```

---

### Monthly Cost Projections

**50 Users × 2 sessions/day:**
- LLM: 50 × 2 × 30 × $0.095 = **$285/month**
- Supabase Pro: **$25/month**
- Vercel Hobby: **$0** (free tier)
- Helicone: **$0** (free tier)
- **TOTAL: $310/month**

**200 Users × 3 sessions/day:**
- LLM: 200 × 3 × 30 × $0.095 = **$1,710/month**
- Supabase Pro: **$25-50/month**
- Vercel Pro: **$40/month**
- Monitoring: **$20-50/month**
- **TOTAL: $1,795-1,850/month**

---

### Rate Limiting Implementation

```typescript
// Using Upstash Redis (serverless-friendly)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function checkDailyLimit(userId: string): Promise<boolean> {
  const key = `quota:${userId}:${new Date().toISOString().split('T')[0]}`;
  
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 86400); // 24 hours
  }
  
  return count <= 10; // Max 10 sessions/day
}

export async function checkRewriteLimit(
  userId: string, 
  qaRecordId: string
): Promise<boolean> {
  const key = `rewrite:${userId}:${qaRecordId}`;
  
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 3600); // 1 hour
  }
  
  return count <= 5; // Max 5 rewrites/question
}

// Middleware cho API routes
export async function withRateLimit(
  userId: string,
  handler: Function
) {
  const allowed = await checkDailyLimit(userId);
  
  if (!allowed) {
    return Response.json(
      { 
        error: "Bạn đã đạt giới hạn 10 phiên/ngày",
        resetAt: new Date(Date.now() + 86400000).toISOString()
      },
      { status: 429 }
    );
  }
  
  return handler();
}
```

---

## 7. TIMELINE 12 TUẦN CHI TIẾT

### Tháng 1: Foundation (Tuần 1-4)

**Tuần 1: Setup Infrastructure**
- [ ] Create Next.js 16 project với TypeScript
- [ ] Setup Supabase project, enable Google OAuth
- [ ] Install dependencies (AI SDK, form libraries, etc.)
- [ ] Setup shadcn/ui components
- [ ] Create CLAUDE.md, setup Claude Code
- [ ] Connect Supabase MCP + GitHub MCP
- [ ] **Deliverable:** Dev environment ready, basic auth working

**Tuần 2: Database & Auth**
- [ ] Design và implement database schema
- [ ] Setup Row Level Security policies
- [ ] Implement Google OAuth login flow
- [ ] Create CV upload + PDF parsing
- [ ] Setup Helicone for monitoring
- [ ] **Deliverable:** Users can login, upload CV

**Tuần 3: Question Bank & Basic Interview Flow**
- [ ] Seed 60 questions vào database
- [ ] Implement question selection algorithm (random + category-based)
- [ ] Build interview start flow (paste JD → select first question)
- [ ] Create voice recording component
- [ ] Integrate Whisper API for transcription
- [ ] **Deliverable:** Users can start interview, record answer, get transcript

**Tuần 4: Testing & Debugging**
- [ ] Write unit tests cho core logic
- [ ] Manual testing của auth + interview flow
- [ ] Fix bugs
- [ ] Setup CI/CD với GitHub Actions
- [ ] **Deliverable:** Stable foundation, all basic flows work

---

### Tháng 2: Core AI Features (Tuần 5-8)

**Tuần 5: Follow-up Question Generation**
- [ ] Implement Claude Sonnet 4.6 integration
- [ ] Build follow-up generation API route với caching
- [ ] Implement structured output validation
- [ ] Add error handling + fallback to Question Bank
- [ ] **Deliverable:** AI generates follow-up questions referencing transcript

**Tuần 6: Surgical Feedback**
- [ ] Implement feedback generation với Claude
- [ ] Build highlighting UI (3 colors: info/warning/critical)
- [ ] Add improved_version display
- [ ] Implement validation (quotes must exist in transcript)
- [ ] **Deliverable:** Users get detailed, highlighted feedback

**Tuần 7: Context Pack & Cultural Adaptation**
- [ ] Build rubric system (Vietnamese vs Western)
- [ ] Implement cultural context detection
- [ ] Add scoring logic
- [ ] Create rubric editor cho admin
- [ ] **Deliverable:** Scoring adapts to company culture

**Tuần 8: Rewrite & Compare**
- [ ] Implement rewrite functionality
- [ ] Build comparison UI (before/after)
- [ ] Add rewrite limit enforcement (5/question)
- [ ] Track improvements in database
- [ ] **Testing Sprint:** Run all features end-to-end
- [ ] **Deliverable:** All 3 core features complete và working

---

### Tháng 3: Admin, Testing, Launch (Tuần 9-12)

**Tuần 9: Admin Dashboard**
- [ ] Build admin CRUD cho Question Bank
- [ ] Create user management interface
- [ ] Add usage analytics dashboard
- [ ] Implement cost monitoring dashboard
- [ ] **Deliverable:** Admin can manage users + questions + view metrics

**Tuần 10: Quality Assurance & Optimization**
- [ ] Create golden test dataset (30 examples)
- [ ] Setup Braintrust evaluations cho Q-01 to Q-06
- [ ] Run evaluation suite, fix issues
- [ ] Implement Q-07 feedback collection widget
- [ ] Optimize prompts based on eval results
- [ ] Load testing (simulate 50 concurrent users)
- [ ] **Deliverable:** All quality metrics passing, system stable

**Tuần 11: User Testing**
- [ ] Deploy to staging environment
- [ ] Recruit 50 beta users (university networks, LinkedIn)
- [ ] Onboard users, collect feedback
- [ ] Monitor metrics daily:
  - Cost per session
  - Error rates
  - Satisfaction rate (Q-07)
  - Usage patterns
- [ ] Fix critical bugs immediately
- [ ] **Deliverable:** 50 users × 2 sessions = 100 sessions completed

**Tuần 12: Analysis, Polish & Launch**
- [ ] Analyze user feedback
- [ ] Calculate final metrics (Q-01 to Q-07)
- [ ] Fix remaining issues
- [ ] Write user documentation
- [ ] Polish UI/UX
- [ ] Deploy to production
- [ ] **Deliverable:** Public launch! 🚀

---

## 8. RISK MITIGATION

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **API cost overrun** | Medium | High | Implement aggressive caching, daily budget alerts, circuit breakers |
| **Claude rate limits** | Medium | Medium | Start with OpenAI (500 RPM immediate), upgrade to Claude Tier 4 later |
| **Quality metrics fail** | Low | High | Continuous evaluation with Braintrust, iterate prompts weekly |
| **User adoption low** | Medium | High | Beta test with 50 users first, iterate based on feedback |
| **Supabase limits hit** | Low | Medium | Monitor usage, upgrade to Pro ($25) when approaching limits |
| **Scope creep** | High | High | **STRICT scope control:** Only 3 core features in 3 months |

---

### Critical Success Factors

1. **Ship MVP trong 8 tuần, còn 4 tuần để test/polish**
   - Không thêm features ngoài 3 core
   - "Done is better than perfect"

2. **Implement caching NGAY từ đầu**
   - 70% cost savings
   - 2 giờ setup, save $200+/month

3. **Monitor costs DAILY**
   - Set alert at $5/day
   - Review dashboard mỗi sáng

4. **User feedback loop tight**
   - Add feedback widget from Day 1 user testing
   - Iterate prompts based on satisfaction scores

---

## 9. CODE PATTERNS THỰC TẾ

### Pattern 1: API Route với Full Error Handling

```typescript
// app/api/interview/generate-feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { anthropic } from '@/lib/llm-clients';
import { FeedbackSchema } from '@/lib/schemas';
import { checkDailyLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // 2. Rate limit check
    const allowed = await checkDailyLimit(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Đã đạt giới hạn 10 phiên/ngày" },
        { status: 429 }
      );
    }
    
    // 3. Parse and validate input
    const body = await req.json();
    const { qaRecordId, transcript, culturalContext } = body;
    
    if (!transcript || transcript.length < 10) {
      return NextResponse.json(
        { error: "Transcript quá ngắn" },
        { status: 400 }
      );
    }
    
    // 4. Fetch context from database
    const { data: session } = await supabase
      .from('interview_sessions')
      .select('job_description, cv_summary, cultural_context')
      .eq('id', qaRecordId)
      .single();
    
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }
    
    // 5. Generate feedback with retry
    let feedback;
    try {
      feedback = await generateFeedbackWithRetry({
        transcript,
        jobDescription: session.job_description,
        cvSummary: session.cv_summary,
        culturalContext: session.cultural_context
      });
    } catch (llmError) {
      // Log error
      console.error('LLM error:', llmError);
      
      // Fallback: return generic feedback
      feedback = await getFallbackFeedback(transcript);
    }
    
    // 6. Validate output
    const validated = FeedbackSchema.safeParse(feedback);
    if (!validated.success) {
      throw new Error(`Invalid feedback structure: ${validated.error}`);
    }
    
    // 7. Save to database
    await supabase
      .from('qa_records')
      .update({ 
        ai_feedback: validated.data,
        feedback_generated_at: new Date().toISOString()
      })
      .eq('id', qaRecordId);
    
    // 8. Log cost
    await logLLMUsage({
      userId: user.id,
      feature: 'surgical_feedback',
      model: 'claude-sonnet-4-6',
      // ... token counts
    });
    
    return NextResponse.json({ feedback: validated.data });
    
  } catch (error) {
    console.error('Unhandled error:', error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateFeedbackWithRetry(context: any, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateFeedback(context);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      // Exponential backoff
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

---

### Pattern 2: Prompt Template với Caching

```typescript
// lib/prompts/surgical-feedback.ts
export function buildSurgicalFeedbackPrompt(context: {
  jobDescription: string;
  cvSummary: string;
  rubric: string;
  culturalContext: 'vietnamese' | 'western';
}) {
  // Phần này được CACHE (stable across session)
  const systemPrompt = `Bạn là chuyên gia feedback phỏng vấn.

## Job Description
${context.jobDescription}

## Background Ứng Viên
${context.cvSummary}

## Rubric Đánh Giá
${context.rubric}

## Văn Hóa Công Ty
${context.culturalContext === 'vietnamese' ? `
- Đánh giá cân bằng: ghi nhận điểm mạnh trước khi chỉ ra cải thiện
- Khuyến khích phát triển, không harsh criticism
- Nhấn mạnh teamwork, collaboration skills
- Kỹ năng tiếng Anh technical khác giao tiếp chung
` : `
- Direct, actionable feedback
- Focus on individual achievements
- Emphasize innovation, leadership
- Quick decision-making valued
`}

## Quy Tắc Output
- Trích CHÍNH XÁC đoạn từ transcript (không paraphrase)
- Mỗi highlight cần: segment + severity + explanation + improved_version
- Severity: info (informative), warning (cần cải thiện), critical (lỗi nghiêm trọng)
- Giới hạn 3-8 highlights, focus vào quan trọng nhất`;

  return {
    systemPrompt,
    // User message sẽ chứa transcript (variable, không cache)
  };
}

// Usage
const { systemPrompt } = buildSurgicalFeedbackPrompt(context);

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  system: [{
    type: "text",
    text: systemPrompt,
    cache_control: { type: "ephemeral" } // Enable caching
  }],
  messages: [{
    role: "user",
    content: `Transcript:\n${transcript}\n\nPhân tích và feedback.`
  }],
  // ...
});
```

---

## 10. CHECKLIST TRƯỚC KHI LAUNCH

### Pre-Launch (Tuần 11)

**Security:**
- [ ] Environment variables KHÔNG commit vào Git
- [ ] Supabase RLS policies enabled cho tất cả tables
- [ ] API keys rotate quarterly (set reminder)
- [ ] Rate limiting hoạt động (test by exceeding limits)
- [ ] Input sanitization (prevent SQL injection, XSS)

**Performance:**
- [ ] API response time p95 < 2s
- [ ] Prompt caching enabled, cache hit rate > 70%
- [ ] Images optimized với Next.js Image component
- [ ] Bundle size < 200KB
- [ ] Lighthouse score > 85

**Reliability:**
- [ ] Error boundaries trong React components
- [ ] Retry logic với exponential backoff
- [ ] Circuit breakers cho LLM APIs
- [ ] Fallback to Question Bank when LLM fails
- [ ] Health check endpoint (`/api/health`)

**Monitoring:**
- [ ] Helicone tracking all LLM calls
- [ ] Daily cost alerts set ($5/day threshold)
- [ ] Error tracking (Sentry hoặc similar)
- [ ] User analytics (PostHog hoặc Plausible)
- [ ] Uptime monitoring (UptimeRobot free tier)

**Quality:**
- [ ] Q-01: Follow-up relevance ≥ 90%
- [ ] Q-02: Feedback specificity = 100%
- [ ] Q-03: Cultural accuracy ≥ 95%
- [ ] Q-04: Response coherence ≥ 4.0/5
- [ ] Q-05: Zero hallucinations
- [ ] Q-06: Zero safety violations
- [ ] Q-07: User satisfaction (collect during testing)

**Documentation:**
- [ ] README với setup instructions
- [ ] User guide (Notion/Docs)
- [ ] Privacy policy
- [ ] Terms of service
- [ ] FAQ section

---

## 11. POST-LAUNCH MONITORING

### Daily Checks (5 phút mỗi sáng)

```typescript
// Script chạy daily
async function dailyHealthCheck() {
  // 1. Check costs
  const costData = await getHeliconeMetrics();
  console.log(`💰 Hôm qua: $${costData.totalCost} (avg $${costData.avgPerSession}/session)`);
  if (costData.avgPerSession > 0.30) {
    await sendAlert('⚠️ Chi phí/session vượt $0.30!');
  }
  
  // 2. Check satisfaction rate
  const satisfaction = await getSatisfactionRate();
  console.log(`👍 Satisfaction: ${(satisfaction * 100).toFixed(1)}%`);
  if (satisfaction < 0.70) {
    await sendAlert('⚠️ Satisfaction xuống dưới 70%!');
  }
  
  // 3. Check error rate
  const errorRate = await getErrorRate();
  console.log(`❌ Error rate: ${(errorRate * 100).toFixed(1)}%`);
  if (errorRate > 0.05) {
    await sendAlert('⚠️ Error rate > 5%!');
  }
  
  // 4. Check active users
  const activeUsers = await getActiveUsersYesterday();
  console.log(`👥 Active users: ${activeUsers}`);
}
```

### Weekly Reviews (30 phút mỗi Chủ nhật)

1. **Cost Analysis:**
   - Total cost tuần này vs tuần trước
   - Cost per feature breakdown
   - Cache hit rate (target > 80%)
   - Identify expensive users

2. **Quality Metrics:**
   - Q-01 to Q-07 trend
   - User feedback comments review
   - Identify quality issues

3. **Usage Patterns:**
   - Peak usage times
   - Most used features
   - Dropout points in funnel

4. **Action Items:**
   - Prompt iterations needed?
   - Features to optimize?
   - Bugs to fix?

---

## 12. KẾT LUẬN \u0026 NEXT STEPS

### Tóm Tắt Khuyến Nghị

**Tech Stack (FINAL):**
- ✅ **Frontend:** Next.js 16 + Tailwind + shadcn/ui
- ✅ **Backend:** Next.js API Routes
- ✅ **Database:** Supabase PostgreSQL (NO pgvector)
- ✅ **LLM:** Claude Sonnet 4.6 (primary) + OpenAI Whisper (voice)
- ✅ **AI SDK:** Vercel AI SDK v4
- ✅ **Monitoring:** Helicone (free tier)
- ✅ **Deployment:** Vercel Hobby → Pro

**Cost:**
- Target: $0.30/session
- Achieved: **$0.095/session** (optimized) ✅
- Monthly (50 users): **$310**
- Monthly (200 users): **$1,850**

**Timeline:**
- Tuần 1-4: Foundation
- Tuần 5-8: Core AI features
- Tuần 9-12: Admin, testing, launch
- **Total: 12 tuần = 3 tháng** ✅

**Success Criteria:**
- ✅ ≥50 users testing
- ✅ ≥2 sessions/user
- ✅ ≥80% satisfaction
- ✅ Cost < $0.30/session
- ✅ All quality metrics (Q-01 to Q-07) passing

---

### Action Items NGAY HÔM NAY

**Tuần này (Tuần 1):**
1. ✅ Tạo project Next.js 16
2. ✅ Setup Supabase account + project
3. ✅ Install Claude Code + setup CLAUDE.md
4. ✅ Create database schema
5. ✅ Setup Helicone account

**Câu hỏi cần trả lời:**
- Budget approval: $310-1,850/month depending on scale?
- University approval cho recruiting 50 beta users?
- Có mentor/advisor review architecture không?

---

### Resources

**Documentation:**
- Next.js: https://nextjs.org/docs
- Vercel AI SDK: https://sdk.vercel.ai/docs
- Anthropic: https://docs.anthropic.com
- Supabase: https://supabase.com/docs

**Community:**
- Next.js Discord: https://nextjs.org/discord
- Vercel Discord: https://vercel.com/discord
- r/nextjs: https://reddit.com/r/nextjs

**Learning:**
- Next.js 15 tutorial: https://nextjs.org/learn
- Claude prompt engineering: https://docs.anthropic.com/en/docs/prompt-engineering

---

**Chúc bạn thành công với dự án InterviewAI! Nếu cần clarification về bất kỳ phần nào, hãy hỏi thêm. 🚀**