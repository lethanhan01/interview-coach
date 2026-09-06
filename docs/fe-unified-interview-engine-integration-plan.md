# Kế Hoạch Kỹ Thuật Chi Tiết: Đồng Bộ Frontend Với Unified Interview Engine (SFIA 9 + O*NET)

> **Mục tiêu:** Nâng cấp toàn diện và đồng bộ giao diện người dùng (Frontend Next.js) tương thích 100% với Cỗ máy Đánh giá Phỏng vấn Tinh gọn (Unified Interview Engine) của Backend theo đặc tả [docs/public-schema-refinement-and-hybrid-integration-plan.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/docs/public-schema-refinement-and-hybrid-integration-plan.md).  
> **Source of Truth:** 
> - Backend Plan: `docs/public-schema-refinement-and-hybrid-integration-plan.md`
> - UI Conventions: `client/stories/foundations/Conventions.mdx` & `.claude/rules/ui-conventions.md`
> - Agent Mandates: `.agents/AGENTS.md`
> **Vị trí tài liệu:** `docs/fe-unified-interview-engine-integration-plan.md`  
> **Trạng thái:** Đã qua thẩm định kiến trúc chuyên sâu (/grill-me v3) - Hoàn thiện toàn diện Backend Contract & Frontend UI, Không kẽ hở kỹ thuật, Sẵn sàng triển khai.

---

## MỤC LỤC

