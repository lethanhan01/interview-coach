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
| **Giai đoạn 3** | Cầu Nối Hybrid & Tích Hợp JD / Session Lifecycle | ⚪ Chưa bắt đầu | 0 / 3 bước |
| **Giai đoạn 4** | Cấp Phát Câu Hỏi Theo `session_skills` & Tiêu Chí Nhị Phân | ⚪ Chưa bắt đầu | 0 / 2 bước |
| **Giai đoạn 5** | Chấm Điểm Tất Định, Báo Cáo Năng Lực & Dọn Dẹp Schema Cũ | ⚪ Chưa bắt đầu | 0 / 5 bước |

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
- [ ] **Bước 3.1: Xây Dựng `HybridMappingService`**
- [ ] **Bước 3.2: Cập Nhật `SaveJobDescriptionService`**
- [ ] **Bước 3.3: Tích Hợp Vào Asynchronous Outbox Worker (`question-generation`)**

---

### Giai Đoạn 4: Cấp Phát Câu Hỏi Theo `session_skills` & Tiêu Chí Nhị Phân
- [ ] **Bước 4.1: Cập Nhật `QuestionBankService`**
- [ ] **Bước 4.2: Cập Nhật `GenerateSessionQuestions` (Fallback AI)**

---

### Giai Đoạn 5: Chấm Điểm Tất Định, Báo Cáo Năng Lực & Dọn Dẹp Schema Cũ
- [ ] **Bước 5.1: Cập Nhật `AnswerEvaluatorService` & Prompting**
- [ ] **Bước 5.2: Xây Dựng `ScoringEngineService`**
- [ ] **Bước 5.3: Nâng Cấp `SessionReportService`**
- [ ] **Bước 5.4: Xây Dựng Kịch Bản Kiểm Thử Tích Hợp (E2E Test)**
- [ ] **Bước 5.5: Dọn Dẹp Triệt Để 7 Bảng Cũ & Cột Legacy**

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

