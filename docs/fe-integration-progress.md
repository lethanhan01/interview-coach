# Nhật Ký & Tiến Độ Triển Khai: Đồng Bộ Frontend Với Unified Interview Engine (SFIA 9 + O*NET)

> **Tài liệu nguồn (Plan gốc):** [`docs/fe-unified-interview-engine-integration-plan.md`](file:///c:/Users/An/Documents/GR1/InterviewCoach/docs/fe-unified-interview-engine-integration-plan.md)  
> **Nguyên tắc thực thi:**  
> 1. Triển khai tuần tự từng phần nhỏ (Micro-tasks), không làm nhanh, làm đến đâu kiểm tra chắc chắn đến đó.  
> 2. Sau mỗi phần nhỏ: Chạy unit tests, typecheck, linting/arch tests để xác nhận hoàn thành chặt chẽ trước khi chuyển sang phần tiếp theo.  
> 3. Hạn chế tối đa rủi ro, tuân thủ nghiêm ngặt 5 UI Conventions và 5 Backend Architecture Rules.  
> 4. Ngày bắt đầu: 2026-09-06.

---

## BẢNG TIẾN ĐỘ TỔNG THỂ

| Giai Đoạn | Nội Dung Công Việc | Trạng Thái | Hoàn Thành |
| :--- | :--- | :---: | :---: |
| **Pha 1** | Chuẩn Hóa Contracts, Data Types, Backend Bridge & Test Fixtures | 🟢 Đã hoàn thành | 3 / 3 bước |
| **Pha 2** | Xây Dựng Bộ UI Components Đánh Giá Tinh Gọn Mới | 🟢 Đã hoàn thành | 5 / 5 bước |
| **Pha 3** | Tái Cấu Trúc Toàn Diện Trang Báo Cáo Phỏng Vấn (/report) | 🟢 Đã hoàn thành | 4 / 4 bước |
| **Pha 4** | Nâng Cấp Phòng Phỏng Vấn Trực Tiếp (Live Session /sessions/[id]) | 🟢 Đã hoàn thành | 2 / 2 bước |
| **Pha 5** | Đồng Bộ Luồng Thiết Lập JD Chuẩn Hóa O*NET (/setup & /jd-library) | 🟢 Đã hoàn thành | 4 / 4 bước |
| **TỔNG THỂ** | **Đồng Bộ Hoàn Toàn Frontend Với Unified Interview Engine** | 🟢 **HOÀN THÀNH TOÀN DIỆN** | **18 / 18 bước** |

---

## CHI TIẾT CÁC GIAI ĐOẠN

### Pha 1: Chuẩn Hóa Contracts, Data Types, Backend Bridge & Test Fixtures

- [x] **Bước 1.1: Bổ sung Backend Controller & Contract (`server/`)**
  - [x] Mở rộng `OnetService`: Thêm `searchOccupations(query?, limit = 10)` có hỗ trợ tìm kiếm mờ, deduplicate theo SOC code và fallback vị trí IT phổ biến.
  - [x] Tạo `OnetController`: Bảo vệ bằng `@UseGuards(JwtAuthGuard)`, cung cấp `GET /onet/occupations` và `GET /onet/occupations/:socCode/tech`.
  - [x] Đăng ký `OnetController` vào `OnetModule`.
  - [x] Cập nhật `SessionModule` import `SfiaModule`.
  - [x] Cập nhật `SessionService`: Inject `@Inject(SFIA_FACADE_TOKEN) ISfiaFacade` (Rule 1 Cross-Module Contract), `findQuestions` trả về `skillCode`, `skillName`, `techContext`.
  - [x] Cập nhật `CreateSessionDto`: Bổ sung `@IsOptional() @IsInt() @Min(1) @Max(7) targetSfiaLevel?: number`.
  - [x] Cập nhật `SaveJobDescriptionDto`: Bổ sung `targetSfiaLevel?: number`, `onetSocCode?: string` và `onetOccupationTitle?: string`.
  - [x] Cập nhật `CreateInterviewSession` và `SavedJobDescriptionService`: Ưu tiên `targetSfiaLevel` và `onetSocCode` nếu người dùng tùy biến.
  - [x] Chạy kiểm tra: `npm test` (74/74 test suites, 589/589 tests pass), `npm run test:arch` (3/3 rules pass) và `npm run build` thành công 100% trên Backend.

- [x] **Bước 1.2: Cập nhật `client/lib/types.ts`, `setup-types.ts` & Services**
  - [x] Cập nhật `client/lib/setup-types.ts`: Bổ sung `onetSocCode`, `onetOccupationTitle`, `targetSfiaLevel` vào `JdFormData` + helper `mapJdLevelToSfia`.
  - [x] Mở rộng interface `Report` trong `client/lib/types.ts`: `RecommendationStatus`, `SkillBreakdownItem`, `BinaryCriterionResult`, `ActionPlanItem`, `ExecutiveSummary`...
  - [x] Mở rộng `TranscriptItem`, `Question`, `SavedJobDescription`, `CreateSessionPayload`, `SaveJobDescriptionPayload` trong `client/lib/types.ts`.
  - [x] Tạo `client/services/onet.service.ts`: `searchOccupations`, `getOccupationTech` và export trong `client/services/index.ts`.
  - [x] Chuẩn hóa interface `Report` dùng chung trong `sessionService.getReport`.
  - [x] Chạy kiểm tra: `npm run typecheck` (0 errors, build sạch) phía Client.

- [x] **Bước 1.3: Tạo Mock Test Fixtures (`client/tests/fixtures/report.fixture.ts`)**
  - [x] Mock dữ liệu hoàn chỉnh cho `mockUnifiedReport`, `mockLegacyReport`, `mockSkippedTurnsReport`.
  - [x] Viết unit test xác nhận tính toàn vẹn và type safety tại `client/lib/__tests__/report-fixture.test.ts`.
  - [x] Chạy kiểm tra: `npm run test:unit -- lib/__tests__/report-fixture.test.ts` (7/7 tests pass 100%).

---

### Pha 2: Xây Dựng Bộ UI Components Đánh Giá Tinh Gọn Mới

- [x] **Bước 2.1: Xây dựng `RecommendationBadge.tsx` & Unit Test**
  - [x] Tạo `client/components/report/RecommendationBadge.tsx` hỗ trợ 4 trạng thái (`strongly_recommended`, `recommended`, `borderline`, `not_recommended`) kèm fallback an toàn.
  - [x] Sử dụng semantic tokens và primitive `Badge`, hỗ trợ các kích cỡ `sm`, `md`, `lg`.
  - [x] Viết unit test `client/components/report/RecommendationBadge.test.tsx` (6/6 tests pass).
  - [x] Chạy typecheck và vitest xác nhận 100% đạt chuẩn.
- [x] **Bước 2.2: Xây dựng Mô hình 2 Tầng cho Skills Breakdown (`SfiaCompetencyOverview.tsx` & `SkillsBreakdownCard.tsx`) & Unit Test**
  - [x] Tạo `client/components/report/SfiaCompetencyOverview.tsx` hiển thị thanh đo 7-segment SFIA Level 1-7, Target vs Demonstrated, bộ đếm Đạt chuẩn / Cần hoàn thiện.
  - [x] Tạo `client/components/report/SkillsBreakdownCard.tsx` hiển thị chi tiết từng kỹ năng, O*NET tech chips, thanh tiến trình điểm số, box Điểm mạnh & Điểm cần hoàn thiện.
  - [x] Viết unit tests `SfiaCompetencyOverview.test.tsx` (3/3 pass) và `SkillsBreakdownCard.test.tsx` (2/2 pass).
  - [x] Chạy typecheck và vitest xác nhận 100% đạt chuẩn.
- [x] **Bước 2.3: Xây dựng `BinaryCriteriaChecklist.tsx` & Unit Test**
  - [x] Tạo `client/components/report/BinaryCriteriaChecklist.tsx` hiển thị danh sách tiêu chí nhị phân, badge chiều đánh giá Core vs Seniority, trích dẫn Bằng chứng và Lý do chưa đạt.
  - [x] Viết unit test `client/components/report/BinaryCriteriaChecklist.test.tsx` (2/2 pass).
  - [x] Chạy typecheck và vitest xác nhận 100% đạt chuẩn.
- [x] **Bước 2.4: Xây dựng `ActionPlanTimeline.tsx` & Unit Test**
  - [x] Tạo `client/components/report/ActionPlanTimeline.tsx` hỗ trợ cả định dạng mới có cấu trúc (ActionPlanItem) kèm độ ưu tiên, số tuần và topics lẫn định dạng legacy fallback.
  - [x] Viết unit test `client/components/report/ActionPlanTimeline.test.tsx` (3/3 pass).
  - [x] Chạy typecheck và vitest xác nhận 100% đạt chuẩn.
- [x] **Bước 2.5: Cải tiến trực tiếp `ScoringMethodCard.tsx` & Cập nhật Unit Test**
  - [x] Thay thế Donut Chart D1-D6 cũ bằng Thẻ Accordion tương tác giải thích cơ chế đánh giá SFIA 9 & O*NET: Tiêu chí nhị phân 2 chiều (Core & Seniority), Thang cấp bậc SFIA Level 1-7, Cách tính điểm tất định và quy tắc câu bỏ qua (0 điểm, Level 1).
  - [x] Viết unit test `client/components/report/ScoringMethodCard.test.tsx` (2/2 pass).
  - [x] Chạy typecheck và toàn bộ unit test suite (139 test files, 454 tests pass 100%).

- [x] **Remediation & Hardening (/grill-me Thẩm Định Chuyên Sâu Pha 1 & 2):**
  - [x] **Chuẩn hóa Typography & UI Rule 3:** Thay thế toàn bộ 6 vị trí `text-[11px]` trong `BinaryCriteriaChecklist`, `SkillsBreakdownCard`, `ActionPlanTimeline` sang `text-xs`; giữ `text-[10px]` ở SegmentMeter kèm comment `// Design Exception: ...`.
  - [x] **WAI-ARIA Accessibility:** Bổ sung `aria-valuemin="0"`, `aria-valuenow="0"` và hiển thị nhãn *"Chưa thể hiện (Level 0)"* khi `demonstratedLevel = 0`. Viết unit test kiểm chứng (4/4 tests pass).
  - [x] **Storybook Visual Catalog & Test-Runner:** Bổ sung 5 file `.stories.tsx` chuẩn mực trong `client/stories/report/` cho toàn bộ 5 UI components mới. Toàn bộ 144 test files (471 tests) đều pass với Vitest Chromium.
  - [x] **Backend Validation:** Tạo `GetOnetTechParamDto` xác thực mã SOC bằng regex `^\d{2}-\d{4}\.\d{2}$` theo Backend Rule 4.
  - [x] **Đồng bộ dữ liệu JD:** Đồng bộ cập nhật `targetSfiaLevel` tùy biến vào `SavedJobDescription` trong `create-interview-session.service.ts` và viết unit test kiểm chứng trong `session.service.spec.ts`.
  - [x] **Chạy toàn bộ Verification Suite:** `npm run test:arch` (3/3 pass), `npm test` server (74/74 suites, 590/590 tests pass), `nest build` sạch sẽ; `npm run typecheck` client (0 errors), `npm run test:unit` (144 files, 471 tests pass) và `next build` hoàn tất 100%.

---

### Pha 3: Tái Cấu Trúc Toàn Diện Trang Báo Cáo Phỏng Vấn (/report)

- [x] **Bước 3.1: Xóa Bỏ `CompetencyScoreChart.tsx` & Xây Dựng Fallback Phiên Cũ**
  - [x] Xóa bỏ các tệp tin liên quan đến biểu đồ cũ: `client/components/report/CompetencyScoreChart.tsx`, `CompetencyScoreChart.test.tsx` và `client/stories/report/CompetencyScoreChart.stories.tsx`.
  - [x] Dọn dẹp `report/page.tsx`: Loại bỏ import `rubricService`, state `rubricConfig`, và lệnh gọi `rubricService.getActiveRubric` không cần thiết.
  - [x] Tích hợp mô hình năng lực 2 tầng: Render `SfiaCompetencyOverview` (Tầng 1) và `SkillsBreakdownCard` (Tầng 2) khi có `skillsBreakdown`.
  - [x] Xây dựng Fallback Alert an toàn cho các phiên cũ: Hiển thị banner phiên bản trước với semantic tokens (`bg-surface-1`, `border-border`), bảo lưu toàn bộ điểm số tổng quát và transcript.
  - [x] Tích hợp `ActionPlanTimeline`: Hỗ trợ cả định dạng mới có cấu trúc (`ActionPlanItem`) và mảng chuỗi legacy (`items`).
  - [x] Chạy kiểm tra: `npm run typecheck` (0 errors), `npm run test:unit` (142/142 test files, 469/469 tests pass 100%).
- [x] **Bước 3.2: Nâng cấp Hero Banner Trang Báo Cáo (Overall Score & Recommendation)**
  - [x] Nâng cấp Hero Banner với bố cục 2 cột responsive linh hoạt (`flex-col md:flex-row md:items-center md:justify-between`).
  - [x] Cột trái: Hiển thị Điểm Tổng Kết `overallScore / 100` với font chữ `text-5xl font-bold tabular-nums tracking-tight` kèm phụ đề Cấp bậc SFIA Kỳ vọng vs Thể hiện (`targetSfiaLevel` & `demonstratedSfiaLevel`).
  - [x] Cột phải: Tích hợp `RecommendationBadge` (size `lg`) hiển thị trạng thái khuyến nghị tuyển dụng chuẩn hóa.
  - [x] Fallback an toàn khi `overallScore == null` hoặc khi báo cáo ở trạng thái `partial`/`not_scorable`.
  - [x] Chạy kiểm tra: `npm run typecheck` (0 errors) sạch sẽ.
- [x] **Bước 3.3: Tái Cấu Trúc `AnnotatedTranscript.tsx` (Binary Criteria & Skipped Turns)**
  - [x] Tích hợp `BinaryCriteriaChecklist` trực tiếp vào từng câu hỏi có dữ liệu thẩm định nhị phân Core & Seniority.
  - [x] Header mỗi câu: Bổ sung Badge Cấp bậc thể hiện (`SFIA Level {demonstratedLevel}`) và Badge Tỷ lệ đạt (`Đạt {criteriaPassRate * 100}% tiêu chí`).
  - [x] Xử lý câu bị bỏ qua (`skipped = true`): Hiển thị banner cảnh báo chuẩn hóa nhận 0 điểm và SFIA Level 1; ẩn tiêu chí thẩm định; vẫn hiển thị câu trả lời mẫu đề xuất (`modelAnswer`).
  - [x] Bảo toàn cơ chế tương thích ngược (Graceful Legacy Fallback) cho các phiên cũ: Hiển thị nhận xét theo `segments` và `appliedDimensions` khi chưa có dữ liệu tiêu chí mới.
- [x] **Remediation & Hardening (/grill-me Thẩm Định Chuyên Sâu Pha 3):**
  - [x] **Triệt tiêu Rubric cũ trong `AnnotatedTranscript.tsx`:** Xóa sạch import `getRubricHint` từ `@/lib/rubric-config` và khối render `appliedDimensions`, thay thế bằng thông báo phiên bản cũ chuẩn hóa nhẹ nhàng khi không có tiêu chí nhị phân SFIA & O*NET.
  - [x] **Logic trích xuất `improvementDirections`:** Bổ sung `extractActionPlanDirections` trong `report/page.tsx`, ưu tiên trích xuất tiêu đề hành động và chủ đề ôn tập từ `report.actionPlan.actionPlan` theo thứ tự ưu tiên (`high` -> `medium`), giải quyết triệt để lỗi hiển thị thiếu thông tin cải thiện trong Tóm tắt tổng quan.
  - [x] **Parser JD linh hoạt (Case-insensitive):** Cập nhật `parseJobDescription` trong `SessionMetadataCard.tsx` so khớp không phân biệt hoa thường (`Tech Stack:` lẫn `Tech stack:`, `Yêu cầu:`...), bổ sung unit test kiểm chứng bóc tách thành công chips công nghệ.
  - [x] **Tuân thủ triệt để UI Rule 1 & Rule 3:** Tái sử dụng UI Primitive `<Progress>` ở màn hình loading của `report/page.tsx` thay cho thanh loading HTML thô; tái sử dụng primitive `<Card>` cho khối Tóm tắt tổng quan, `AnnotatedTranscript` và `SessionMetadataCard`; xóa bỏ arbitrary brackets/classes trong Hero banner.
  - [x] **Accessibility & Trạng thái Level 0:** Bổ sung `focus-visible:ring-brand` cho nút mở câu trả lời đề xuất; chuẩn hóa hiển thị Cấp bậc khi `demonstratedSfiaLevel === 0` thành `Chưa thể hiện (Level 0)`.
  - [x] **Mở rộng Storybook Coverage:** Bổ sung 4 stories trong `AnnotatedTranscript.stories.tsx` (`Default`, `UnifiedTurns`, `SkippedTurn`, `LegacyFallback`), toàn bộ pass Storybook Chromium test-runner.
  - [x] **Chạy toàn bộ Verification Suite:** Toàn bộ 28 tests module report pass 100%, 4 Storybook tests pass, `npm run typecheck` (0 errors) và `next build` hoàn tất 100%.

---

### Pha 4: Nâng Cấp Phòng Phỏng Vấn Trực Tiếp (Live Session /sessions/[id])

- [x] **Bước 4.1: Cập nhật `QuestionCard.tsx` (Hiển thị Badge Kỹ Năng SFIA, Flex-wrap Responsive & Bảo Mật Đề Thi)**
  - [x] Nâng cấp `QuestionCard.tsx`: Bổ sung props `skillCode?: string`, `skillName?: string`, `techContext?: string[]`, `className?: string`.
  - [x] Định dạng nhãn kỹ năng SFIA chuẩn hóa: Ưu tiên `${skillName} (${skillCode})` (ví dụ: `Phát triển Phần mềm (PROG)`) hoặc fallback `skillName || skillCode`. Ẩn hoàn toàn badge khi không có thông tin kỹ năng.
  - [x] Tích hợp UI Primitive `<Badge variant="brand">` kết hợp icon `Sparkles` (`size-3`) trang trọng, tuân thủ UI Rule 1 & Rule 3.
  - [x] Bố cục header responsive `flex flex-wrap items-center justify-between gap-2.5`, tự động bẻ dòng mượt mà trên mobile màn hình nhỏ mà không tràn viền.
  - [x] Hỗ trợ class merging qua `cn(...)` tuân thủ UI Rule 4.
  - [x] **Bảo mật tuyệt đối (Exam Security):** Tuyệt đối không hiển thị `targetLevel`, tiêu chí rubric `criteria`, và ẩn danh sách chips công nghệ O*NET trong phòng thi trực tiếp để tối ưu sự tập trung của ứng viên.
  - [x] Xây dựng bộ Unit Test `QuestionCard.test.tsx` (7/7 tests pass) bao phủ: hiển thị câu hỏi, số thứ tự, format nhãn kỹ năng khi có cả name & code, fallback khi chỉ có name hoặc code, ẩn badge khi không có kỹ năng, kiểm tra bảo mật không để lọt tech tags/criteria/target level, và custom className.
  - [x] Bổ sung 6 Storybook stories trong `QuestionCard.stories.tsx` (`Default`, `WithSfiaSkill`, `SkillNameOnly`, `SkillCodeOnly`, `LongQuestionWithSkill`, `MobileViewport`), toàn bộ 6/6 tests pass trên Storybook Chromium test-runner.
- [x] **Bước 4.2: Tích Hợp Vào Phòng Thi Trực Tiếp (`page.tsx`) & Kiểm Thử Toàn Diện**
  - [x] Cập nhật `client/app/(candidate)/sessions/[sessionId]/page.tsx`: Truyền `skillCode={current.skillCode}`, `skillName={current.skillName}`, `techContext={current.techContext}` từ đối tượng `current` (`Question`) vào `<QuestionCard>`.
  - [x] Chạy kiểm thử module interview: 4/4 test files (16 tests) pass 100%.
  - [x] Chạy typecheck: `npm run typecheck` đạt 0 errors (TypeScript sạch sẽ).
  - [x] Chạy toàn bộ test suite client: 143/143 test files (489 tests) pass 100%.
  - [x] Chạy production build: `npm run build` thành công 100% với Next.js Turbopack.
  - [x] Chạy kiểm thử kiến trúc backend: `npm run test:arch` đạt 3/3 rules pass.

---

### Pha 5: Đồng Bộ Luồng Thiết Lập JD Chuẩn Hóa O*NET (/setup & /jd-library)

- [x] **Bước 5.1: Cập nhật `JdForm.tsx` Với O*NET Hybrid Combobox & Ánh Xạ Mặc Định SFIA Level**
  - [x] Bổ sung Combobox tìm kiếm Chức danh chuẩn O*NET (`/onet/occupations`) có debounce 250ms, hiển thị mã SOC và chức danh.
  - [x] Tự động gợi ý Vị trí (`position`) khi chọn Chức danh O*NET nếu đang trống, cho phép xóa/thay đổi linh hoạt.
  - [x] Tích hợp gợi ý công nghệ O*NET (`/onet/occupations/:socCode/tech`), hiển thị các chips công nghệ cho phép người dùng click thêm nhanh vào Tech Stack.
  - [x] Tự động suy luận `targetSfiaLevel` mặc định khi người dùng chọn Level qua `mapJdLevelToSfia`.
  - [x] Mở rộng bộ unit test `JdForm.test.tsx` (16/16 tests pass) bao phủ tìm kiếm, chọn chức danh O*NET, clear chức danh, hiển thị tech chips và suy luận SFIA Level.
  - [x] Bổ sung Story `WithOnetOccupation` trong `JdForm.stories.tsx`.
  - [x] Typecheck `npm run typecheck` thành công 100% không lỗi.
- [x] **Bước 5.2: Cập nhật `ConfirmStep.tsx` Với Thẻ AI Job Profile & Cho Phép Điều Chỉnh SFIA Level**
  - [x] Thiết kế thẻ "Hồ sơ Vị trí Tuyển dụng (AI Job Profile)" hiển thị Chức danh chuẩn O*NET (kèm mã SOC) và chips Tech Stack trọng điểm.
  - [x] Hỗ trợ điều chỉnh Cấp bậc SFIA mục tiêu (Level 1-5) thông qua primitive `Select`, tự động cập nhật ngược lại `jd.targetSfiaLevel` qua callback `onChange`.
  - [x] Cập nhật `app/(candidate)/setup/page.tsx`:
    - Chuẩn hóa `normalizeJdFormData` và `savedJobDescriptionToForm` bảo lưu `onetSocCode`, `onetOccupationTitle`, `targetSfiaLevel`.
    - Cập nhật `toSavedJobDescriptionPayload` truyền `onetSocCode`, `onetOccupationTitle`, `targetSfiaLevel` sang API `saveJobDescription`.
    - Cập nhật `handleSubmit` truyền `targetSfiaLevel` và `onetSocCode` vào payload gọi `sessionService.createSession`.
    - Truyền `onChange={updateJd}` vào `<ConfirmStep>`.
  - [x] Mở rộng unit tests `ConfirmStep.test.tsx` (11/11 tests pass) bao phủ hiển thị AI Job Profile, mã SOC, fallback tự do và select Cấp bậc SFIA.
  - [x] Bổ sung Story `WithOnetAndSfiaProfile` trong `ConfirmStep.stories.tsx`.
  - [x] Toàn bộ 8 test files setup (59 tests gồm cả Storybook tests) pass 100%.
- [x] **Bước 5.3: Cập nhật Thư Viện JD (`/jd-library`)**
  - [x] Cập nhật giao diện thẻ JD đã lưu trong `app/(candidate)/jd-library/page.tsx`:
    - Hiển thị Huy hiệu Cấp bậc SFIA mục tiêu (`Badge variant="brand"`: `SFIA Level {targetSfiaLevel}`) kèm icon `Award`.
    - Hiển thị Huy hiệu Chức danh chuẩn O*NET (`Badge variant="outline"`: `{onetOccupationTitle} ({onetSocCode})`) kèm icon `Sparkles`.
    - Hiển thị nhãn Level chuẩn hóa từ `getJdLevelLabel(item.level)` cạnh chức danh công ty.
  - [x] Tạo mới bộ Unit Test hoàn chỉnh `app/(candidate)/jd-library/page.test.tsx` (6/6 tests pass) kiểm thử trạng thái loading, lỗi API, danh sách trống, hiển thị badges SFIA/O*NET và điều hướng khi click/Enter vào setup.
  - [x] Typecheck `npm run typecheck` đạt 0 errors (TypeScript sạch sẽ).
- [x] **Bước 5.4: Chạy Kiểm Thử Toàn Diện & Typecheck (Next.js Build + Backend Tests)**
  - [x] **Client Typecheck (`npm run typecheck`):** 0 errors, TypeScript strictly typed.
  - [x] **Client Unit Test Suite (`npm run test:unit`):** 144/144 test files pass (504/504 tests pass 100%, bao gồm toàn bộ unit tests và Storybook Chromium test-runner).
  - [x] **Client Production Build (`npm run build`):** Biên dịch Next.js 16.2.6 (Turbopack) thành công 100%, tạo static/dynamic routes sạch sẽ.
  - [x] **Backend Architecture Tests (`npm run test:arch`):** 3/3 architectural boundary rules pass.
  - [x] **Backend Test Suite (`npm test`):** 74/74 test suites pass (590/590 tests pass 100%).
  - [x] **Backend Production Build (`npm run build`):** Prisma Client generate và NestJS build hoàn tất 100% không lỗi.
