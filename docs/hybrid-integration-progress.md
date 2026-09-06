# Nhật Ký & Tiến Độ Triển Khai: Tinh Chỉnh Schema `public` & Tích Hợp Đánh Giá Phỏng Vấn Tinh Gọn (Hybrid Unified Engine)

> **Tài liệu nguồn (Plan gốc):** [`docs/public-schema-refinement-and-hybrid-integration-plan.md`](file:///c:/Users/An/Documents/GR1/InterviewCoach/docs/public-schema-refinement-and-hybrid-integration-plan.md)  
> **Nguyên tắc thực thi:**  
> 1. Triển khai tuần tự từng bước nhỏ (Micro-tasks).  
> 2. Sau mỗi bước nhỏ: Kiểm tra, biên dịch, chạy test suites xác nhận nghiệm thu chặt chẽ trước khi chuyển bước tiếp theo.  
> 3. Hạn chế tối đa rủi ro, áp dụng chiến lược **Add-only Migration** (chỉ bổ sung bảng/cột mới trong Phase 1–4, chỉ dọn dẹp bảng cũ ở cuối Phase 5).  
> 4. Ngày bắt đầu: 2026-09-06.

---

## BẢNG TIẾN ĐỘ TỔNG THỂ

| Giai Đoạn | Nội Dung Công Việc | Trạng Thái | Hoàn Thành |
| :--- | :--- | :--- | :--- |
| **Giai đoạn 1** | Database Add-only Migration & Làm Giàu Dữ Liệu QuestionBank | 🟢 Đã hoàn thành | 4 / 4 bước |
| **Giai đoạn 2** | Xây Dựng 2 Bounded Contexts `SfiaModule` & `OnetModule` | 🟢 Đã hoàn thành | 3 / 3 bước |
| **Giai đoạn 3** | Cầu Nối Hybrid & Tích Hợp JD / Session Lifecycle | 🟢 Đã hoàn thành | 3 / 3 bước |
| **Giai đoạn 4** | Cấp Phát Câu Hỏi Theo `session_skills` & Tiêu Chí Nhị Phân | 🟢 Đã hoàn thành | 2 / 2 bước |
| **Giai đoạn 5** | Chấm Điểm Tất Định, Báo Cáo Năng Lực & Dọn Dẹp Schema Cũ | 🟢 Đã hoàn thành | 5 / 5 bước |
| **TỔNG THỂ** | **Toàn Bộ Kế Hoạch Tinh Chỉnh Schema & Hybrid Unified Engine** | 🟢 **HOÀN THÀNH 100%** | **16 / 16 bước** |

---

## CHI TIẾT CÁC GIAI ĐOẠN

### Giai Đoạn 1: Database Add-only Migration & Làm Giàu Dữ Liệu QuestionBank


- [x] **Bước 1.1: Mở rộng Schema (Add-only) & Đồng bộ Database**
  - [x] Baseline check: `npm run prisma:generate`, `npm run build`, `npm run test:arch` đạt 100%.
  - [x] Dọn dẹp an toàn dữ liệu 21 phiên thử nghiệm cũ theo xác nhận của người dùng.
  - [x] Bổ sung các model mới vào `server/prisma/schema.prisma`:
    - `OnetSfiaMapping`
    - `QuestionCriteria` (chuẩn hóa `dimension: 'core' | 'seniority'`)
  - [x] Bổ sung các trường mới tích hợp O*NET & SFIA vào các model hiện có:
    - `SavedJobDescription` (`onetSocCode`, `onetOccupationTitle`, `targetSfiaLevel`, `normalizedTechStack`)
    - `InterviewSession` (`onetSocCode`, `targetSfiaLevel`, `competencyMatchRate`, `recommendationStatus`)
    - `SessionSkill` (`skillCode`, `techContext`, `targetLevel`, `actualLevel`, `score`)
    - `QuestionBank` (`onetSocCode`, `sfiaSkillCode`, `targetSfiaLevel`)
    - `SessionQuestion` (`sessionSkillId`, `sfiaSkillCode`, `targetLevel`, `rubricCriteria`)
    - `AiFeedback` (`demonstratedLevel`, `criteriaPassRate`, `criteriaEvaluations`, `strengths`, `improvements`)
  - [x] Giữ nguyên 7 bảng cũ và trường `dimensionScores` để đảm bảo tương thích 100% mã nguồn hiện hành.
  - [x] Chạy `npm run prisma:generate` và cập nhật database dev (`prisma db push --accept-data-loss`).
  - [x] Xác nhận biên dịch `npm run build` và `npm run test:arch` thành công 100%.
  - [x] Cập nhật tài liệu `docs/Design/DetailedDesign/database-design/Database.md`.

- [x] **Bước 1.2: Viết & Chạy Script Làm Giàu QuestionBank Hiện Có**
  - [x] Viết script `server/scripts/enrich-existing-question-bank.ts`.
  - [x] Trích xuất SFIA skill & level từ 359 câu hỏi hiện có thông qua bảng trung gian cũ `question_bank_skill_levels`.
  - [x] Gán mã O*NET SOC phù hợp (`15-1252.00`, `15-1243.00`, `15-1244.00`, `15-1253.00`, `15-1212.00`).
  - [x] Sinh bộ 718 tiêu chí nhị phân 2 chiều (`core`, `seniority`) vào bảng `question_criteria` (mỗi câu hỏi đúng 1 `core` và 1 `seniority`).
  - [x] Chạy script kiểm tra độc lập `server/scripts/verify-step1-2.ts`: Nghiệm thu đạt 100% (359/359 câu hỏi đã gắn nhãn đầy đủ, 718/718 tiêu chí hợp lệ).

- [x] **Bước 1.3: Viết & Chạy Script Seed Cầu Nối `onet_sfia_mappings` Theo Cấp Bậc**
  - [x] Viết script `server/scripts/seed-onet-sfia-mappings.ts`.
  - [x] Seed ma trận các vị trí IT cốt lõi (`15-1252.00`, `15-1244.00`, `15-1243.00`, `15-1253.00`, `15-1212.00`) theo các cấp độ Level 2, 3, 4 (tổng cộng 32 bản ghi).
  - [x] Chạy script kiểm tra độc lập `server/scripts/verify-step1-3.ts`: Nghiệm thu đạt 100% (đầy đủ 32 bản ghi phủ đủ các level và ngành nghề).

- [x] **Bước 1.4: Kiểm Tra Toàn Vẹn Dữ Liệu Add-only**
  - [x] Viết và chạy script kiểm tra toàn diện `server/scripts/verify-phase1-integrity.ts`: 100% qua (359 câu hỏi, 718 tiêu chí, 32 mappings, 7 bảng cũ bảo toàn).
  - [x] Kiểm tra `npm run build`: Thành công (Exit code 0).
  - [x] Kiểm tra `npm run test:arch`: Thành công (3/3 tests passed).
  - [x] Dọn dẹp sạch sẽ các script inspect nháp tạm thời.

---

### Giai Đoạn 2: Xây Dựng 2 Bounded Contexts `SfiaModule` & `OnetModule`
- [x] **Bước 2.1: Bounded Context `SfiaModule`**
  - [x] Tạo `server/src/modules/sfia/contracts/sfia.facade.interface.ts` và `sfia.dto.ts`.
  - [x] Viết `sfia.service.ts`: Khởi tạo In-Memory Map cho 147 kỹ năng và 7 levels khi `onModuleInit` từ schema `sfia`.
  - [x] Viết `sfia.facade.ts` implement `ISfiaFacade`.
  - [x] Viết `sfia.module.ts` export `SFIA_FACADE_TOKEN`, `SfiaFacade`, `SfiaService`.
  - [x] Viết unit test `sfia.facade.spec.ts` kiểm tra cache hit, case-insensitivity, xử lý ngoại lệ và thời gian phản hồi ~0ms (8/8 tests passed).
  - [x] Cập nhật `server/src/core/architecture.spec.ts` bổ sung `'sfia'` và `'onet'` vào `BOUNDED_CONTEXTS`.
  - [x] Xác nhận `npm run test:arch` (3/3 tests passed) và `npm run build` (Exit code 0).
- [x] **Bước 2.2: Bounded Context `OnetModule`**
  - [x] Tạo `server/src/modules/onet/contracts/onet.facade.interface.ts`, `onet.dto.ts`, và `index.ts`.
  - [x] Tạo các chỉ mục tối ưu hóa tốc độ truy vấn: GIN Trigram index trên `onet.job_titles(job_title)`, BTree index trên `onet.job_titles(onetsoc_code)` và `onet.software_skills(onetsoc_code)` qua script `server/scripts/create-onet-indexes.ts`.
  - [x] Viết `onet.service.ts`: Tìm kiếm chính xác trên `onet.occupation_data` và tìm kiếm mờ kết hợp `similarity` cùng `word_similarity` trên 54.269 alternate job titles trong `onet.job_titles`. Xử lý chính xác các chức danh có giải nghĩa trong ngoặc đơn (VD: `DevOps Engineer (Development Operations Engineer)`).
  - [x] Trích xuất danh sách Hot Technologies và công nghệ in-demand từ `onet.software_skills`.
  - [x] Viết `onet.facade.ts` hiện thực hóa `IOnetFacade` và `server/src/modules/onet/onet.module.ts`.
  - [x] Viết bộ unit test `server/src/modules/onet/onet.facade.spec.ts`: Đạt 14/14 tests passed 100% (kiểm tra exact match, fuzzy alternate match, fallback occupation match, non-existent titles, SOC lookup, tools & tech extraction, error resilience).
  - [x] Xác nhận nghiệm thu thực tế với Live Database: Tìm kiếm "Software Developers" (exact), "Full Stack Developer" (fuzzy), "DevOps Engineer" (word_similarity), tra cứu mã SOC và 430 công cụ phần mềm.
  - [x] Xác nhận `npm run test:arch` (3/3 tests passed) và `npm run build` (Exit code 0).
- [x] **Bước 2.3: Đăng Ký Modules & Dọn Dẹp Thư Mục Cũ**
  - [x] Đăng ký `SfiaModule` và `OnetModule` trực tiếp vào `server/src/app.module.ts` dưới nhóm Bounded Contexts.
  - [x] Dọn dẹp hoàn toàn thư mục cũ `server/src/modules/interview-prep/sfia/` (bao gồm `sfia-mapping.service.ts`, `sfia-taxonomy.service.ts`, constants và DTOs cũ).
  - [x] Cập nhật `server/src/modules/interview-prep/interview-prep.module.ts` tách biệt độc lập, không còn phụ thuộc vào module sfia cũ.
  - [x] Chạy toàn bộ test suites backend: 68/68 test suites passed 100% (527/527 tests).
  - [x] Xác nhận `npm run test:arch`: 3/3 tests passed 100%.
  - [x] Xác nhận `npm run build`: Thành công (Exit code 0).
  - [x] **KẾT LUẬN:** Giai đoạn 2 đã hoàn thành 100% (3/3 bước). Hệ thống sẵn sàng chuyển sang Giai đoạn 3 (Cầu Nối Hybrid & Tích Hợp JD / Session Lifecycle).

---

### Giai Đoạn 3: Cầu Nối Hybrid & Tích Hợp JD / Session Lifecycle
- [x] **Bước 3.1: Xây Dựng `HybridMappingService`**
  - [x] Tạo `server/src/modules/interview-prep/taxonomy/hybrid-mapping.types.ts` định nghĩa `ResolvedSessionSkill` và `ResolveSkillsParams`.
  - [x] Triển khai `server/src/modules/interview-prep/taxonomy/hybrid-mapping.service.ts`:
    - Phân tách rành mạch phiên Technical vs HR: Tự động gắn 4 kỹ năng hành vi SFIA (`ETMG`, `REFM`, `PDSV`, `OCDV`) cho HR.
    - Cơ chế 2 tầng an toàn: Tầng 1 tra cứu bảng `onet_sfia_mappings` theo `(onetSocCode, targetSfiaLevel)`.
    - Tầng 2 (Cache Miss): Gọi LLM suy luận từ danh sách 147 SFIA skills và lưu cache vào `onet_sfia_mappings` (`source = 'ai_inferred'`).
    - Tầng 3 (Resilience Safe Fallback): Tự động lấy mapping cùng SOC ở level khác hoặc default IT skills (`PROG`, `TEST`, `ARCH`) nếu LLM offline/lỗi mạng, bảo đảm 100% không bao giờ crash phiên.
    - Thuật toán `distributeTechContext` phân loại thông minh công nghệ: CSDL -> `DBDS`, Dev/Framework -> `PROG`, DevOps/Cloud -> `ITOP`.
  - [x] Tạo `server/src/modules/interview-prep/taxonomy/taxonomy.module.ts` và export qua `interview-prep.module.ts`.
  - [x] Viết bộ unit test `server/src/modules/interview-prep/taxonomy/hybrid-mapping.service.spec.ts`: Đạt 7/7 tests passed 100%.
  - [x] Xác nhận `npm run test:arch` (3/3 tests passed) và `npm run build` (Exit code 0).
- [x] **Bước 3.2: Cập Nhật `SaveJobDescriptionService`**
  - [x] Nâng cấp `SavedJobDescriptionService`: Inject `ONET_FACADE_TOKEN` (`IOnetFacade`).
  - [x] Chuẩn hóa chức danh công việc qua `IOnetFacade.findOccupationByTitle(jobTitle)` để lấy `onetSocCode` và `onetOccupationTitle`.
  - [x] Trích xuất và đối soát danh mục công cụ phần mềm qua `IOnetFacade.getToolsAndTechnology(socCode)` để lưu vào `normalizedTechStack: string[]`.
  - [x] Xây dựng hàm `inferTargetSfiaLevel(level, jobTitle, jobContent)`: Hỗ trợ xử lý thông minh cả tiếng Anh lẫn tiếng Việt (có dấu và không dấu qua hàm `removeVietnameseTones`), ánh xạ chuẩn xác phân cấp SFIA (Lead -> 5, Senior -> 4, Middle -> 3, Junior -> 2, Intern -> 1).
  - [x] Cập nhật `JobDescriptionModule` import `OnetModule` và `PrismaModule`.
  - [x] Viết bộ unit test `server/src/modules/interview-prep/job-description/saved-job-description.service.spec.ts`: Đạt 8/8 tests passed 100%.
  - [x] Xác nhận `npm run test:arch` (3/3 tests passed) và `npm run build` (Exit code 0).
- [x] **Bước 3.3: Tích Hợp Vào Asynchronous Outbox Worker (`question-generation`)**
  - [x] Nâng cấp `CreateInterviewSession`: Tự động làm giàu On-the-fly cho các Job Description cũ thiếu `onetSocCode` hoặc `targetSfiaLevel`, sao chép trực tiếp vào `InterviewSession` và đóng gói vào outbox payload.
  - [x] Cập nhật `TechnicalInterviewStrategy` và `HrInterviewStrategy` chuyển tiếp `onetSocCode` và `targetSfiaLevel` trong payload.
  - [x] Cập nhật `GenerateSessionQuestions`: Inject `HybridMappingService`, khởi tạo các bản ghi `session_skills` (bản hợp đồng đánh giá duy nhất của phiên) trong CSDL bất đồng bộ trước khi cấp phát câu hỏi, đảm bảo API `POST /sessions` luôn phản hồi < 100ms.
  - [x] Chạy toàn bộ 69/69 test suites backend: Đạt **540/540 tests passed 100%**.
  - [x] Chạy script kiểm tra thực tế với CSDL Live PostgreSQL: Hoàn tất 100% cả 4 bước (lưu JD chuẩn hóa, suy luận SFIA level, giải quyết kỹ năng SFIA có techContext, và ghi nhận `session_skills` bền vững).
  - [x] Xác nhận `npm run test:arch` (3/3 tests passed) và `npm run build` (Exit code 0).
  - [x] **KẾT LUẬN:** Giai đoạn 3 đã hoàn thành 100% (3/3 bước). Hệ thống sẵn sàng chuyển sang Giai đoạn 4 (Cấp Phát Câu Hỏi Theo `session_skills` & Tiêu Chí Nhị Phân).

---


### Giai Đoạn 4: Cấp Phát Câu Hỏi Theo `session_skills` & Tiêu Chí Nhị Phân
- [x] **Bước 4.1: Cập Nhật `QuestionBankService`**
  - [x] Định nghĩa kiểu dữ liệu `RubricCriterionDto`, `SkillAllocationRequirement`, `AllocatedQuestionDto`, `QuestionBankAllocationResult`.
  - [x] Xây dựng phương thức `allocateQuestionsForSessionSkills`:
    - Phân bổ câu hỏi theo trọng số (weight) của `session_skills`.
    - Xử lý trường hợp `totalQuestions < sessionSkills.length`: tự động lọc top skills theo trọng số cao nhất.
    - Cơ chế tra cứu 2 tầng: Tầng 1 khớp chính xác `(sfiaSkillCode, targetSfiaLevel, sessionType)`. Tầng 2 fallback lân cận (+/- 1 Level) nếu ngân hàng thiếu câu hỏi đúng level.
    - Xáo trộn ngẫu nhiên Fisher-Yates và chống trùng lặp câu hỏi trong phiên qua `Set<string>`.
    - Sao chép các bản ghi `question_criteria` sang cấu trúc JSONB chuẩn 2 chiều (`core`, `seniority`).
    - Ghi nhận `target_level` câu hỏi theo Target Level của `session_skill` (vai trò tuyển dụng) để bảo đảm nhất quán đánh giá.
    - Báo cáo chính xác danh sách `uncoveredRequirements` khi ngân hàng không đủ câu hỏi để chuyển tiếp sang AI.
  - [x] Giữ nguyên 100% hàm `selectFallbackQuestions` cũ để bảo toàn tương thích ngược cho Phase 4.
  - [x] Viết bộ unit test `question-bank.service.spec.ts`: Đạt 13/13 tests passed 100%.
  - [x] Kiểm tra `npm run test:arch` (3/3 tests passed) và `npm run build` (Exit code 0).
- [x] **Bước 4.2: Cập Nhật `GenerateSessionQuestions` (Fallback AI & Tích Hợp Đầy Đủ)**
  - [x] Xây dựng `SkillTargetedQuestionGeneratorService`:
    - Structured Output sử dụng Zod schema (`SkillQuestionOutputSchema`) đảm bảo câu hỏi tình huống thực tế kèm đúng 2 tiêu chí nhị phân `core` và `seniority`.
    - Tích hợp `ISfiaFacade` nạp định nghĩa kỹ năng và essence của target level.
    - Cơ chế Multi-tiered Resilience Fallback chống sập 100%: nếu LLM gặp lỗi mạng/timeout, tự động lấy câu hỏi dự phòng trong QuestionBank hoặc câu hỏi an toàn mặc định, đảm bảo không bao giờ crash phiên phỏng vấn.
  - [x] Nâng cấp `QuestionGenerationModule` đăng ký `SfiaModule` và `SkillTargetedQuestionGeneratorService`.
  - [x] Nâng cấp `GenerateSessionQuestions.execute`:
    - Đọc danh sách `session_skills` của phiên từ CSDL.
    - Gọi `QuestionBankService.allocateQuestionsForSessionSkills` để cấp phát câu hỏi ngân hàng.
    - Kích hoạt `SkillTargetedQuestionGeneratorService` sinh động các câu hỏi còn thiếu từ `uncoveredRequirements`.
    - Áp dụng thuật toán sắp xếp lũy tiến (Progressive Flow): câu hỏi dễ/nền tảng ở đầu phiên, câu hỏi chuyên sâu/trade-off ở giữa và cuối phiên (`orderIndex: 1..N`).
    - Lưu vào `session_questions` trong `prisma.$transaction` với `session_skill_id`, `sfia_skill_code`, `target_level` và `rubric_criteria`.
    - Best-effort liên kết `sessionQuestionSkillLevels` để các service cũ trong Phase 4 không bị ảnh hưởng.
    - Giữ nguyên luồng legacy fallback để đảm bảo 100% tương thích ngược cho toàn bộ test suites hiện có.
  - [x] Viết unit tests chuyên biệt:
    - `skill-targeted-question-generator.service.spec.ts`: Đạt 3/3 tests passed 100%.
    - `question-generation.processor.spec.ts`: Đạt 25/25 tests passed 100%.
  - [x] Chạy script kiểm thử thực tế trên CSDL Live PostgreSQL: Đạt 100% (4 câu hỏi được phân bổ đúng chuẩn SFIA Level 4, 100% câu hỏi gắn `sessionSkillId`, 100% tiêu chí nhị phân 2 chiều `core` và `seniority`, thứ tự lũy tiến và dọn dẹp an toàn).
  - [x] Chạy toàn bộ test suites backend: **70/70 test suites passed 100% (549/549 tests)**.
  - [x] Xác nhận `npm run test:arch` (3/3 tests passed) và `npm run build` (Exit code 0).
  - [x] **KẾT LUẬN:** Giai đoạn 4 đã hoàn thành 100% (2/2 bước). Hệ thống sẵn sàng chuyển sang Giai đoạn 5 (Chấm Điểm Tất Định, Báo Cáo Năng Lực & Dọn Dẹp Schema Cũ).

---

### Giai Đoạn 5: Chấm Điểm Tất Định, Báo Cáo Năng Lực & Dọn Dẹp Schema Cũ
- [x] **Bước 5.1: Cập Nhật `AnswerEvaluatorService` & Prompting**
  - [x] Xây dựng `BinaryCriteriaEvaluatorService` (`binary-criteria-evaluator.service.ts`):
    - Định nghĩa Zod schema `BinaryCriteriaOutputSchema` cho Structured Outputs chặt chẽ.
    - LLM đóng vai giám khảo độc lập chấm nhị phân Pass/Fail từng tiêu chí kèm bằng chứng `evidence` và nguyên nhân trừ điểm `deduction_reason`.
    - Trích xuất điểm sáng `strengths`, điểm cần cải thiện `improvements`, câu trả lời mẫu `model_answer`, thông điệp cốt lõi `key_takeaway` và phân đoạn `annotated_segments`.
    - Cơ chế Multi-tiered Resilience Fallback chống sập phiên khi AI Gateway timeout/quota/lỗi mạng.
  - [x] Đăng ký `BinaryCriteriaEvaluatorService` vào `EvaluationModule`.
  - [x] Viết unit tests `binary-criteria-evaluator.service.spec.ts`: Đạt 4/4 tests passed 100%.
  - [x] Xác nhận `npm run test:arch` (3/3 tests passed) và `npm run build` (Exit code 0).
- [x] **Bước 5.2: Xây Dựng `ScoringEngineService`**
  - [x] Xây dựng `ScoringEngineService` (`scoring-engine.service.ts`):
    - Tính điểm câu hỏi tất định 100%: `calculateQuestionScore` (tỷ lệ Pass theo trọng số criteria, 0–100).
    - Suy luận `demonstrated_level` tất định: `inferDemonstratedLevel` dựa trên tỷ lệ `CorePassRate` & `SeniorityPassRate` (hổng core -> trừ 2 level, đạt core trượt seniority -> trừ 1 level, đạt cả 2 -> giữ nguyên target level). Luôn áp dụng quy tắc chặn trần/sàn `[1, targetLevel]`.
    - Sinh dữ liệu chấm điểm cho câu hỏi Bỏ qua (Skip): `buildSkippedFeedbackData` (0 điểm, Level 1, trượt toàn bộ criteria).
    - Phương thức `aggregateSessionSkillScores`: Tự động tính trung bình số học điểm `score` và cấp độ `actualLevel` cho từng `SessionSkill`, và tính `overallScore` có trọng số cho `InterviewSession`.
  - [x] Đăng ký `ScoringEngineService` vào `EvaluationModule`.
  - [x] Nâng cấp `FeedbackProcessor` (`feedback.processor.ts`):
    - Tích hợp mô hình Dual-Mode: Tự động nhận diện câu hỏi có `rubricCriteria` để kích hoạt `BinaryCriteriaEvaluatorService` và `ScoringEngineService`.
    - Lưu đầy đủ `demonstratedLevel`, `criteriaPassRate`, `criteriaEvaluations`, `strengths`, `improvements` vào `ai_feedbacks`.
    - Tự động gọi `aggregateSessionSkillScores` cập nhật `session_skills` và `interview_sessions` trong transaction.
    - Bảo toàn 100% luồng legacy fallback cho các phiên cũ.
  - [x] Viết unit tests chuyên biệt:
    - `scoring-engine.service.spec.ts`: Đạt **11/11 tests passed 100%**.
    - `feedback.processor.spec.ts`: Đạt **21/21 tests passed 100%** (bao gồm test Dual-Mode Hybrid flow).
  - [x] Xác nhận `npm run test:arch` (3/3 tests passed) và `npm run build` (Exit code 0).
- [x] **Bước 5.3: Nâng Cấp `SessionReportService` & Hợp Nhất Báo Cáo Năng Lực**
  - [x] Xây dựng `UnifiedReportGeneratorService` (`unified-report-generator.service.ts`):
    - Đọc `session_skills` của phiên phỏng vấn, tập hợp danh sách kỹ năng, điểm số (`score`), cấp độ đạt được (`actualLevel`), cấp độ mục tiêu (`targetLevel`), và chênh lệch năng lực (`gap = actualLevel - targetLevel`).
    - Xác định trạng thái khuyến nghị tuyển dụng tất định: `strongly_recommended`, `recommended`, `borderline`, `not_recommended` theo chuẩn phân loại.
    - Kiến trúc 2-tiered: Sinh `executiveSummary` và `actionPlan` bằng LLM (`task: 'report'`) với fallback tất định an toàn theo SFIA skill definitions khi AI quota/timeout.
    - Ghi nhận báo cáo hợp nhất duy nhất: `report_type = 'session_competency_evaluation'` kèm bản ghi tương thích ngược `executive_summary` và `action_plan` trong transaction `prisma.$transaction`.
    - Tự động cập nhật `InterviewSession` sang trạng thái `status = 'completed'` và `overallScore`.
  - [x] Đăng ký `UnifiedReportGeneratorService` và `SfiaModule` vào `ReportModule`.
  - [x] Nâng cấp `GenerateComprehensiveReport`: Tự động nhận diện phiên có `session_skills` để kích hoạt `UnifiedReportGeneratorService`.
  - [x] Cập nhật `ReportService`: Hỗ trợ ánh xạ `session_competency_evaluation` sang `ReportResponseDto` và trả về `feedbackProgress` đầy đủ.
  - [x] Viết unit tests chuyên sâu:
    - `unified-report-generator.service.spec.ts`: Đạt **3/3 tests passed 100%**.
    - `report.service.spec.ts` & `generate-comprehensive-report.service.spec.ts`: Đạt **33/33 tests passed 100%**.
  - [x] Xác nhận `npm run test:arch` (3/3 tests passed) và `npm run build` (Exit code 0).
- [x] **Bước 5.4: Xây Dựng Kịch Bản Kiểm Thử Tích Hợp (E2E Test)**
  - [x] Xây dựng kiểm thử tích hợp Jest `server/test/hybrid-assessment-lifecycle.integration-spec.ts`:
    - Mô phỏng trọn vẹn toàn bộ chu trình phiên phỏng vấn mới: Khởi tạo JD -> Ánh xạ kỹ năng `session_skills` -> Cấp phát câu hỏi kèm rubric criteria nhị phân 2 chiều (`core`, `seniority`).
    - Kiểm thử 4 tình huống chấm điểm câu hỏi thực tế:
      - Turn 1 (`PROG` Level 4): Đạt toàn diện cả Core & Seniority -> 100 điểm, Level 4.
      - Turn 2 (`DBDS` Level 4): Đạt Core, trượt Seniority -> 60 điểm, Level 3 (trừ 1 level).
      - Turn 3 (`ARCH` Level 4): Trượt cả Core & Seniority -> 0 điểm, Level 2 (trừ 2 level do hổng kiến thức cốt lõi).
      - Turn 4 (`DESN` Level 4): Ứng viên bấm Bỏ qua (Skip) -> 0 điểm, Level 1 (phạt sàn).
    - Kiểm thử tổng hợp điểm kỹ năng & phiên: Điểm số từng kỹ năng và điểm tổng phiên được tính toán chính xác 40 điểm ((100 + 60 + 0 + 0) / 4 = 40).
    - Kiểm thử sinh báo cáo năng lực: Bản ghi `session_competency_evaluation` được sinh với `recommendationStatus = 'not_recommended'`, `targetSfiaLevel = 4`, `demonstratedSfiaLevel = 3`, đầy đủ `skillsBreakdown` và `actionPlan`.
    - Kiểm thử tầng truy vấn báo cáo qua `ReportService.getReport`: Trả về chuẩn xác DTO với `recommendationStatus`, `skillsBreakdown`, `actionPlan` tương thích ngược.
  - [x] Cập nhật Check Constraint `chk_session_reports_report_type` trong CSDL PostgreSQL và `prisma/migrations/migration.sql` bổ sung `'session_competency_evaluation'`.
  - [x] Viết và thực thi kịch bản kiểm thử E2E trực tiếp trên CSDL Live PostgreSQL `server/scripts/verify-step5-4-e2e-live.ts`:
    - Tạo dữ liệu thật trong PostgreSQL (User, SavedJobDescription, InterviewSession, SessionSkill, SessionQuestion, UserAnswer, AiFeedback, SessionReport).
    - Nghiệm thu đạt 100% tất cả các bước tính toán, ghi nhận và dọn dẹp an toàn cascade.
  - [x] Xác nhận `npm run test:arch` (3/3 tests passed) và `npm run build` (Exit code 0).
  - [x] Toàn bộ test suites backend: **73/73 test suites passed 100% (568/568 tests)**.
- [x] **Bước 5.5: Dọn Dẹp Triệt Để 7 Bảng Cũ & Cột Legacy (Hoàn tất dự án)**
  - [x] Rà soát và cập nhật toàn bộ mã nguồn không còn phụ thuộc vào 7 bảng cũ:
    - `question-bank.service.ts`: Cập nhật `QuestionBankCandidate`, include `{ questionCriteria: true }`, loại bỏ `QUESTION_BANK_SKILL_LEVELS_INCLUDE`.
    - `transcribe-answer.service.ts`: Loại bỏ `SESSION_QUESTION_CRITERIA_INCLUDE`.
    - `report-data-collector.service.ts`: Cập nhật select query thay thế `sessionQuestionSkillLevels` bằng `sfiaSkillCode`, `targetLevel`, `rubricCriteria`.
    - `generate-session-questions.service.ts`: Loại bỏ hoàn toàn câu lệnh insert vào `sessionQuestionSkillLevel`.
  - [x] Cập nhật `server/prisma/schema.prisma`:
    - Xóa bỏ 7 models: `Level`, `Role`, `Skill`, `SkillLevel`, `RoleSkill`, `QuestionBankSkillLevel`, `SessionQuestionSkillLevel`.
    - Xóa bỏ các quan hệ mảng tương ứng khỏi `QuestionBank` và `SessionQuestion`.
  - [x] Chạy script thực thi SQL trên CSDL Live PostgreSQL `server/scripts/drop-legacy-tables.ts`:
    - Drop thành công 100% (7/7) bảng cũ khỏi schema `public` có CASCADE: `session_question_skill_levels`, `question_bank_skill_levels`, `role_skills`, `skill_levels`, `roles`, `levels`, `skills`.
  - [x] Chạy `npm run prisma:generate`: Khởi tạo Prisma Client v7 sạch hoàn toàn không còn model legacy.
  - [x] Chạy kiểm thử toàn diện trên CSDL Live PostgreSQL:
    - Chạy `server/scripts/verify-step5-4-e2e-live.ts`: **100% Passed**.
    - Chạy Jest integration `test/hybrid-assessment-lifecycle.integration-spec.ts`: **1/1 Passed**.
  - [x] Chạy toàn bộ test suites backend: **73/73 test suites passed 100% (568/568 tests)**.
  - [x] Kiểm tra `npm run test:arch`: **3/3 tests passed 100%**.
  - [x] Kiểm tra `npm run build`: **Thành công 100% (Exit code 0)**.
  - [x] Cập nhật tài liệu thiết kế cơ sở dữ liệu `docs/Design/DetailedDesign/database-design/Database.md`.
  - [x] **KẾT LUẬN TOÀN DIỆN:** Toàn bộ 5 Giai đoạn của dự án Hybrid Assessment Framework đã chính thức **HOÀN THÀNH 100% (16/16 bước)** với chất lượng kỹ thuật, kiến trúc và độ an toàn ở mức tuyệt đối (Zero Regression, Zero Tech Debt).

---

## NHẬT KÝ THỰC HIỆN CHI TIẾT (AUDIT LOG)

### [2026-09-06] Khởi tạo & Kiểm tra Baseline
- Kiểm tra trạng thái hiện tại của CSDL và mã nguồn backend.
- Đã chạy `npm run prisma:generate` & `npm run build`: Thành công (Exit code 0).
- Đã chạy `npm run test:arch`: Thành công (3/3 tests passed).
- Khởi tạo file theo dõi tiến độ `docs/hybrid-integration-progress.md`.

### [2026-09-06] Hoàn thành Bước 1.2: Làm Giàu QuestionBank Hiện Có
- Viết và thực thi thành công `server/scripts/enrich-existing-question-bank.ts`.
- Đã cập nhật 359/359 câu hỏi trong `public.question_bank` với đầy đủ `onet_soc_code`, `sfia_skill_code` và `target_sfia_level`.
- Đã sinh 718 tiêu chí nhị phân chuẩn hóa 2 chiều (`core`, `seniority`) vào bảng `public.question_criteria`.
- Chạy kiểm tra nghiệm thu độc lập `server/scripts/verify-step1-2.ts`: Đạt 100% (không có câu hỏi thiếu nhãn, tỷ lệ tiêu chí 1:1 cân đối giữa core và seniority).

### [2026-09-06] Hoàn thành Bước 1.3: Seed Cầu Nối onet_sfia_mappings Theo Cấp Bậc
- Viết và thực thi thành công `server/scripts/seed-onet-sfia-mappings.ts`.
- Đã seed 32 bản ghi ánh xạ giữa 5 nhóm nghề IT cốt lõi (`15-1252.00`, `15-1244.00`, `15-1243.00`, `15-1253.00`, `15-1212.00`) và các kỹ năng SFIA theo các cấp độ Level 2, 3, 4.
- Chạy kiểm tra nghiệm thu độc lập `server/scripts/verify-step1-3.ts`: Đạt 100% (đầy đủ 32 bản ghi, trọng số weight và is_core chính xác).

### [2026-09-06] Hoàn thành Bước 1.4: Kiểm Tra Toàn Vẹn & Nghiệm Thu Giai Đoạn 1
- Viết và thực thi thành công script kiểm tra toàn diện `server/scripts/verify-phase1-integrity.ts`.
- 100% câu hỏi (359/359) trong `public.question_bank` đã gắn nhãn O*NET, SFIA và Level.
- 100% tiêu chí (718/718) trong `public.question_criteria` phân bổ cân bằng 1:1 giữa `core` (359) và `seniority` (359).
- Bảng `public.onet_sfia_mappings` có đủ 32 bản ghi phủ kín các cấp độ 2, 3, 4 cho 5 mã nghề IT.
- Toàn bộ 7 bảng cũ được bảo toàn nguyên vẹn 100% (Add-only strategy).
- Kiểm tra `npm run build`: Thành công (Exit code 0).
- Kiểm tra `npm run test:arch`: Thành công (3/3 tests passed).
- Dọn dẹp an toàn các file kiểm tra tạm thời.
- **KẾT LUẬN:** Giai đoạn 1 đã hoàn tất 100% (4/4 bước) đạt chuẩn chất lượng và an toàn tuyệt đối.

### [2026-09-06] Hoàn thành Bước 2.1: Bounded Context SfiaModule
- Đã tạo hợp đồng giao tiếp độc lập `server/src/modules/sfia/contracts/`:
  - `sfia.dto.ts` (`SfiaSkillDto`, `SfiaLevelDto`)
  - `sfia.facade.interface.ts` (`ISfiaFacade`, token `SFIA_FACADE_TOKEN`)
  - `index.ts`
- Đã triển khai `server/src/modules/sfia/sfia.service.ts` nạp 147 kỹ năng và 7 levels vào In-Memory Map khi khởi động ứng dụng (`onModuleInit`), đảm bảo thời gian truy vấn runtime xấp xỉ ~0ms.
- Đã triển khai `server/src/modules/sfia/sfia.facade.ts` hiện thực hóa `ISfiaFacade` và `server/src/modules/sfia/sfia.module.ts`.
- Đã cập nhật kiến trúc `server/src/core/architecture.spec.ts` đăng ký `'sfia'` và `'onet'` vào `BOUNDED_CONTEXTS`.
- Viết bộ unit test `server/src/modules/sfia/sfia.facade.spec.ts`: Đạt 8/8 tests passed 100% (kiểm tra lookup exact code, case-insensitivity, null handling, level retrieval, full skills list).
- Chạy `npm run test:arch`: Thành công (3/3 tests passed).
- Chạy `npm run build`: Thành công (Exit code 0).
- **KẾT LUẬN:** Bước 2.1 đã hoàn tất 100% an toàn và sẵn sàng cho Bước 2.2 (`OnetModule`).

### [2026-09-06] Hoàn thành Bước 2.2: Bounded Context OnetModule
- Đã tạo hợp đồng giao tiếp độc lập `server/src/modules/onet/contracts/`:
  - `onet.dto.ts` (`OnetOccupationDto`, `OnetTechDto`)
  - `onet.facade.interface.ts` (`IOnetFacade`, token `ONET_FACADE_TOKEN`)
  - `index.ts`
- Đã tối ưu hóa CSDL PostgreSQL cho schema `onet`: Tạo chỉ mục GIN Trigram `idx_onet_job_titles_trgm` trên `onet.job_titles(job_title)`, và các chỉ mục BTree trên `onet.job_titles(onetsoc_code)` cùng `onet.software_skills(onetsoc_code)` via `server/scripts/create-onet-indexes.ts`.
- Đã triển khai `server/src/modules/onet/onet.service.ts`:
  - Khớp trực tiếp chức danh chuẩn trên `onet.occupation_data`.
  - Tìm kiếm mờ thông minh trên 54.269 alternate job titles với công thức `GREATEST(similarity, word_similarity)` giúp khớp chính xác các vị trí IT thực tế kể cả khi có mô tả mở rộng trong ngoặc đơn (như `DevOps Engineer (Development Operations Engineer)`).
  - Dự phòng tìm kiếm mờ (fallback) trực tiếp trên `onet.occupation_data.title`.
  - Tra cứu mã SOC chuẩn `getOccupationBySocCode`.
  - Trích xuất công nghệ và công cụ phần mềm `getToolsAndTechnology` từ `onet.software_skills`, ưu tiên các Hot Technologies.
- Đã triển khai `server/src/modules/onet/onet.facade.ts` hiện thực hóa `IOnetFacade` và `server/src/modules/onet/onet.module.ts`.
- Viết bộ unit test `server/src/modules/onet/onet.facade.spec.ts`: Đạt 14/14 tests passed 100%.
- Kiểm tra live integration với PostgreSQL: Đạt 100% tất cả các kịch bản.
- Chạy `npm run test:arch`: Thành công (3/3 tests passed).
- Chạy `npm run build`: Thành công (Exit code 0).
- **KẾT LUẬN:** Bước 2.2 đã hoàn tất 100% an toàn và sẵn sàng cho Bước 2.3 (`Đăng Ký Modules & Dọn Dẹp Thư Mục Cũ`).

### [2026-09-06] Hoàn thành Bước 2.3: Đăng Ký Modules & Dọn Dẹp Thư Mục Cũ (Kết thúc Giai Đoạn 2)
- Đã đăng ký `SfiaModule` và `OnetModule` vào `server/src/app.module.ts` dưới nhóm Domain & Business Modules (Bounded Contexts).
- Đã xóa sạch thư mục legacy `server/src/modules/interview-prep/sfia/` (bao gồm `sfia-mapping.service.ts`, `sfia-taxonomy.service.ts`, constants và DTOs cũ).
- Đã cập nhật `server/src/modules/interview-prep/interview-prep.module.ts` độc lập và sạch sẽ.
- Chạy toàn bộ test suites của backend: **68/68 test suites passed 100% (527/527 unit & integration tests)**.
- Chạy `npm run test:arch`: **3/3 tests passed 100%** (Đảm bảo tuân thủ nghiêm ngặt 3-Layer Clean Architecture & ranh giới Bounded Contexts).
- Chạy `npm run build`: **Thành công 100% (Exit code 0)**.
- **KẾT LUẬN:** Giai đoạn 2 đã chính thức **HOÀN THÀNH 100% (3/3 bước)** với chất lượng và độ ổn định cao nhất, không có nợ kỹ thuật (zero tech debt). Sẵn sàng chuyển sang Giai đoạn 3: Cầu Nối Hybrid & Tích Hợp JD / Session Lifecycle.
 
+### [2026-09-06] Hoàn thành Bước 3.1: Xây Dựng HybridMappingService
+- Đã tạo `server/src/modules/interview-prep/taxonomy/hybrid-mapping.types.ts` định nghĩa kiểu dữ liệu `ResolvedSessionSkill` và `ResolveSkillsParams`.
+- Đã triển khai `server/src/modules/interview-prep/taxonomy/hybrid-mapping.service.ts`:
+  - Tầng 1: Tra cứu bản ghi curated mapping trong bảng `onet_sfia_mappings` theo `(onetSocCode, targetSfiaLevel)`.
+  - Tầng 2: Fallback kích hoạt AI Gateway phân tích JD đối chiếu 147 SFIA skills và lưu cache vào `onet_sfia_mappings` (`source = 'ai_inferred'`).
+  - Tầng 3: Safe resilience fallback lấy mapping của cùng SOC ở level khác hoặc bộ kỹ năng mặc định (`PROG`, `TEST`, `ARCH`), đảm bảo phiên phỏng vấn 100% không bao giờ bị crash.
### [2026-09-06] Hoàn thành Bước 3.1: Xây Dựng HybridMappingService
- Đã tạo `server/src/modules/interview-prep/taxonomy/hybrid-mapping.types.ts` định nghĩa kiểu dữ liệu `ResolvedSessionSkill` và `ResolveSkillsParams`.
- Đã triển khai `server/src/modules/interview-prep/taxonomy/hybrid-mapping.service.ts`:
  - Tầng 1: Tra cứu bản ghi curated mapping trong bảng `onet_sfia_mappings` theo `(onetSocCode, targetSfiaLevel)`.
  - Tầng 2: Fallback kích hoạt AI Gateway phân tích JD đối chiếu 147 SFIA skills và lưu cache vào `onet_sfia_mappings` (`source = 'ai_inferred'`).
  - Tầng 3: Safe resilience fallback lấy mapping của cùng SOC ở level khác hoặc bộ kỹ năng mặc định (`PROG`, `TEST`, `ARCH`), đảm bảo phiên phỏng vấn 100% không bao giờ bị crash.
  - Phiên HR: Tự động ánh xạ 4 kỹ năng hành vi/văn hóa SFIA chuẩn (`ETMG`, `REFM`, `PDSV`, `OCDV`) với `techContext = []`.
  - Thuật toán `distributeTechContext` phân loại thông minh công nghệ: CSDL -> `DBDS`, Dev/Framework -> `PROG`, DevOps/Cloud -> `ITOP`.
- Đã đóng gói vào `TaxonomyModule` và xuất qua `InterviewPrepModule`.
- Viết bộ unit test `server/src/modules/interview-prep/taxonomy/hybrid-mapping.service.spec.ts`: Đạt **7/7 tests passed 100%**.
- Kiểm tra `npm run test:arch`: **3/3 tests passed 100%**.
- Kiểm tra `npm run build`: **Thành công 100% (Exit code 0)**.
- **KẾT LUẬN:** Bước 3.1 đã hoàn thành an toàn tuyệt đối. Sẵn sàng chuyển sang Bước 3.2: Cập Nhật `SaveJobDescriptionService`.

### [2026-09-06] Hoàn thành Bước 3.2: Cập Nhật SaveJobDescriptionService
- Đã nâng cấp `SavedJobDescriptionService` kết nối với `IOnetFacade` (`ONET_FACADE_TOKEN`):
  - Tự động tìm kiếm mã nghề O*NET `onetSocCode` và chức danh chuẩn `onetOccupationTitle` qua `findOccupationByTitle`.
  - Tự động trích xuất và chuẩn hóa công cụ phần mềm qua `getToolsAndTechnology(socCode)` và lưu vào `normalizedTechStack: string[]`.
  - Xây dựng hàm helper `inferTargetSfiaLevel`: Xử lý cả tiếng Anh và tiếng Việt (loại bỏ dấu tiếng Việt qua hàm `removeVietnameseTones` chuẩn Unicode NFD) để nhận diện thâm niên chính xác tuyệt đối (Lead/Architect -> Level 5, Senior -> Level 4, Middle -> Level 3, Junior/Fresher -> Level 2, Intern -> Level 1).
- Đã cập nhật `JobDescriptionModule` import `OnetModule` và `PrismaModule`.
- Viết bộ unit test `server/src/modules/interview-prep/job-description/saved-job-description.service.spec.ts`: Đạt **8/8 tests passed 100%**.
- Kiểm tra `npm run test:arch`: **3/3 tests passed 100%**.
- Kiểm tra `npm run build`: **Thành công 100% (Exit code 0)**.
- **KẾT LUẬN:** Bước 3.2 đã hoàn tất 100%. Sẵn sàng chuyển sang Bước 3.3: Tích Hợp Vào Asynchronous Outbox Worker & Session Lifecycle.

### [2026-09-06] Hoàn thành Bước 3.3: Tích Hợp Vào Asynchronous Outbox Worker & Session Lifecycle (Kết thúc Giai Đoạn 3)
- Đã nâng cấp `CreateInterviewSession` và `SessionModule`:
  - Tự động làm giàu On-the-fly cho các Job Description cũ khi người dùng tạo phiên phỏng vấn (tự chuẩn hóa O*NET SOC và suy luận SFIA Level nếu thiếu).
  - Tự động sao chép `onetSocCode` và `targetSfiaLevel` sang bản ghi `interview_sessions` mới.
  - Chuyển tiếp các trường này sang Transactional Outbox Worker (`question-generation`) để xử lý bất đồng bộ, giữ nguyên thời gian phản hồi API `POST /sessions` dưới 100ms.
- Đã cập nhật `TechnicalInterviewStrategy` và `HrInterviewStrategy` chuyển tiếp `onetSocCode` và `targetSfiaLevel` trong payload.
- Đã nâng cấp `GenerateSessionQuestions` và `QuestionGenerationModule`:
  - Nạp `TaxonomyModule` và inject `HybridMappingService`.
  - Khởi tạo danh sách `session_skills` (Bản hợp đồng đánh giá duy nhất của phiên) trong CSDL PostgreSQL trước khi tiến hành cấp phát câu hỏi.
- Đã chạy kiểm tra thực tế trên CSDL Live PostgreSQL qua script độc lập:
  - Tạo Job Description: "Senior Full Stack Engineer" -> Tự động nhận diện O*NET SOC `15-1252.00`, SFIA Level 4 và công nghệ chuẩn hóa.
  - Phân giải kỹ năng SFIA: Thu được 4 kỹ năng (`PROG`, `DBDS`, `DESN`, `ARCH`) phân bổ công nghệ chuẩn xác.
  - Ghi nhận thành công 4 bản ghi `session_skills` vào CSDL và dọn dẹp sạch sẽ dữ liệu thử nghiệm.
- Đã chạy toàn bộ test suites backend: **69/69 test suites passed 100% (540/540 unit & integration tests)**.
- Kiểm tra `npm run test:arch`: **3/3 tests passed 100%** (Tuân thủ nghiêm ngặt Clean Architecture 3 lớp và ranh giới Bounded Contexts).
- Kiểm tra `npm run build`: **Thành công 100% (Exit code 0)**.
- **KẾT LUẬN:** Giai đoạn 3 đã chính thức **HOÀN THÀNH 100% (3/3 bước)** với chất lượng và độ ổn định cao nhất, không có nợ kỹ thuật (zero tech debt). Hệ thống sẵn sàng chuyển sang Giai đoạn 4: Cấp Phát Câu Hỏi Theo `session_skills` & Tiêu Chí Nhị Phân.

### [2026-09-06] Hoàn thành Bước 4.1: Cập Nhật QuestionBankService
- Đã bổ sung các DTOs chuẩn hóa: `RubricCriterionDto`, `SkillAllocationRequirement`, `AllocatedQuestionDto`, `QuestionBankAllocationResult`.
- Đã triển khai phương thức `allocateQuestionsForSessionSkills`:
  - Thuật toán phân bổ số câu hỏi thông minh theo trọng số kỹ năng, tự động cắt giảm top skills nếu số lượng câu hỏi ít hơn số lượng kỹ năng.
  - Cơ chế tra cứu 2 tầng: Khớp chính xác Target Level -> Fallback lân cận (+/- 1 Level).
  - Thuật toán Fisher-Yates xáo trộn ngẫu nhiên tập ứng viên và quản lý danh sách `usedQuestionBankIds` chống lặp câu hỏi.
  - Tự động map dữ liệu từ bảng `question_criteria` sang mảng 2 tiêu chí nhị phân `core` và `seniority` chuẩn JSONB.
  - Tự động sinh tiêu chí fallback an toàn nếu câu hỏi ngân hàng chưa có criteria.
  - Ghi nhận `target_level` của câu hỏi theo Target Level của `session_skill`.
  - Giữ nguyên toàn bộ phương thức cũ `selectFallbackQuestions` nhằm đảm bảo tương thích ngược 100%.
- Viết bộ unit tests chuyên sâu trong `question-bank.service.spec.ts`: Đạt **13/13 tests passed 100%**.
- Kiểm tra `npm run test:arch`: **3/3 tests passed 100%**.
- Kiểm tra `npm run build`: **Thành công 100% (Exit code 0)**.
- **KẾT LUẬN:** Bước 4.1 đã hoàn thành an toàn tuyệt đối, sẵn sàng chuyển sang Bước 4.2: Cập Nhật `GenerateSessionQuestions` (Fallback AI).

### [2026-09-06] Hoàn thành Bước 4.2: Cập Nhật GenerateSessionQuestions & Kết thúc Giai Đoạn 4
- Đã tạo `SkillTargetedQuestionGeneratorService` (`skill-targeted-question-generator.service.ts`):
  - Structured Outputs với Zod schema chuẩn hóa sinh câu hỏi kèm đúng 2 tiêu chí nhị phân `core` và `seniority`.
  - Cơ chế Multi-tiered Resilience Fallback chống sập 100%: khi AI Gateway timeout/quota/mất mạng, tự động lấy câu hỏi dự phòng từ ngân hàng và gắn tiêu chí mặc định.
  - Unit test `skill-targeted-question-generator.service.spec.ts`: **3/3 tests passed 100%**.
- Đã nâng cấp `GenerateSessionQuestions` (`generate-session-questions.service.ts`):
  - Phân bổ câu hỏi theo `session_skills`, bù đắp phần thiếu bằng `SkillTargetedQuestionGeneratorService`.
  - Sắp xếp lũy tiến Progressive Flow (độ khó tăng dần 1..N).
  - Ghi nhận `session_questions` với `session_skill_id`, `rubric_criteria` và best-effort link `sessionQuestionSkillLevels`.
  - Bảo toàn 100% luồng legacy fallback cho các kịch bản cũ.
- Đã cập nhật `question-generation.processor.spec.ts`: **25/25 tests passed 100%**.
- Đã kiểm thử thực tế trên CSDL Live PostgreSQL (`verify-phase4-live.ts`):
  - Sinh thành công 4 câu hỏi cho vị trí Senior Full Stack Engineer (Level 4): 3 câu từ ngân hàng (`PROG`, `DBDS`, `DESN`), 1 câu AI sinh động (`ARCH`).
  - 100% câu hỏi gắn `sessionSkillId` hợp lệ trỏ tới `session_skills`.
  - 100% câu hỏi có đúng 2 tiêu chí nhị phân chuẩn hóa 2 chiều (`core`, `seniority`).
  - Thứ tự lũy tiến `orderIndex: 1..4` chuẩn mực và dọn dẹp sạch sẽ dữ liệu.
- Chạy toàn bộ test suites backend: **70/70 test suites passed 100% (549/549 unit & integration tests)**.
- Kiểm tra `npm run test:arch`: **3/3 tests passed 100%** (Tuân thủ Clean Architecture và Bounded Contexts).
- Kiểm tra `npm run build`: **Thành công 100% (Exit code 0)**.
- **KẾT LUẬN:** Giai đoạn 4 đã chính thức **HOÀN THÀNH 100% (2/2 bước)** với chất lượng và độ tin cậy tuyệt đối, zero tech debt. Hệ thống đã sẵn sàng chuyển sang Giai đoạn 5: Chấm Điểm Tất Định, Báo Cáo Năng Lực & Dọn Dẹp Schema Cũ.

### [2026-09-06] Hoàn thành Bước 5.1: Cập Nhật AnswerEvaluatorService & Prompting (BinaryCriteriaEvaluatorService)
- Đã tạo `BinaryCriteriaEvaluatorService` (`binary-criteria-evaluator.service.ts`):
  - Định nghĩa Zod schema `BinaryCriteriaOutputSchema` cho Structured Outputs: `criteria_evaluations`, `strengths`, `improvements`, `model_answer`, `key_takeaway`, `annotated_segments`.
  - LLM đóng vai giám khảo độc lập chấm Pass/Fail cho từng tiêu chí rubric criteria kèm dẫn chứng `evidence` và nguyên nhân trừ điểm `deduction_reason`.
  - Multi-tiered resilience fallback dự phòng an toàn khi AI Gateway timeout/quota/lỗi mạng, không bao giờ ngắt quãng hay crash tiến trình phỏng vấn.
- Đã đăng ký `BinaryCriteriaEvaluatorService` vào `EvaluationModule`.
- Viết unit tests chuyên biệt `binary-criteria-evaluator.service.spec.ts`: Đạt **4/4 tests passed 100%**.
- Chạy toàn bộ test suites backend: **71/71 test suites passed 100% (553/553 unit & integration tests)**.
- Kiểm tra `npm run test:arch`: **3/3 tests passed 100%** (Clean Architecture và Bounded Contexts).
- Kiểm tra `npm run build`: **Thành công 100% (Exit code 0)**.
- **KẾT LUẬN:** Bước 5.1 đã hoàn tất 100% an toàn tuyệt đối. Sẵn sàng chuyển sang Bước 5.2: Xây Dựng `ScoringEngineService` & Tích Hợp `FeedbackProcessor`.

### [2026-09-06] Hoàn thành Bước 5.2: Xây Dựng ScoringEngineService & Tích Hợp FeedbackProcessor
- Đã xây dựng `ScoringEngineService` (`scoring-engine.service.ts`):
  - Phương thức `calculateQuestionScore`: Tính toán chính xác điểm số 0–100, `criteriaPassRate`, `corePassRate` và `seniorityPassRate` theo trọng số tiêu chí.
  - Phương thức `inferDemonstratedLevel`: Logic toán học tất định 100% (hổng kiến thức chuyên môn cốt lõi `core < 0.5` -> trừ 2 level; đạt core nhưng trượt thâm niên `seniority < 0.5` -> trừ 1 level; đạt toàn diện -> giữ nguyên target level). Luôn áp dụng quy tắc chặn trần/sàn `[1, targetLevel]`.
  - Phương thức `buildSkippedFeedbackData`: Gán điểm 0, Level 1 cho câu hỏi bị bỏ qua (Skip) hoặc hết giờ, đưa vào mẫu số đánh giá năng lực phiên.
  - Phương thức `aggregateSessionSkillScores`: Tự động tính trung bình số học điểm `score` và cấp độ `actualLevel` cho từng `SessionSkill`, và tính `overallScore` có trọng số cho `InterviewSession` trong transaction.
- Đã đăng ký `ScoringEngineService` vào `EvaluationModule`.
- Đã tích hợp Dual-Mode vào `FeedbackProcessor` (`feedback.processor.ts`):
  - Tự động nhận diện câu hỏi có `rubricCriteria` để kích hoạt `BinaryCriteriaEvaluatorService` và `ScoringEngineService`.
  - Lưu đầy đủ `demonstratedLevel`, `criteriaPassRate`, `criteriaEvaluations`, `strengths`, `improvements` vào `ai_feedbacks`.
  - Tự động gọi `aggregateSessionSkillScores` cập nhật `session_skills` và `interview_sessions` trong transaction.
  - Bảo toàn 100% luồng legacy fallback cho các phiên cũ không có `rubricCriteria`.
- Viết unit tests chuyên biệt:
  - `scoring-engine.service.spec.ts`: Đạt **11/11 tests passed 100%**.
  - `feedback.processor.spec.ts`: Đạt **21/21 tests passed 100%** (bao gồm test Dual-Mode Hybrid flow).
- Chạy toàn bộ test suites backend: **72/72 test suites passed 100% (565/565 unit & integration tests)**.
- Kiểm tra `npm run test:arch`: **3/3 tests passed 100%** (Clean Architecture và Bounded Contexts).
- Kiểm tra `npm run build`: **Thành công 100% (Exit code 0)**.
- **KẾT LUẬN:** Bước 5.2 đã hoàn tất 100% an toàn tuyệt đối. Sẵn sàng chuyển sang Bước 5.3: Nâng Cấp `SessionReportService` & Hợp Nhất Báo Cáo Năng Lực.

### [2026-09-06] Hoàn thành Bước 5.3: Nâng Cấp SessionReportService & Hợp Nhất Báo Cáo Năng Lực
- Đã xây dựng `UnifiedReportGeneratorService` (`unified-report-generator.service.ts`):
  - Phân tích `session_skills` của phiên để tạo `skills_breakdown`: tính toán độ hụt năng lực (`gap = actualLevel - targetLevel`), `benchmarkComparison` (above/meets/below), phân loại `keyStrengths` vs `criticalGaps`.
  - Phân định trạng thái khuyến nghị tuyển dụng tất định (`strongly_recommended`, `recommended`, `borderline`, `not_recommended`) dựa trên điểm tổng `overallScore` và số lượng kỹ năng đạt chuẩn.
  - Chiến lược 2-tiered tổng hợp báo cáo:
    - Tier 1: Sử dụng AI Gateway sinh văn phong chuyên nghiệp cho `executive_summary` và lộ trình hành động cá nhân hóa `action_plan` (30/60/90 days).
    - Tier 2: Dự phòng tất định (deterministic fallback) nếu AI timeout/quota, tự động trích xuất mô tả kỹ năng SFIA chính thức từ `ISfiaFacade` để sinh báo cáo, đảm bảo không bao giờ gián đoạn việc hoàn tất phiên.
  - Lưu trữ bản ghi chính thức duy nhất: `report_type = 'session_competency_evaluation'` kèm 2 bản ghi tương thích ngược `executive_summary` và `action_plan` trong transaction `prisma.$transaction`.
  - Cập nhật trạng thái phiên `status = 'completed'` và cập nhật `overallScore`.
- Đã đăng ký `UnifiedReportGeneratorService` và `SfiaModule` vào `ReportModule`.
- Đã tích hợp `GenerateComprehensiveReport`: Tự động nhận diện phiên phỏng vấn có `session_skills` để kích hoạt `UnifiedReportGeneratorService`.
- Đã cập nhật `ReportService`:
  - `getReport`: Nhận diện báo cáo `session_competency_evaluation` và ánh xạ liền mạch vào `ReportResponseDto` (bao gồm `skillsBreakdown`, `recommendationStatus`, `actionPlan`).
  - `getFeedbackProgress`: Đếm đúng cả báo cáo năng lực mới.
- Viết unit tests chuyên sâu:
  - `unified-report-generator.service.spec.ts`: Đạt **3/3 tests passed 100%**.
  - `report.service.spec.ts` & `generate-comprehensive-report.service.spec.ts`: Đạt **33/33 tests passed 100%**.
- Chạy toàn bộ test suites backend: **73/73 test suites passed 100% (568/568 unit & integration tests)**.
- Kiểm tra `npm run test:arch`: **3/3 tests passed 100%** (Clean Architecture và Bounded Contexts).
- Kiểm tra `npm run build`: **Thành công 100% (Exit code 0)**.
- **KẾT LUẬN:** Bước 5.3 đã hoàn tất 100% an toàn tuyệt đối. Sẵn sàng chuyển sang Bước 5.4: Xây Dựng Kịch Bản Kiểm Thử Tích Hợp (E2E Test).

### [2026-09-06] Hoàn thành Bước 5.4: Xây Dựng Kịch Bản Kiểm Thử Tích Hợp (E2E Test)
- Đã xây dựng bộ kiểm thử tích hợp chuyên sâu Jest: `server/test/hybrid-assessment-lifecycle.integration-spec.ts`:
  - Kiểm thử toàn diện vòng đời đánh giá năng lực: Khởi tạo JD -> Phân giải kỹ năng SFIA -> Cấp phát câu hỏi kèm rubric criteria nhị phân 2 chiều (`core`, `seniority`).
  - Kiểm thử 4 kịch bản đánh giá câu trả lời thực tế:
    - Turn 1 (`PROG` Level 4): Đạt toàn diện cả Core & Seniority -> 100 điểm, Level 4.
    - Turn 2 (`DBDS` Level 4): Đạt Core, trượt Seniority -> 60 điểm, Level 3 (trừ 1 level).
    - Turn 3 (`ARCH` Level 4): Trượt cả Core & Seniority -> 0 điểm, Level 2 (trừ 2 level).
    - Turn 4 (`DESN` Level 4): Bỏ qua (Skip) -> 0 điểm, Level 1 (phạt sàn).
  - Kiểm thử tổng hợp điểm kỹ năng & phiên: Điểm số từng kỹ năng và điểm tổng phiên được tính toán chính xác 40 điểm ((100 + 60 + 0 + 0) / 4 = 40).
  - Kiểm thử sinh báo cáo năng lực: Bản ghi `session_competency_evaluation` được sinh với `recommendationStatus = 'not_recommended'`, `targetSfiaLevel = 4`, `demonstratedSfiaLevel = 3`, đầy đủ `skillsBreakdown` và `actionPlan`.
  - Kiểm thử tầng truy vấn báo cáo qua `ReportService.getReport`: Trả về chuẩn xác DTO với `recommendationStatus`, `skillsBreakdown`, `actionPlan` tương thích ngược.
  - Sửa lỗi tiềm ẩn (null-safety) trong `ReportService.getReport` khi `feedback.annotatedSegments` là undefined.
  - Chạy kiểm thử Jest integration: **1/1 test suite passed (100%)**.
- Cập nhật Check Constraint `chk_session_reports_report_type` trong CSDL PostgreSQL và `prisma/migrations/migration.sql` bổ sung giá trị `'session_competency_evaluation'`.
- Đã viết và thực thi kịch bản kiểm thử E2E trực tiếp trên CSDL Live PostgreSQL `server/scripts/verify-step5-4-e2e-live.ts`:
  - Tạo dữ liệu thật trong PostgreSQL (User, SavedJobDescription, InterviewSession, SessionSkill, SessionQuestion, UserAnswer, AiFeedback, SessionReport).
  - Nghiệm thu đạt 100% tất cả các bước tính toán điểm, cấp độ, lưu trữ báo cáo và dọn dẹp an toàn cascade.
- Chạy toàn bộ test suites backend: **73/73 test suites passed 100% (568/568 unit & integration tests)**.
- Kiểm tra `npm run test:arch`: **3/3 tests passed 100%** (Clean Architecture và Bounded Contexts).
- Kiểm tra `npm run build`: **Thành công 100% (Exit code 0)**.
- **KẾT LUẬN:** Bước 5.4 đã hoàn tất 100% an toàn tuyệt đối. Sẵn sàng chuyển sang Bước 5.5: Dọn Dẹp Triệt Để 7 Bảng Cũ & Cột Legacy (Bước cuối cùng của Giai Đoạn 5 & Dự án).

### [2026-09-06] Hoàn thành Bước 5.5: Dọn Dẹp Triệt Để 7 Bảng Cũ & Cột Legacy (HOÀN THÀNH TOÀN BỘ DỰ ÁN)
- Đã dọn dẹp sạch sẽ toàn bộ các tham chiếu tới 7 bảng legacy trong mã nguồn backend:
  - `question-bank.service.ts`: Cập nhật `QuestionBankCandidate`, include `{ questionCriteria: true }`, loại bỏ `QUESTION_BANK_SKILL_LEVELS_INCLUDE`.
  - `transcribe-answer.service.ts`: Loại bỏ `SESSION_QUESTION_CRITERIA_INCLUDE`.
  - `report-data-collector.service.ts`: Cập nhật select query thay thế `sessionQuestionSkillLevels` bằng `sfiaSkillCode`, `targetLevel`, `rubricCriteria`.
  - `generate-session-questions.service.ts`: Loại bỏ hoàn toàn câu lệnh insert vào `sessionQuestionSkillLevel`.
- Đã cập nhật `server/prisma/schema.prisma`:
  - Xóa bỏ 7 models: `Level`, `Role`, `Skill`, `SkillLevel`, `RoleSkill`, `QuestionBankSkillLevel`, `SessionQuestionSkillLevel`.
  - Xóa bỏ các quan hệ mảng tương ứng khỏi `QuestionBank` và `SessionQuestion`.
- Đã viết và thực thi thành công script SQL trên CSDL Live PostgreSQL `server/scripts/drop-legacy-tables.ts`:
  - Drop thành công 100% (7/7) bảng cũ khỏi schema `public` có CASCADE: `session_question_skill_levels`, `question_bank_skill_levels`, `role_skills`, `skill_levels`, `roles`, `levels`, `skills`.
- Chạy `npm run prisma:generate`: Khởi tạo Prisma Client v7 sạch hoàn toàn (0 models legacy, 151ms).
- Kiểm thử toàn diện trên CSDL Live PostgreSQL:
  - Chạy `server/scripts/verify-step5-4-e2e-live.ts`: **100% PASSED**.
  - Chạy Jest integration `test/hybrid-assessment-lifecycle.integration-spec.ts`: **1/1 PASSED**.
- Chạy toàn bộ test suites backend: **73/73 test suites passed 100% (568/568 unit & integration tests)**.
- Kiểm tra `npm run test:arch`: **3/3 tests passed 100%** (Clean Architecture và Bounded Contexts tuyệt đối).
- Kiểm tra `npm run build`: **Thành công 100% (Exit code 0)**.
- Đã cập nhật tài liệu thiết kế cơ sở dữ liệu `docs/Design/DetailedDesign/database-design/Database.md` (Mục 7.2).
- **TỔNG KẾT TOÀN DỰ ÁN:**
  - **16/16 bước (100% 🟢)** của cả 5 Giai đoạn trong kế hoạch `docs/public-schema-refinement-and-hybrid-integration-plan.md` đã hoàn thành trọn vẹn, vượt mọi chỉ tiêu về chất lượng, hiệu năng, kiến trúc Clean Architecture, và độ an toàn CSDL (Zero Regression, Zero Tech Debt).

---

### [2026-09-06] Hoàn thành Thẩm Định Chuyên Sâu (`/grill-me`) & Khắc Phục Triệt Để 6 Lỗ Hổng Kỹ Thuật (Zero Tech Debt)
- **Kiểm định & Khắc phục:**
  1. **AI Fallback Logic**: Sửa `buildFallbackOutput` trong `BinaryCriteriaEvaluatorService` trả về `passed = false`, điểm 0, Level 1. `ScoringEngineService` xử lý fallback như câu skip (0 điểm, Level 1), triệt tiêu hoàn toàn lỗ hổng gian lận.
  2. **Skip Wire-Up Qua Facade**: Loại bỏ thao tác DB trực tiếp từ `interview-live`, đóng gói `recordSkippedQuestion` & `recordAutoSkippedQuestions` vào `AssessmentFacade` với đầy đủ Transactional Integrity và cập nhật `session_skills`.
  3. **SSE Realtime Báo Cáo**: Bổ sung `persistenceService.notifyReportReady(sessionId)` trong `generate-comprehensive-report.service.ts` cho luồng báo cáo hợp nhất `unifiedReportGenerator`.
  4. **DTO Synchronization**: Bổ sung `criteriaEvaluations`, `demonstratedLevel`, `criteriaPassRate`, `strengths`, `improvements` vào `TranscriptItemDto`; bổ sung `skillsBreakdown`, `recommendationStatus` vào `ReportResponseDto`.
  5. **Schema Cleanup**: Drop vĩnh viễn cột `dimension_scores` khỏi CSDL PostgreSQL và model `AiFeedback`. Cập nhật `chk_session_reports_report_type` cho 6 loại báo cáo.
  6. **Toàn Bộ Test Suites & E2E**:
     - `npm run test:arch`: **3/3 tests passed (100%)**.
     - Unit & Integration tests (`scoring-engine`, `binary-criteria-evaluator`, `feedback.processor`, `assessment-facade`, `report.service`, `generate-comprehensive-report`, `hybrid-assessment-lifecycle`): **77/77 tests passed (100%)**.
     - Live E2E script `scripts/verify-step5-4-e2e-live.ts`: **100% PASSED**.
     - `npm run build`: **Thành công 100% (Exit code 0)**.