1. [Tổng Quan Bối Cảnh & Kết Quả Thẩm Định (/grill-me v3)](#1-tổng-quan-bối-cảnh--kết-quả-thẩm-định-grill-me-v3)
   - [1.1 Hiện trạng Frontend & Sự Lệch Pha Dữ Liệu](#11-hiện-trạng-frontend--sự-lệch-pha-dữ-liệu)
   - [1.2 Các Quyết Định Kỹ Thuật Đã Chốt Qua /grill-me](#12-các-quyết-định-kỹ-thuật-đã-chốt-qua-grill-me)
2. [Nguyên Tắc Kiến Trúc & Thiết Kế Giao Diện Frontend](#2-nguyên-tắc-kiến-trúc--thiết-kế-giao-diện-frontend)
3. [Lộ Trình Triển Khai 5 Pha Chi Tiết](#3-lộ-trình-triển-khai-5-pha-chi-tiết)
   - [Pha 1: Chuẩn Hóa Contracts, Data Types, Backend Bridge & Test Fixtures](#pha-1-chuẩn-hóa-contracts-data-types-backend-bridge--test-fixtures)
   - [Pha 2: Xây Dựng Bộ UI Components Đánh Giá Tinh Gọn Mới](#pha-2-xây-dựng-bộ-ui-components-đánh-giá-tinh-gọn-mới)
   - [Pha 3: Tái Cấu Trúc Toàn Diện Trang Báo Cáo Phỏng Vấn (/report)](#pha-3-tái-cấu-trúc-toàn-diện-trang-báo-cáo-phỏng-vấn-report)
   - [Pha 4: Nâng Cấp Phòng Phỏng Vấn Trực Tiếp (Live Session /sessions/[id])](#pha-4-nâng-cấp-phòng-phỏng-vấn-trực-tiếp-live-session-sessionsid)
   - [Pha 5: Đồng Bộ Luồng Thiết Lập JD Chuẩn Hóa O*NET (/setup & /jd-library)](#pha-5-đồng-bộ-luồng-thiết-lập-jd-chuẩn-hóa-onet-setup--jd-library)
4. [Ma Trận Tệp Tin Tác Động (Affected Files Matrix)](#4-ma-trận-tệp-tin-tác-động-affected-files-matrix)
5. [Kế Hoạch Kiểm Thử & Tiêu Chí Nghiệm Thu (QA & Verification Plan)](#5-kế-hoạch-kiểm-thử--tiêu-chí-nghiệm-thu-qa--verification-plan)
6. [Ma Trận Xử Lý Rủi Ro & Biên Ngoại Lệ (Edge Cases & Risks)](#6-ma-trận-xử-lý-rủi-ro--biên-ngoại-lệ-edge-cases--risks)

---

## 1. Tổng Quan Bối Cảnh & Kết Quả Thẩm Định (/grill-me v3)

### 1.1 Hiện trạng Frontend & Sự Lệch Pha Dữ Liệu
Sau khi Backend chuyển đổi toàn diện sang **Unified Interview Engine** (quy tụ vào `session_skills`, chuẩn hóa O\*NET SOC Code + SFIA Level 1-7, tiêu chí nhị phân 2 chiều `core` và `seniority`), Frontend hiện tại gặp các điểm nghẽn nghiêm trọng:
1. **Lỗi thời về mô hình tiêu chí:** `ScoringMethodCard.tsx` và `CompetencyScoreChart.tsx` đang hardcode theo 6 tiêu chí HR (D1-D6) và 5 tiêu chí Tech (TD1-TD5) cũ vốn đã bị loại bỏ ở Backend.
2. **Thiếu vắng dữ liệu đánh giá mới:** Frontend chưa có component nào để hiển thị `skillsBreakdown` (SFIA skills, Target vs Demonstrated Level, Gap/Passed), `criteriaEvaluations` (bộ tiêu chí nhị phân kèm Evidence & Deduction reason), và `recommendationStatus`.
3. **Kế hoạch hành động (`actionPlan`) chưa có cấu trúc:** Bị ép kiểu thành mảng chuỗi đơn giản thay vì một lộ trình học tập trực quan có độ ưu tiên, chủ đề ôn tập và thời gian ước tính (tuần).
4. **Phòng phỏng vấn (`QuestionCard`) chưa phản ánh ngữ cảnh:** Chưa hiển thị tên kỹ năng và công nghệ liên quan từ O\*NET, làm giảm tính định hướng cho ứng viên.
5. **JD Setup nhập tự do, thiếu chuẩn hóa O\*NET:** Người dùng phải tự nhập tự do tên công việc và tech stack khiến backend phải xử lý mờ (fuzzy); chưa có cơ chế binding trực tiếp từ schema O\*NET và chưa cho phép tùy chỉnh Cấp bậc SFIA mục tiêu.

### 1.2 Các Quyết Định Kỹ Thuật Đã Chốt Qua /grill-me

| Thành phần | Thiết kế cũ / Vấn đề | Quyết định kỹ thuật chốt (/grill-me) |
| :--- | :--- | :--- |
| **Backend Contracts** | `findQuestions` thiếu skill/tech; DTOs thiếu `targetSfiaLevel`; O\*NET chưa có API public | **Mở rộng nhẹ Backend:**<br>1. Thêm `OnetController` (`GET /onet/occupations`, `GET /onet/occupations/:socCode/tech`).<br>2. Cập nhật `session.service.ts` (`findQuestions` trả về `skillCode`, `skillName`, `techContext`).<br>3. Bổ sung `targetSfiaLevel?: number` vào `CreateSessionDto` & `SaveJobDescriptionDto`. |
| **Nhập liệu JD (`JdForm`)** | Nhập tự do không ràng buộc | **Binding trực tiếp từ Schema O\*NET dạng Hybrid Combobox:** Cho phép tìm kiếm/chọn chức danh chuẩn O\*NET (kèm mã SOC) để chuẩn hóa; tự động gợi ý danh sách Tech Stack của O\*NET; vẫn cho phép ứng viên chỉnh sửa tên công việc theo thực tế JD công ty. |
| **Xác nhận JD (`ConfirmStep`)** | Chỉ có text thô | **Thẻ tóm tắt `AI Job Profile`:** Hiển thị Chức danh O\*NET, mã SOC, Cấp bậc SFIA mục tiêu (Level 2-5) có thể điều chỉnh qua Radio/Select, danh sách Tech Stack chuẩn hóa. |
| **Thẻ phương pháp (`ScoringMethodCard`)** | Donut D1-D6 cũ | **Ghi đè trực tiếp:** Thay thế toàn bộ bằng thẻ Accordion giải thích cơ chế Đánh giá Tiêu chí Nhị phân 2 Chiều (Core & Seniority) + Thang Cấp độ SFIA Level 1-7 cho mọi phiên. |
| **Biểu đồ cũ (`CompetencyScoreChart`)** | Vẽ heatmap D1-D6 cũ | **Loại bỏ hoàn toàn:** Xóa `CompetencyScoreChart.tsx`. Các phiên cũ không có `skillsBreakdown` sẽ hiển thị banner thông báo phiên bản cũ và điểm tổng kết. |
| **Hiển thị năng lực (`SkillsBreakdown`)** | Không có | **Mô hình 2 tầng:**<br>• Tầng 1 `SfiaCompetencyOverview`: Bảng đối chiếu Cấp độ Target vs Demonstrated (thanh đo 7-segment trực quan).<br>• Tầng 2 `SkillsBreakdownCard`: Danh sách thẻ chi tiết kèm O\*NET Tech Stack, điểm 0-100, Ưu điểm & Điểm cần hoàn thiện. |
| **Checklist từng câu (`AnnotatedTranscript`)** | Thanh điểm `appliedDimensions` cũ | **`BinaryCriteriaChecklist`:** Render checklist Pass/Fail icon, Evidence trích dẫn, Lý do trừ điểm, Demonstrated Level. Giữ nguyên highlight câu chữ và Model Answer. |
| **Phòng phỏng vấn Live** | Thiếu định hướng kỹ năng | **Hiển thị Badge Kỹ năng & Chips Tech Stack** ở đầu mỗi câu hỏi; ẩn hoàn toàn Rubric Criteria và Target Level để tránh học vẹt. |

---

## 2. Nguyên Tắc Kiến Trúc & Thiết Kế Giao Diện Frontend

Tất cả mã nguồn mới và sửa đổi phải tuân thủ nghiêm ngặt 5 quy chuẩn Frontend từ `client/stories/foundations/Conventions.mdx` và `.agents/AGENTS.md`:

1. **Component Reusability (`@/components/ui/`):** Tái sử dụng triệt để `Button`, `Badge`, `Card`, `Progress`, `Accordion`, `Dialog`. Không viết HTML button thô với Tailwind classes ad-hoc.
2. **Safe Dynamic Styling:** Không bao giờ nối chuỗi template literals cho Tailwind classes (e.g. cấm `` `bg-${color}-500` ``). Bắt buộc dùng CVA (`class-variance-authority`) hoặc dictionary lookup object cố định.
3. **Design Tokens & No Arbitrary Values:** 
   - Tuyệt đối không dùng mã hex tùy tiện hoặc arbitrary brackets (`bg-[#1769ff]`, `h-[43px]`).
   - Sử dụng Semantic Tokens: `bg-surface-0` (Canvas), `bg-surface-1` (Container), `bg-ai` / `bg-ai-subtle` (AI Insights), `text-ink`, `text-ink-muted`, `text-ink-faint`, `border-border`.
   - Bắt buộc class `tabular-nums` cho mọi con số động (điểm số, số level, đồng hồ đếm ngược).
4. **Class Merging:** Luôn nhận `className` prop tùy chọn và hợp nhất qua `cn(...)` từ `@/lib/utils`.
5. **Interactive & Accessibility States:** Mọi thành phần tương tác phải có `hover`, `focus-visible`, `disabled`, semantic ARIA (`role="progressbar"`, `aria-valuenow`, `aria-label`) và hỗ trợ mượt mà Dark/Light mode.

---

## 3. Lộ Trình Triển Khai 5 Pha Chi Tiết

### Pha 1: Chuẩn Hóa Contracts, Data Types, Backend Bridge & Test Fixtures

> **Mục tiêu:** Cung cấp hạ tầng Contract Type-Safe ở cả Backend và Frontend, mở các endpoints còn thiếu phục vụ O\*NET binding và context câu hỏi.

#### Bước 1.1: Bổ sung Backend Controller & Contract (`server/`)
1. **Tạo `server/src/modules/onet/onet.controller.ts`:**
   - `@Get('occupations')`: Tìm kiếm danh mục chức danh O\*NET qua `onetService.findOccupationByTitle` hoặc danh sách IT occupations phổ biến.
   - `@Get('occupations/:socCode/tech')`: Lấy danh sách Tools & Technologies qua `onetService.getToolsAndTechnology(socCode)`.
   - Đăng ký `OnetController` vào `OnetModule`.
2. **Cập nhật `server/src/modules/interview-live/session/session.service.ts`:**
   - Trong `findQuestions(sessionId, userId)`: `include: { sessionSkill: true }`, trích xuất và trả về:
     - `skillCode`: `question.sfiaSkillCode || question.sessionSkill?.skillCode`
     - `skillName`: Tra cứu từ `SfiaService` (hoặc fallback `skillCode`)
     - `techContext`: `question.sessionSkill?.techContext ?? []`
3. **Cập nhật DTOs Backend:**
   - `CreateSessionDto`: Thêm `@IsOptional() @IsInt() @Min(1) @Max(7) targetSfiaLevel?: number;`
   - `SaveJobDescriptionDto`: Thêm `@IsOptional() @IsInt() @Min(1) @Max(7) targetSfiaLevel?: number;` và `@IsOptional() @IsString() onetSocCode?: string;`
   - Cập nhật `create-interview-session.service.ts` để ưu tiên `dto.targetSfiaLevel` nếu người dùng tùy chỉnh.

#### Bước 1.2: Cập nhật `client/lib/types.ts` & Services
- **Mở rộng interface `Report`:**
  ```typescript
  export type RecommendationStatus = 
    | 'strongly_recommended' 
    | 'recommended' 
    | 'borderline' 
    | 'not_recommended';

  export interface SkillBreakdownItem {
    skillCode: string;
    skillName: string;
    techContext: string[];
    targetLevel: number;
    demonstratedLevel: number;
    score: number;
    status: 'passed' | 'gap';
    strengths: string;
    areasForImprovement: string;
  }

  export interface BinaryCriterionResult {
    criteriaId: string;
    passed: boolean;
    evidence: string;
    deductionReason?: string | null;
    criteriaText?: string;
    dimension?: 'core' | 'seniority';
  }

  export interface ActionPlanItem {
    priority: 'high' | 'medium' | 'low';
    skillCode: string;
    title: string;
    topics: string[];
    estimatedWeeks: number;
  }

  export interface ExecutiveSummary {
    overallScore?: number | null;
    targetSfiaLevel?: number;
    demonstratedSfiaLevel?: number;
    recommendationStatus?: RecommendationStatus;
    summary?: string;
    evaluatedTurns?: number;
    fallbackTurns?: number;
    [key: string]: unknown;
  }

  export interface Report {
    sessionId: string;
    reportQuality: 'full' | 'partial' | 'unavailable' | 'not_scorable';
    overallScore: number | null;
    recommendationStatus?: RecommendationStatus;
    skillsBreakdown?: SkillBreakdownItem[];
    actionPlan: { items?: string[]; actionPlan?: ActionPlanItem[] } | Record<string, unknown>;
    executiveSummary: ExecutiveSummary;
    competencyHeatmap: Record<string, unknown>;
    transcript: TranscriptItem[];
  }
  ```
- **Mở rộng `TranscriptItem` & `Question`:**
  - `TranscriptItem`: Thêm `criteriaEvaluations?: BinaryCriterionResult[]; demonstratedLevel?: number | null; criteriaPassRate?: number | null; strengths?: string[]; improvements?: string[];`.
  - `Question`: Thêm `skillCode?: string; skillName?: string; techContext?: string[]; targetLevel?: number;`.
  - `SavedJobDescription`: Thêm `onetSocCode?: string; onetOccupationTitle?: string; targetSfiaLevel?: number; normalizedTechStack?: string[];`.
- **Tạo `client/services/onet.service.ts`:**
  - `searchOccupations(query: string)`
  - `getOccupationTech(socCode: string)`

#### Bước 1.3: Tạo Mock Test Fixtures (`client/tests/fixtures/report.fixture.ts`)
- Mock dữ liệu hoàn chỉnh cho:
  - `mockUnifiedReport`: Đầy đủ `skillsBreakdown`, `criteriaEvaluations`, `recommendationStatus = 'borderline'`, `actionPlan`.
  - `mockLegacyReport`: Phiên cũ không có `skillsBreakdown`.
  - `mockSkippedTurnsReport`: Phiên có câu hỏi bị bỏ qua (`skipped = true`, 0 điểm).

---

### Pha 2: Xây Dựng Bộ UI Components Đánh Giá Tinh Gọn Mới

> **Mục tiêu:** Xây dựng các UI Components nguyên tử, viết Unit Test Vitest bọc lót trước khi tích hợp vào trang.

#### Bước 2.1: Xây dựng `RecommendationBadge.tsx`
- **Vị trí:** `client/components/report/RecommendationBadge.tsx`
- **Quy chuẩn hiển thị:**
  - `strongly_recommended`: Nền `bg-success-subtle`, chữ `text-success`, viền `border-success/30`, icon CheckCheck, nhãn "Xuất Sắc - Đạt Chuẩn Cao".
  - `recommended`: Nền `bg-brand-subtle`, chữ `text-brand`, viền `border-brand/30`, icon Check, nhãn "Đạt Yêu Cầu Tuyển Dụng".
  - `borderline`: Nền `bg-warning-subtle`, chữ `text-warning`, viền `border-warning/30`, icon AlertTriangle, nhãn "Cân Nhắc - Cần Đánh Giá Thêm".
  - `not_recommended`: Nền `bg-danger-subtle`, chữ `text-danger`, viền `border-danger/30`, icon XCircle, nhãn "Chưa Đạt Chuẩn Kỳ Vọng".
- **Unit Test:** `RecommendationBadge.test.tsx` (kiểm tra 4 trạng thái, đúng CSS tokens, đúng icon).

#### Bước 2.2: Xây dựng Mô hình 2 Tầng cho Skills Breakdown
- **Tầng 1: `SfiaCompetencyOverview.tsx`:**
  - **Vị trí:** `client/components/report/SfiaCompetencyOverview.tsx`
  - Bảng đối chiếu nhanh Cấp độ Target (Level 1-7) vs Cấp độ Thể hiện (Demonstrated Level 1-7) cho toàn bộ kỹ năng.
  - Thanh đo 7 đoạn (7-segment meter) trực quan, có nhãn cấp độ SFIA và màu sắc phân biệt rõ ràng.
- **Tầng 2: `SkillsBreakdownCard.tsx`:**
  - **Vị trí:** `client/components/report/SkillsBreakdownCard.tsx`
  - Render danh sách thẻ chi tiết từng kỹ năng:
    - Header: Tên kỹ năng + Badge SFIA code (`PROG`, `DBDS`...) + Chips Tech Stack O\*NET.
    - Badge: `Đạt chuẩn` (Xanh lá) hoặc `Cần cải thiện (Gap)` (Hổ phách).
    - Thanh tiến trình: `score / 100` với `tabular-nums` và semantic token.
    - Box Ưu điểm (`border-l-2 border-success`) & Box Cải thiện (`border-l-2 border-warning`).
- **Unit Test:** `SkillsBreakdownCard.test.tsx` (kiểm tra render kỹ năng, tags, trạng thái Gap/Passed).

#### Bước 2.3: Xây dựng `BinaryCriteriaChecklist.tsx`
- **Vị trí:** `client/components/report/BinaryCriteriaChecklist.tsx`
- **Quy chuẩn hiển thị:**
  - Danh sách tiêu chí với icon Check xanh (`CheckCircle2`) hoặc Cross đỏ (`XCircle`).
  - Badge chiều đánh giá: `[Cốt lõi - Core]` hoặc `[Thâm niên - Seniority]`.
  - Khung Bằng chứng (`evidence`): `bg-surface-inset rounded-lg p-2.5 text-xs text-ink`, trích dẫn câu nói của ứng viên.
  - Khung Lý do trừ điểm (`deductionReason`): Nếu không đạt, giải thích rõ nguyên nhân.
- **Unit Test:** `BinaryCriteriaChecklist.test.tsx`.

#### Bước 2.4: Xây dựng `ActionPlanTimeline.tsx`
- **Vị trí:** `client/components/report/ActionPlanTimeline.tsx`
- **Quy chuẩn hiển thị:**
  - Priority CVA: `high` (Đỏ), `medium` (Vàng), `low` (Xanh).
  - Tiêu đề hành động + Mã kỹ năng + Huy hiệu ước tính thời gian (`⏱ 2 tuần`).
  - Checklist các chủ đề trọng tâm (`topics`) cần ôn tập.
- **Unit Test:** `ActionPlanTimeline.test.tsx`.

#### Bước 2.5: Cải tiến trực tiếp `ScoringMethodCard.tsx`
- **Vị trí:** `client/components/report/ScoringMethodCard.tsx`
- Cập nhật trực tiếp: Thay thế biểu đồ Donut D1-D6 cũ bằng Thẻ Accordion tương tác giải thích cơ chế đánh giá SFIA 9 & O\*NET:
  - Mục 1: Tiêu chí Nhị phân 2 Chiều (Core & Seniority).
  - Mục 2: Thang Cấp bậc SFIA Version 9 (Level 1-7).
  - Mục 3: Cách tính điểm tất định 0-100% (câu bỏ qua tính 0 điểm).
- **Cập nhật Unit Test:** `ScoringMethodCard.test.tsx`.

---

### Pha 3: Tái Cấu Trúc Toàn Diện Trang Báo Cáo Phỏng Vấn (/report)

> **Mục tiêu:** Ráp nối toàn bộ components mới vào [report/page.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(candidate)/sessions/[sessionId]/report/page.tsx), loại bỏ component cũ `CompetencyScoreChart.tsx`.

#### Bước 3.1: Xóa Bỏ `CompetencyScoreChart.tsx` & Xây Dựng Fallback
- Xóa file `client/components/report/CompetencyScoreChart.tsx` và test tương ứng.
- Trong `report/page.tsx`:
  - Nếu `report.skillsBreakdown && report.skillsBreakdown.length > 0`: Render `SfiaCompetencyOverview` + `SkillsBreakdownCard`.
  - Nếu không có `skillsBreakdown` (phiên cũ): Hiển thị thông báo phiên bản cũ nhẹ nhàng, không vẽ lại chart cũ.
  - Xử lý Action Plan: Nếu có `actionPlan.actionPlan` thì render `ActionPlanTimeline`; nếu là `items` thì render danh sách gạch đầu dòng.

#### Bước 3.2: Nâng cấp Hero Banner Trang Báo Cáo
- Hiển thị Điểm Tổng Kết `overallScore / 100` với font chữ `text-5xl font-bold tabular-nums`.
- Hiển thị `RecommendationBadge` bên cạnh điểm số.
- Phụ đề Cấp bậc: `Kỳ vọng: Level {targetSfiaLevel} • Thể hiện: Level {demonstratedSfiaLevel}`.

#### Bước 3.3: Tái cấu trúc `AnnotatedTranscript.tsx`
- Tích hợp `BinaryCriteriaChecklist` vào từng câu trả lời.
- Hiển thị Demonstrated Level của từng câu (`Level 1-7`).
- Loại bỏ hoàn toàn khối render `appliedDimensions` cũ.
- Cập nhật unit test `AnnotatedTranscript.test.tsx`.

#### Bước 3.4: Chạy Vitest Trang Báo Cáo
- Kiểm tra toàn bộ tests của module report:
  ```bash
  cd client && npm run test:unit -- client/components/report/
  ```

---

### Pha 4: Nâng Cấp Phòng Phỏng Vấn Trực Tiếp (Live Session /sessions/[id])

> **Mục tiêu:** Cung cấp thông tin định hướng thân thiện cho ứng viên trong lúc làm bài, tuyệt đối bảo mật đề thi.

#### Bước 4.1: Cập nhật `QuestionCard.tsx`
- **Vị trí:** `client/components/interview/QuestionCard.tsx`
- Thanh ngữ cảnh câu hỏi:
  - Huy hiệu Kỹ năng (nếu có): Hiển thị tên kỹ năng (ví dụ: `Phát triển Phần mềm` hoặc `PROG`).
  - Chips Công nghệ: Danh sách tags công nghệ O\*NET (ví dụ: `Node.js`, `PostgreSQL`).
  - **Bảo mật đề thi:** Tuyệt đối **KHÔNG** hiển thị Rubric Criteria và Target Level.
- **Unit Test:** `QuestionCard.test.tsx`.

#### Bước 4.2: Tích hợp vào Phòng Thi Trực Tiếp
- Trong `client/app/(candidate)/sessions/[sessionId]/page.tsx`:
  - Truyền `skillCode`, `skillName`, `techContext` từ `Question` vào `QuestionCard`.

---

### Pha 5: Đồng Bộ Luồng Thiết Lập JD Chuẩn Hóa O*NET (/setup & /jd-library)

> **Mục tiêu:** Binding dữ liệu trực tiếp từ Schema O\*NET khi nhập JD mới và cho phép tùy chỉnh Cấp bậc SFIA mục tiêu.

#### Bước 5.1: Cập nhật `JdForm.tsx` Với O*NET Hybrid Combobox
- **Vị trí:** `client/components/setup/JdForm.tsx`
- Bổ sung trường chọn Chức danh chuẩn O\*NET:
  - Dropdown/Combobox tìm kiếm chức danh từ API `/onet/occupations` (ví dụ: *Software Developers [15-1252.00]*).
  - Khi chọn Chức danh O\*NET:
    - Tự động điền giá trị gợi ý vào trường "Vị trí tuyển dụng" (Job Title) nhưng vẫn cho phép ứng viên gõ tùy chỉnh theo JD công ty.
    - Gọi API `/onet/occupations/:socCode/tech` để hiển thị danh sách Chips gợi ý công nghệ O\*NET, cho phép ứng viên bấm chọn nhanh để thêm vào Tech Stack.
    - Tự động cập nhật `onetSocCode` và `onetOccupationTitle` vào state JD.

#### Bước 5.2: Cập nhật `ConfirmStep.tsx`
- **Vị trí:** `client/components/setup/ConfirmStep.tsx`
- Thẻ tóm tắt **"Hồ sơ Vị trí Tuyển dụng (AI Job Profile)"**:
  - Chức danh chuẩn O\*NET: `onetOccupationTitle` kèm mã SOC.
  - Cấp bậc SFIA mục tiêu: Cho phép người dùng tùy chỉnh Cấp bậc (Level 2: Junior, Level 3: Middle, Level 4: Senior, Level 5: Lead) thông qua Radio Group / Select.
  - Danh sách Chips Tech Stack đã chọn.
- Truyền `targetSfiaLevel` đã chọn vào payload `saveJobDescription` và `createSession`.

#### Bước 5.3: Cập nhật Thư Viện JD (`/jd-library`)
- **Vị trí:** `client/app/(candidate)/jd-library/page.tsx`
- Hiển thị badge Chức danh O\*NET và Cấp bậc SFIA mục tiêu trên từng thẻ JD đã lưu.

#### Bước 5.4: Kiểm Thử Toàn Diện (End-to-End Test Suite)
- Chạy toàn bộ tests và typecheck:
  ```bash
  cd client && npm run test:unit
  npm run typecheck
  npm run build
  cd ../server && npm run test:unit
  ```

---

## 4. Ma Trận Tệp Tin Tác Động (Affected Files Matrix)

| STT | Thao tác | Tệp tin | Pha | Trách nhiệm chính |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **NEW** | `server/src/modules/onet/onet.controller.ts` | 1 | API tìm kiếm Chức danh O\*NET và danh sách Tools & Technologies. |
| 2 | **MODIFY** | `server/src/modules/onet/onet.module.ts` | 1 | Khai báo `OnetController`. |
| 3 | **MODIFY** | `server/src/modules/interview-live/session/session.service.ts` | 1 | `findQuestions` trả về `skillCode`, `skillName`, `techContext`. |
| 4 | **MODIFY** | `server/src/modules/interview-live/session/dto/create-session.dto.ts` | 1 | Bổ sung `targetSfiaLevel?: number`. |
| 5 | **MODIFY** | `server/src/modules/interview-prep/job-description/dto/save-job-description.dto.ts` | 1 | Bổ sung `targetSfiaLevel?: number; onetSocCode?: string;`. |
| 6 | **MODIFY** | `client/lib/types.ts` | 1 | Mở rộng interfaces `Report`, `TranscriptItem`, `Question`, `ExecutiveSummary`... |
| 7 | **NEW** | `client/services/onet.service.ts` | 1 | Client service gọi API O\*NET. |
| 8 | **MODIFY** | `client/services/session.service.ts` | 1 | Chuẩn hóa hàm `getReport`. |
| 9 | **NEW** | `client/tests/fixtures/report.fixture.ts` | 1 | Cung cấp mock data chuẩn cho Unified Report, Legacy Report, Skipped Report. |
| 10 | **NEW** | `client/components/report/RecommendationBadge.tsx` | 2 | Huy hiệu khuyến nghị tuyển dụng 4 trạng thái. |
| 11 | **NEW** | `client/components/report/RecommendationBadge.test.tsx` | 2 | Unit test cho `RecommendationBadge`. |
| 12 | **NEW** | `client/components/report/SfiaCompetencyOverview.tsx` | 2 | Tầng 1: Bảng đối chiếu Cấp bậc SFIA Level 1-7 toàn bộ kỹ năng. |
| 13 | **NEW** | `client/components/report/SkillsBreakdownCard.tsx` | 2 | Tầng 2: Thẻ kỹ năng SFIA chi tiết kèm tech stack, điểm số, ưu/nhược điểm. |
| 14 | **NEW** | `client/components/report/SkillsBreakdownCard.test.tsx` | 2 | Unit test cho `SkillsBreakdownCard` & `SfiaCompetencyOverview`. |
| 15 | **NEW** | `client/components/report/BinaryCriteriaChecklist.tsx` | 2 | Checklist tiêu chí nhị phân Pass/Fail kèm Evidence & Deduction Reason. |
| 16 | **NEW** | `client/components/report/BinaryCriteriaChecklist.test.tsx` | 2 | Unit test cho `BinaryCriteriaChecklist`. |
| 17 | **NEW** | `client/components/report/ActionPlanTimeline.tsx` | 2 | Lộ trình ôn tập theo độ ưu tiên và số tuần. |
| 18 | **NEW** | `client/components/report/ActionPlanTimeline.test.tsx` | 2 | Unit test cho `ActionPlanTimeline`. |
| 19 | **MODIFY** | `client/components/report/ScoringMethodCard.tsx` | 2 | Thay thế trực tiếp Donut cũ bằng Accordion giải thích SFIA 9 & Core/Seniority. |
| 20 | **MODIFY** | `client/components/report/ScoringMethodCard.test.tsx` | 2 | Cập nhật unit test cho `ScoringMethodCard`. |
| 21 | **DELETE** | `client/components/report/CompetencyScoreChart.tsx` | 3 | Xóa bỏ component biểu đồ D1-D6 cũ. |
| 22 | **DELETE** | `client/components/report/CompetencyScoreChart.test.tsx` | 3 | Xóa bỏ unit test của component biểu đồ cũ. |
| 23 | **MODIFY** | `client/components/report/AnnotatedTranscript.tsx` | 3 | Tích hợp `BinaryCriteriaChecklist`, loại bỏ `appliedDimensions`. |
| 24 | **MODIFY** | `client/components/report/AnnotatedTranscript.test.tsx` | 3 | Cập nhật unit test cho `AnnotatedTranscript`. |
| 25 | **MODIFY** | `client/app/(candidate)/sessions/[sessionId]/report/page.tsx` | 3 | Ghép nối giao diện Report mới + Fallback cho phiên cũ. |
| 26 | **MODIFY** | `client/components/interview/QuestionCard.tsx` | 4 | Hiển thị Tên kỹ năng và Chips công nghệ, ẩn tiêu chí đề thi. |
| 27 | **MODIFY** | `client/components/interview/QuestionCard.test.tsx` | 4 | Cập nhật unit test cho `QuestionCard`. |
| 28 | **MODIFY** | `client/app/(candidate)/sessions/[sessionId]/page.tsx` | 4 | Truyền kỹ năng và công nghệ vào `QuestionCard`. |
| 29 | **MODIFY** | `client/components/setup/JdForm.tsx` | 5 | Hybrid Combobox chọn Chức danh O\*NET và gợi ý Tech Stack. |
| 30 | **MODIFY** | `client/components/setup/ConfirmStep.tsx` | 5 | Thẻ `AI Job Profile` cho phép tùy chỉnh Cấp bậc SFIA mục tiêu (Level 2-5). |
| 31 | **MODIFY** | `client/app/(candidate)/jd-library/page.tsx` | 5 | Hiển thị thông tin O\*NET & SFIA trên thẻ JD. |

---

## 5. Kế Hoạch Kiểm Thử & Tiêu Chí Nghiệm Thu (QA & Verification Plan)

### 5.1 Kiểm thử Tự Động (Automated Unit Tests)
- Toàn bộ các component mới và component sửa đổi đều có tệp `.test.tsx` tương ứng chạy qua Vitest + React Testing Library.
- Câu lệnh thực thi:
  ```bash
  cd client && npm run test:unit
  ```
- Tiêu chí nghiệm thu: **100% tests pass**, không có snapshot failure, không có warning rò rỉ bộ nhớ.

### 5.2 Kiểm tra Biên dịch & Type Safety
- Câu lệnh thực thi:
  ```bash
  cd client && npm run typecheck && npm run build
  cd ../server && npm run test:unit
  ```
- Tiêu chí nghiệm thu: **Lệnh `next build` xuất ra bundle sản xuất thành công**, 0 compile errors.

### 5.3 Kịch Bản Kiểm Thử Thủ Công (Manual Scenarios)
1. **Kịch bản 1: Nhập JD Mới Với O\*NET Binding (/setup):**
   - Vào `/setup`, gõ tìm kiếm chức danh "Software Developers". Chọn mã SOC `15-1252.00`.
   - Hệ thống tự gợi ý danh sách Tech Stack (Node.js, React, SQL...). Bấm chọn nhanh các chips.
   - Tới `ConfirmStep`, thẻ `AI Job Profile` hiển thị đúng Chức danh và Level 3. Thử chuyển sang Level 4.
   - Bấm bắt đầu -> Phiên phỏng vấn được khởi tạo thành công với Level 4 mục tiêu.
2. **Kịch bản 2: Phòng Phỏng Vấn Trực Tiếp (Live Session):**
   - Mỗi câu hỏi hiển thị Badge Kỹ năng và Chips Tech Stack ở thanh tiêu đề nhỏ.
   - Tiêu chí chấm điểm và cấp bậc mục tiêu hoàn toàn được giấu kín.
3. **Kịch bản 3: Xem Báo Cáo Phiên Mới (Unified Engine):**
   - Vào phiên đã hoàn thành.
   - Kiểm tra: `RecommendationBadge`, điểm số lớn `tabular-nums`, Tầng 1 bảng SFIA Level 1-7, Tầng 2 thẻ kỹ năng chi tiết có ưu/nhược điểm, checklist tiêu chí Pass/Fail kèm evidence, lộ trình Action Plan có tuần và topics.
4. **Kịch bản 4: Xem Báo Cáo Phiên Cũ (Graceful Fallback):**
   - Mở báo cáo của phiên cũ (không có `skillsBreakdown`).
   - Kiểm tra: Không crash, hiển thị thông báo phiên cũ an toàn.

---

## 6. Ma Trận Xử Lý Rủi Ro & Biên Ngoại Lệ (Edge Cases & Risks)

| Biên ngoại lệ / Rủi ro | Mức độ | Cơ chế phòng ngừa & Xử lý |
| :--- | :---: | :--- |
| **Câu hỏi bị bỏ qua (Skipped Question)** | Trung bình | `BinaryCriteriaChecklist` kiểm tra `skipped = true` -> Không render checklist tiêu chí, hiển thị banner thông báo: *"Câu hỏi này đã bị bỏ qua (Nhận 0 điểm và Level 1 theo quy chuẩn)"*, vẫn hiển thị câu trả lời mẫu tham khảo. |
| **Dữ liệu `skillsBreakdown` bị rỗng hoặc null** | Cao | Fallback Adapter tự động chuyển sang hiển thị banner thông báo phiên bản cũ kèm điểm tổng kết. |
| **Báo cáo chưa sẵn sàng (`REPORT_NOT_READY` / SSE)** | Trung bình | Cơ chế Polling kết hợp Server-Sent Events (SSE) đã có sẵn trong `ReportPage` được bảo toàn nguyên vẹn. |
| **Vi phạm UI Conventions (Hardcode mã màu hex/bracket)** | Cao | Sử dụng triệt để CVA và bảng lookup `RECORD` cố định, toàn bộ colors ánh xạ vào Semantic Tokens của hệ thống (`bg-surface-1`, `text-ink`, `bg-ai`, `border-border`). |
| **Không tìm thấy O\*NET match khi gõ tự do** | Thấp | Giữ giá trị gõ tự do làm `jobTitle`, fallback `onetSocCode = '15-1252.00'` và `onetOccupationTitle = 'Software Developers'`. |
