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
| **Giai đoạn 1** | Database Add-only Migration & Làm Giàu Dữ Liệu QuestionBank | 🟡 Đang thực hiện | 1 / 4 bước |
| **Giai đoạn 2** | Xây Dựng 2 Bounded Contexts `SfiaModule` & `OnetModule` | ⚪ Chưa bắt đầu | 0 / 3 bước |
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

- [ ] **Bước 1.2: Viết & Chạy Script Làm Giàu QuestionBank Hiện Có**
  - [ ] Viết script `server/scripts/enrich-existing-question-bank.ts`.
  - [ ] Trích xuất SFIA skill & level từ các câu hỏi hiện có.
  - [ ] Gán mã O*NET SOC phù hợp và sinh bộ tiêu chí nhị phân 2 chiều (`core`, `seniority`) vào `question_criteria`.
  - [ ] Xác nhận toàn bộ câu hỏi trong Question Bank đã có criteria nhị phân.

- [ ] **Bước 1.3: Viết & Chạy Script Seed Cầu Nối `onet_sfia_mappings` Theo Cấp Bậc**
  - [ ] Viết script `server/scripts/seed-onet-sfia-mappings.ts`.
  - [ ] Seed ma trận các vị trí IT phổ biến theo các cấp độ Level 2, 3, 4.
  - [ ] Chạy script và verify dữ liệu trong database.

- [ ] **Bước 1.4: Kiểm Tra Toàn Vẹn Dữ Liệu Add-only**
  - [ ] Viết / chạy script kiểm tra toàn vẹn dữ liệu.
  - [ ] Kiểm tra `npm run build` và `npm run test:arch`.

---

### Giai Đoạn 2: Xây Dựng 2 Bounded Contexts `SfiaModule` & `OnetModule`
- [ ] **Bước 2.1: Bounded Context `SfiaModule`**
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
