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
| **Pha 3** | Tái Cấu Trúc Toàn Diện Trang Báo Cáo Phỏng Vấn (/report) | ⚪ Chưa bắt đầu | 0 / 4 bước |
| **Pha 4** | Nâng Cấp Phòng Phỏng Vấn Trực Tiếp (Live Session /sessions/[id]) | ⚪ Chưa bắt đầu | 0 / 2 bước |
| **Pha 5** | Đồng Bộ Luồng Thiết Lập JD Chuẩn Hóa O*NET (/setup & /jd-library) | ⚪ Chưa bắt đầu | 0 / 4 bước |
| **TỔNG THỂ** | **Đồng Bộ Hoàn Toàn Frontend Với Unified Interview Engine** | 🟡 **ĐANG THỰC HIỆN** | **8 / 18 bước** |

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

---

### Pha 3: Tái Cấu Trúc Toàn Diện Trang Báo Cáo Phỏng Vấn (/report)

- [ ] **Bước 3.1: Xóa Bỏ `CompetencyScoreChart.tsx` & Xây Dựng Fallback Phiên Cũ**
- [ ] **Bước 3.2: Nâng cấp Hero Banner Trang Báo Cáo (Overall Score & Recommendation)**
- [ ] **Bước 3.3: Tái Cấu Trúc `AnnotatedTranscript.tsx` (Binary Criteria & Skipped Turns)**
- [ ] **Bước 3.4: Chạy Toàn Bộ Vitest Cho Module Report**

---

### Pha 4: Nâng Cấp Phòng Phỏng Vấn Trực Tiếp (Live Session /sessions/[id])

- [ ] **Bước 4.1: Cập nhật `QuestionCard.tsx` (Hiển thị Badge Kỹ Năng & Tech Context, ẩn tiêu chí)**
- [ ] **Bước 4.2: Tích Hợp Vào Phòng Thi Trực Tiếp (`page.tsx`) & Unit Test**

---

### Pha 5: Đồng Bộ Luồng Thiết Lập JD Chuẩn Hóa O*NET (/setup & /jd-library)

- [ ] **Bước 5.1: Cập nhật `JdForm.tsx` Với O*NET Hybrid Combobox & Ánh Xạ Mặc Định SFIA Level**
- [ ] **Bước 5.2: Cập nhật `ConfirmStep.tsx` Với Thẻ AI Job Profile & Cho Phép Điều Chỉnh SFIA Level**
- [ ] **Bước 5.3: Cập nhật Thư Viện JD (`/jd-library`)**
- [ ] **Bước 5.4: Chạy Kiểm Thử Toàn Diện & Typecheck (Next.js Build + Backend Tests)**
