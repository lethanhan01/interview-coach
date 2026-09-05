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
| **Giai đoạn 2** | Xây Dựng 2 Bounded Contexts `SfiaModule` & `OnetModule` | 🟡 Đang thực hiện | 1 / 3 bước |
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
  - [x] Chạy script kiểm tra độc lập `server/scripts/verify-step1-3.ts`: Nghiệm thu đạt 100% (32 bản ghi phủ đủ các level và ngành nghề).

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
- [ ] **Bước 2.2: Bounded Context `OnetModule`**
- [ ] **Bước 2.3: Đăng Ký Modules & Dọn Dẹp Thư Mục Cũ**

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




