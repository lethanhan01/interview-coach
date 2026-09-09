# SFIA 9 Knowledge Browser — Đặc Tả Thiết Kế & Kế Hoạch Triển Khai Phân Kỳ 9 Phase (Frontend-First Detailed Specification)

## 1. Tầm Nhìn, Bối Cảnh Nghiệp Vụ & Dữ Liệu Nền Tảng

### 1.1. Bối cảnh & Vai trò của SFIA 9 trong InterviewCoach
Hệ thống **AI Mock Interview Coach** sử dụng chuẩn phân loại nghề nghiệp của Bộ Lao động Hoa Kỳ (**O\*NET Content Model**) kết hợp với khung năng lực kỹ năng số chuẩn quốc tế (**SFIA 9 — Skills Framework for the Information Age**) để định hình tiêu chuẩn phỏng vấn và đánh giá ứng viên:
1. **Gán nhãn đa tầng**: Gán nhãn câu hỏi phỏng vấn trong Ngân hàng câu hỏi (`public.question_bank`) theo mã kỹ năng SFIA (`sfia_skill_code`) và cấp độ mục tiêu (`target_sfia_level`).
2. **Chuẩn đánh giá cho AI Evaluator**: Cung cấp chuẩn tham chiếu hành vi (Rubric Benchmark) để LLM chấm điểm câu trả lời phỏng vấn theo 7 cấp độ trách nhiệm được quốc tế công nhận (Level 1 ➔ Level 7).
3. **Ánh xạ nghề nghiệp - năng lực**: Kết nối trực tiếp từ mã nghề O\*NET SOC sang các kỹ năng SFIA cốt lõi (`public.onet_sfia_mappings`) nhằm tự động gợi ý bộ câu hỏi phù hợp cho từng vị trí tuyển dụng.

### 1.2. Cấu trúc Schema `sfia` Trong PostgreSQL
Dữ liệu SFIA 9 trong cơ sở dữ liệu gồm 7 bảng cốt lõi và 2 bảng liên kết:
- **`sfia.categories` (6 Danh mục nghiệp vụ lớn)**:
  1. `STRAT_ARCH`: Strategy and architecture (Xanh dương / Blue)
  2. `CHG_TRANS`: Change and transformation (Xanh lục / Emerald)
  3. `DEV_IMPL`: Development and implementation (Tím / Violet)
  4. `DELIV_OP`: Delivery and operation (Xanh ngọc / Cyan)
  5. `PPL_SKILL`: People and skills (Cam / Amber)
  6. `REL_ENG`: Relationships and engagement (Hồng đỏ / Rose)
- **`sfia.subcategories` (22 Phân nhóm chuyên môn)**: Phân rã từ 6 danh mục lớn (ví dụ: Systems development, Data & analytics, User centred design, Security services,...).
- **`sfia.skills` (147 Kỹ năng chuyên môn)**: Gồm mã code 4 chữ cái (ví dụ: `PROG` - Programming, `SWDN` - Software design, `DBDS` - Database design), tên đầy đủ, mô tả tổng quan (`overall_description`), ghi chú hướng dẫn (`guidance_notes`), dải cấp độ khả dụng (`min_level` đến `max_level`).
- **`sfia.skill_levels` (~672 Bản mô tả năng lực hành vi)**: Khóa chính `(skill_code, level_id)`, chứa mô tả chi tiết chính xác những gì một chuyên gia cần làm được ở cấp độ đó.
- **`sfia.levels` (7 Cấp độ trách nhiệm)**: Từ Level 1 (Follow) đến Level 7 (Set strategy, inspire), gồm Tên cấp độ, Bản chất cốt lõi (`essence`) và mô tả quyền hạn (`description`).
- **`sfia.generic_attributes` (16 Thuộc tính nền tảng)**: 5 trụ cột cốt lõi: Autonomy (Tự chủ), Influence (Ảnh hưởng), Complexity (Độ phức tạp), Business skills (Kỹ năng kinh doanh & đạo đức số), Knowledge (Kiến thức).
- **`sfia.generic_attribute_levels` (112 Tiêu chuẩn thuộc tính)**: Khóa chính `(attribute_code, level_id)`, mô tả tiêu chuẩn hành vi của thuộc tính đó ở từng level 1-7.
- **Dữ liệu liên kết hệ thống**:
  - `public.onet_sfia_mappings`: Liên kết giữa mã nghề O*NET SOC và kỹ năng SFIA 9 kèm `target_sfia_level`, `default_weight`, `is_core`.
  - `public.question_bank`: Các câu hỏi phỏng vấn thực tế gắn nhãn `sfia_skill_code` và `target_sfia_level`.

### 1.3. Chiến Lược Thực Thi "Frontend-First & Phân Kỳ Từng Session"
- **Ưu tiên Frontend trước (Phase 1 ➔ Phase 7)**:
  - Xây dựng toàn bộ giao diện, bố cục, các luồng tương tác và chuyển động thông qua **Client Mock Data Service** với dữ liệu mẫu phong phú, sát thực tế 100%.
  - Quản trị viên trải nghiệm trực tiếp trên trình duyệt thật (`npm run dev`), đánh giá visual, tinh chỉnh UX cho đến khi hoàn toàn ưng ý.
- **Backend & Tích hợp sau (Phase 8 ➔ Phase 9)**:
  - Sau khi Frontend đã được nghiệm thu 100%, tiến hành xây dựng các API endpoints NestJS, DTOs validation, queries cơ sở dữ liệu PostgreSQL (`sfia` schema & joins) và chuyển đổi client từ mock sang API thật.
- **Quy tắc Chuyển giao giữa các Session**:
  - Mỗi Phase là một session độc lập, tập trung làm sâu một mảng chức năng.
  - Sau mỗi Phase, hệ thống sẽ dừng lại, cập nhật `walkthrough.md` để người dùng kiểm tra trực tiếp trên trình duyệt rồi mới chuyển sang Phase tiếp theo.

---

## 2. Kiến Trúc Không Gian Làm Việc (Information Architecture)

Module SFIA Knowledge Browser được tổ chức tại route `/admin/sfia` với 4 Tabs chính:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       SFIA 9 KNOWLEDGE BROWSER (/admin/sfia)                                    │
│  [Top Header: Title + Badge SFIA 9.0 + Global Search (Ctrl+K) + Copy AI Prompt + Export CSV + 4 Main Tabs]     │
├────────────────────────────────┬───────────────────────────────┬───────────────────────────────┬────────────────┤
│ 1. Taxonomy Explorer (Cây)     │ 2. SFIA Matrix Grid (Ma trận) │ 3. Generic Attributes (Level) │ 4. Analytics   │
├────────────────────────────────┴───────────────────────────────┴───────────────────────────────┴────────────────┤
│ [Collapsible Anatomy Banner: Minh họa 4 trụ cột SFIA 9: Danh mục, Phân nhóm, Kỹ năng, Cấp độ trách nhiệm]       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Hệ Thống Token Nhận Diện Màu Sắc Chuẩn Hóa (SFIA Design Tokens)

Tuân thủ quy tắc **Safe Dynamic Styling** (Lookup Tables) theo `Conventions.mdx`:
```typescript
export const SFIA_CATEGORY_THEMES = {
  STRAT_ARCH: {
    code: 'STRAT_ARCH',
    name: 'Strategy and architecture',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    border: 'border-blue-500',
    accent: 'text-blue-600 dark:text-blue-400',
    cellActive: 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border-blue-500/40',
    dot: 'bg-blue-500',
  },
  CHG_TRANS: {
    code: 'CHG_TRANS',
    name: 'Change and transformation',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    border: 'border-emerald-500',
    accent: 'text-emerald-600 dark:text-emerald-400',
    cellActive: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    dot: 'bg-emerald-500',
  },
  DEV_IMPL: {
    code: 'DEV_IMPL',
    name: 'Development and implementation',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    border: 'border-violet-500',
    accent: 'text-violet-600 dark:text-violet-400',
    cellActive: 'bg-violet-500/15 hover:bg-violet-500/25 text-violet-700 dark:text-violet-300 border-violet-500/40',
    dot: 'bg-violet-500',
  },
  DELIV_OP: {
    code: 'DELIV_OP',
    name: 'Delivery and operation',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    border: 'border-cyan-500',
    accent: 'text-cyan-600 dark:text-cyan-400',
    cellActive: 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border-cyan-500/40',
    dot: 'bg-cyan-500',
  },
  PPL_SKILL: {
    code: 'PPL_SKILL',
    name: 'People and skills',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    border: 'border-amber-500',
    accent: 'text-amber-600 dark:text-amber-400',
    cellActive: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500/40',
    dot: 'bg-amber-500',
  },
  REL_ENG: {
    code: 'REL_ENG',
    name: 'Relationships and engagement',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    border: 'border-rose-500',
    accent: 'text-rose-600 dark:text-rose-400',
    cellActive: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-500/40',
    dot: 'bg-rose-500',
  },
} as const;
```

---

## 4. Chi Tiết Nội Dung Công Việc Phân Kỳ 9 Phase

```
========================= GIAI ĐOẠN 1: FRONTEND-FIRST (PHASE 1 ➔ 7) =========================

Phase 1: Foundation, Routing & Mock Data Service
   │
   ▼
Phase 2: Taxonomy Explorer — Collapsible Tree & Explainer Banner
   │
   ▼
Phase 3: Skill Detail Panel — Interactive 7-Level Span Stepper & Statements
   │
   ▼
Phase 4: System Integration Insights — O*NET & Question Bank Tabs
   │
   ▼
Phase 5: SFIA Matrix Grid 2D & Slide-Over Inspection Sheet
   │
   ▼
Phase 6: Generic Attributes & 7 Responsibility Levels Dual-View
   │
   ▼
Phase 7: Coverage Analytics Dashboard & Blind Spot Alerts

========================= GIAI ĐOẠN 2: BACKEND & TÍCH HỢP (PHASE 8 ➔ 9) =====================

Phase 8: Backend NestJS Endpoints & Schema Queries
   │
   ▼
Phase 9: E2E Integration, URL Deep Linking & Final Acceptance
```

---

### Phase 1: Foundation, Routing, Data Contracts & Mock Data Service (Frontend)
- **Mục tiêu Session**: Thiết lập hạ tầng định tuyến Next.js, cập nhật navigation sidebar admin, định nghĩa types TypeScript, bảng mã màu CVA, và kho dữ liệu giả lập (Mock Service) phong phú phục vụ kiểm thử.
- **Nhiệm vụ cụ thể**:
  1. `client/config/navigation.ts`: Thêm mục `"SFIA Framework"` (`/admin/sfia`) với icon `Network` vào danh sách `adminNavigation`.
  2. `client/components/layout/AppLayout.tsx`: Mở rộng điều kiện `isWorkspaceMode` cho đường dẫn `pathname?.startsWith('/admin/sfia')` để tối ưu không gian hiển thị không viền cuộn riêng.
  3. `client/components/sfia/types.ts`: Định nghĩa toàn bộ interfaces:
     - `SfiaMainTab`: `'taxonomy' | 'matrix' | 'attributes' | 'analytics'`
     - `SfiaCategory`: mã code, tên, mô tả, displayOrder, số lượng kỹ năng.
     - `SfiaSubcategory`: mã code, categoryCode, tên, mô tả.
     - `SfiaSkillSummary`: code, name, categoryCode, subcategoryCode, minLevel, maxLevel, questionCount, onetCount.
     - `SfiaSkillDetail`: kế thừa summary, overallDescription, guidanceNotes, skillLevels, onetMappings, questionBankItems.
     - `SfiaSkillLevel`: skillCode, levelId, description, essence.
     - `SfiaLevelResponsibility`: levelId, name, essence, description.
     - `SfiaGenericAttribute`: code, name, description, levels.
     - `SfiaCoverageStats`: metrics tổng quan, phân bổ danh mục, phân bổ level, top onet.
  4. `client/components/sfia/sfia-theme.ts`: Triển khai bảng mã màu CVA cho 6 danh mục lớn và helper functions `getCategoryTheme(categoryCode)`.
  5. `client/components/sfia/sfia-mock-data.ts`: Tạo bộ dữ liệu mẫu đầy đủ:
     - 6 danh mục chuẩn SFIA 9.
     - 22 phân nhóm chuẩn.
     - Dữ liệu chi tiết cho các kỹ năng cốt lõi: `PROG` (L2-6), `SWDN` (L3-6), `DBDS` (L2-6), `TEST` (L1-6), `ARCH` (L5-7), `ITOP` (L1-5), `PPLM` (L2-7), `METL` (L4-7), `GOVN` (L5-7), `DATA` (L2-6).
     - 7 cấp độ trách nhiệm kèm Bản chất cốt lõi (`essence`).
     - 5 thuộc tính năng lực nền tảng (Autonomy, Influence, Complexity, Business skills, Knowledge) với tiêu chuẩn qua 7 levels.
     - Dữ liệu liên kết mẫu: Các nghề O*NET (15-1252.00, 15-1251.00,...) và câu hỏi Question Bank.
  6. `client/services/sfia-admin.service.ts`: Xây dựng service client với cờ `USE_MOCK = true`, cung cấp các hàm `getCategories()`, `getSkills()`, `getSkillDetail(code)`, `getMatrixData()`, `getGenericAttributes()`, `getCoverageStats()`.
  7. `client/components/sfia/useSfiaParams.ts`: Hook quản lý đồng bộ URL search params (`tab`, `skill`, `level`, `category`).
  8. `client/app/(admin)/admin/sfia/page.tsx`: Shell workspace chính với Header flat bar, 4 TabsTrigger và container render theo tab.
- **Tiêu chí nghiệm thu Session 1**:
  - Truy cập `/admin/sfia` hiển thị workspace phẳng, header có 4 tab.
  - Bấm chuyển tab cập nhật URL search params `?tab=taxonomy`, `?tab=matrix`, `?tab=attributes`, `?tab=analytics`.
  - Icon "SFIA Framework" xuất hiện nổi bật trong sidebar menu của Admin.

---

### Phase 2: Taxonomy Explorer Workspace & Collapsible Tree Navigation (Frontend)
- **Mục tiêu Session**: Xây dựng biểu ngữ giải phẫu cấu trúc SFIA 9 và cột Master Sidebar với Cây phân cấp lồng nhau 3 tầng, tìm kiếm nhanh và lọc theo dải cấp độ.
- **Nhiệm vụ cụ thể**:
  1. `client/components/sfia/SfiaAnatomyBanner.tsx`:
     - Biểu ngữ thông minh có nút gập/mở (Collapsible).
     - Trực quan hóa 4 trụ cột SFIA 9 bằng sơ đồ khối: (1) 6 Danh mục chuyên môn ➔ (2) 22 Phân nhóm ➔ (3) 147 Kỹ năng với dải cấp độ ➔ (4) 7 Cấp độ trách nhiệm.
     - Hiển thị 4 thẻ mini-stat: 147 Kỹ năng, 22 Phân nhóm, 6 Danh mục, Tỷ lệ phủ câu hỏi.
     - Có nút "Đóng / Thu gọn" và lưu trạng thái vào `localStorage`.
  2. `client/components/sfia/SfiaSidebarTree.tsx`:
     - Cột rộng 340px cố định trên desktop.
     - Ô tìm kiếm tức thì: Lọc realtime theo mã code (`PROG`), tên kỹ năng tiếng Anh/tiếng Việt.
     - Bộ lọc dropdown Cấp độ: Chọn xem kỹ năng tồn tại ở Level 1, 2, 3, 4, 5, 6, 7.
     - Nút tiện ích "Mở rộng tất cả / Thu gọn tất cả" (Expand/Collapse All).
     - Cấu trúc Cây 3 tầng lồng nhau:
       - **Tầng 1 (Category Node)**: Header danh mục có dot màu nhận diện, tên danh mục, và badge đếm số kỹ năng (ví dụ: `Development and implementation (32)`).
       - **Tầng 2 (Subcategory Node)**: Nhánh phân nhóm thụt lề, có icon thư mục nhỏ và đường gióng nhánh cây thanh mảnh (`border-l`).
       - **Tầng 3 (Skill Item)**: Thẻ kỹ năng có mã code dạng badge monospace nổi bật (`PROG`), tên kỹ năng rút gọn, và badge dải level nhỏ dạng `L2-6`. Khi được chọn, có viền active và nền sáng theo màu danh mục.
  3. `client/components/sfia/SfiaMobileDrawer.tsx`:
     - Thanh điều hướng mobile có nút `[📂 Cây Danh mục SFIA]` kèm badge kỹ năng đang chọn.
     - Nhấp mở Drawer trượt từ cạnh trái (85% width trên mobile, 400px trên tablet).
     - Chọn kỹ năng tự động đóng drawer và cuộn lên đầu màn hình.
- **Tiêu chí nghiệm thu Session 2**:
  - Gõ "test" vào ô tìm kiếm: Cây tự động bung mở đúng nhóm và hiển thị kỹ năng kiểm thử.
  - Chọn lọc "Level 7": Cây chỉ hiển thị các kỹ năng quản trị cấp cao có Level 7 (`ARCH`, `GOVN`,...).
  - Responsive kiểm tra trên mobile: Drawer trượt ra mượt mà, chọn kỹ năng đóng drawer ngay lập tức.

---

### Phase 3: Skill Detail Panel, Interactive Steppers & Statements (Frontend)
- **Mục tiêu Session**: Xây dựng khung chi tiết kỹ năng bên phải với Thước đo dải 7 Cấp độ trực quan (Interactive Stepper) và bản mô tả năng lực hành vi đối chiếu chuẩn SFIA.
- **Nhiệm vụ cụ thể**:
  1. `client/components/sfia/SfiaDetailPanel.tsx`:
     - Khung cuộn độc lập bên phải.
     - **Hero Identity Card**: Mã code to rõ (Font Semibold Monospace), Tên tiếng Anh đầy đủ, Breadcrumb danh mục ➔ phân nhóm với badge màu tương ứng.
     - Nút tiện ích "📋 Sao chép Prompt SFIA Rubric": Tự động format Markdown/JSON chứa chuẩn năng lực kỹ năng và level đang chọn để dán vào prompt thử nghiệm cho LLM Evaluator; hiển thị Toast xanh lá khi sao chép.
     - Nút sao chép mã code nhanh.
  2. `client/components/sfia/SfiaLevelSpanStepper.tsx`:
     - **Thước đo dải 7 Cấp độ trực quan (Interactive 7-Level Span Stepper)**:
       - Thanh 7 đốt tròn liên kết từ Level 1 đến Level 7.
       - Các đốt khả dụng nằm trong dải `min_level`..`max_level` sáng rực rỡ theo màu danh mục, có nhãn cấp độ (L1..L7) và tên ngắn (Follow, Assist, Apply, Enable, Ensure, Initiate, Strategy).
       - Các đốt không khả dụng bị làm mờ (opacity 30%), nền xám nhạt, có gạch chéo mờ thể hiện kỹ năng không tồn tại ở level này theo chuẩn quốc tế.
       - Tương tác: Nhấp vào bất kỳ đốt khả dụng nào sẽ kích hoạt tab xem mô tả của level đó và cập nhật query param `?level=...`.
  3. `client/components/sfia/SfiaLevelStatementCards.tsx`:
     - Tab bar chuyển đổi giữa các level khả dụng của kỹ năng.
     - Thẻ mô tả năng lực hành vi của level đang chọn:
       - **Bản chất cấp độ chung (`sfia.levels.essence`)**: Đặt trong khối Callout viền màu nổi bật, in nghiêng, giải thích triết lý của level.
       - **Phát biểu năng lực hành vi chi tiết (`sfia.skill_levels.description`)**: Trình bày rõ ràng, thụt dòng bullet point cho các nhiệm vụ cụ thể.
  4. Khối Ghi chú hướng dẫn (`guidance_notes`): Đặt trong thẻ Accordion gập mở tinh tế, chứa các lưu ý ngữ cảnh thực tế của SFIA Foundation.
- **Tiêu chí nghiệm thu Session 3**:
  - Chọn `PROG`: Thanh Stepper hiển thị rõ đốt 1 và 7 bị mờ/khóa, đốt 2-6 sáng màu tím `DEV_IMPL`.
  - Nhấp vào đốt 3: Khung mô tả hiển thị đúng Bản chất Level 3 (Apply) và phát biểu năng lực lập trình độc lập.
  - Bấm "Sao chép Prompt AI": Toast xuất hiện, dán ra có đầy đủ cấu trúc JSON/Markdown rubric.

---

### Phase 4: System Integration Insights — O*NET & Question Bank Tabs (Frontend)
- **Mục tiêu Session**: Xây dựng khung tab liên kết hệ thống thực tế bên dưới trang chi tiết kỹ năng, kết nối dữ liệu SFIA với nghề nghiệp O*NET và Ngân hàng câu hỏi.
- **Nhiệm vụ cụ thể**:
  1. `client/components/sfia/SfiaSystemLinksTab.tsx`:
     - Bộ tab chuyển đổi: `[Nghề nghiệp O*NET liên kết (x)]` và `[Ngân hàng câu hỏi (y)]`.
  2. **Tab 1: Nghề nghiệp O*NET liên quan (`onet_sfia_mappings`)**:
     - Bảng danh sách các nghề đang liên kết với kỹ năng này.
     - Cột: Mã SOC, Tên nghề nghiệp O*NET, Cấp độ mục tiêu (Target Level), Trọng số đánh giá (Weight), Cờ cốt lõi (Core/Supplemental badge).
     - Tương tác: Nhấp vào dòng nghề nghiệp sẽ mở liên kết trực tiếp sang trang `/admin/onet?soc={SOC_CODE}` để xem chi tiết nghề.
     - Trạng thái trống (Empty State): Hiển thị gợi ý nếu kỹ năng chưa được map với nghề O*NET nào.
  3. **Tab 2: Ngân hàng câu hỏi liên kết (`question_bank`)**:
     - Thống kê tóm tắt: Tổng số câu hỏi, Phân bổ theo độ khó (Dễ / Trung bình / Khó).
     - Danh sách câu hỏi mẫu hiện có đang gắn nhãn kỹ năng này: Nội dung tóm tắt câu hỏi, Loại phỏng vấn (HR / Technical), Độ khó, Cấp độ SFIA mục tiêu.
     - Nút hành động: `[Tạo câu hỏi mới cho kỹ năng này]` (chuyển sang trang tạo câu hỏi và điền sẵn mã kỹ năng SFIA).
- **Tiêu chí nghiệm thu Session 4**:
  - Xem kỹ năng `PROG`: Hiển thị danh sách các nghề liên kết như Software Developers (`15-1252.00`), Computer Programmers (`15-1251.00`).
  - Bấm vào nghề O*NET: Điều hướng chính xác sang trang O*NET browser với đúng mã SOC.
  - Tab câu hỏi hiển thị số lượng và phân bổ câu hỏi rõ ràng.

---

### Phase 5: SFIA Matrix Grid 2D & Slide-Over Inspection Sheet (Frontend)
- **Mục tiêu Session**: Xây dựng bảng ma trận 2 chiều 147 kỹ năng x 7 Cấp độ trách nhiệm với khả năng cuộn 2 chiều cố định tiêu đề, xem nhanh qua Slide-over Sheet, và bộ lọc điểm mù.
- **Nhiệm vụ cụ thể**:
  1. `client/components/sfia/SfiaMatrixView.tsx`:
     - Bảng ma trận 2 chiều kích thước lớn.
     - **Sticky Header**: Dòng tiêu đề 7 Cấp độ (Level 1 ➔ Level 7) cố định khi cuộn dọc.
     - **Sticky Skill Column**: Cột đầu tiên chứa Mã code và Tên kỹ năng cố định khi cuộn ngang.
     - Hàng gom theo 6 Danh mục màu với thanh tiêu đề phân nhóm rõ ràng.
  2. **Trạng thái Ô Ma Trận (Cell States)**:
     - **Ô khả dụng (Active Cell)**:
       - Tô màu nền nhẹ, viền đậm theo màu danh mục.
       - Hiển thị nhãn cấp độ (ví dụ `L3`).
       - Sub-badge: Hiển thị số câu hỏi hoặc số nghề O*NET nếu bật toggle.
       - **Hover Tooltip**: Di chuột vào hiển thị Popover tóm tắt 2 dòng đầu của phát biểu năng lực.
       - **Click Action**: Mở **Slide-over Sheet** từ cạnh phải màn hình.
     - **Ô không khả dụng (Inactive Cell)**: Nền xám mờ (`bg-surface-raised/40`), có dấu gạch ngang (`—`).
  3. `client/components/sfia/SfiaMatrixInspectionSheet.tsx`:
     - Slide-over Sheet trượt từ cạnh phải khi nhấp vào ô bất kỳ.
     - Giữ nguyên vị trí cuộn trên ma trận.
     - Hiển thị toàn văn mô tả năng lực của kỹ năng tại level vừa nhấp.
     - Hiển thị số lượng câu hỏi và danh sách nghề O*NET đang dùng.
     - Nút hành động: `[Mở trong Cây danh mục]` (chuyển sang Tab 1 và chọn đúng kỹ năng + level).
  4. `client/components/sfia/SfiaMatrixToolbar.tsx`:
     - Bộ lọc theo Danh mục (Dropdown: Tất cả / Strategy / Development /...).
     - Toggle hiển thị thông tin trong ô: "Chỉ hiện Level" / "Hiện số câu hỏi" / "Hiện số nghề O*NET".
     - Bộ lọc "Điểm mù" (Blind Spots Toggle): Chỉ highlight những ô khả dụng nhưng hiện có 0 câu hỏi.
     - Nút `[📥 Xuất ma trận CSV]`.
- **Tiêu chí nghiệm thu Session 5**:
  - Cuộn ma trận mượt mà, dòng tiêu đề và cột tên kỹ năng giữ nguyên vị trí (Sticky headers hoạt động hoàn hảo).
  - Hover ô hiển thị Tooltip sắc nét, không bị giật lag.
  - Nhấp vào ô mở Slide-over Sheet trượt êm ái; bấm "Mở trong Cây danh mục" chuyển tab chính xác.
  - Bấm nút xuất CSV tải xuống file bảng tính chuẩn UTF-8.

---

### Phase 6: Generic Attributes & 7 Responsibility Levels Dual-View (Frontend)
- **Mục tiêu Session**: Xây dựng màn hình tra cứu 7 Cấp độ trách nhiệm và 5 Thuộc tính năng lực nền tảng với 2 chế độ xem: Theo Cấp độ và Bảng so sánh tiến trình.
- **Nhiệm vụ cụ thể**:
  1. `client/components/sfia/SfiaGenericAttributesView.tsx`:
     - Thanh chuyển đổi 2 chế độ xem: `[Chế độ Theo Cấp độ]` và `[Chế độ So sánh Tiến trình]`.
  2. **Chế độ 1: Theo Cấp độ (Level-Centric View)**:
     - Thanh Stepper 7 cấp độ nằm ngang ở trên cùng (Level 1 ➔ Level 7).
     - Khung Hero của Level đang chọn:
       - Tên cấp độ chuẩn quốc tế (ví dụ: `Level 4 — Enable / Chủ động & Tạo điều kiện`).
       - Bản chất cốt lõi (`essence`) đặt trong khối Callout viền nổi bật.
       - Mô tả trách nhiệm quyền hạn chung (`description`).
     - Lưới 5 Thẻ thuộc tính năng lực cốt lõi:
       1. **Autonomy (Mức độ tự chủ)**: Mức độ giám sát, phạm vi tự quyết định.
       2. **Influence (Mức độ ảnh hưởng)**: Tác động đến nhóm, tổ chức và đối tác.
       3. **Complexity (Độ phức tạp)**: Tính chất và độ phi cấu trúc của vấn đề.
       4. **Business skills (Kỹ năng kinh doanh)**: Giao tiếp, cộng tác, bảo mật, đạo đức số.
       5. **Knowledge (Kiến thức)**: Mức độ tiếp thu và ứng dụng chuyên môn.
  3. **Chế độ 2: Ma trận Tiến Hóa Thuộc Tính (Progression Matrix View)**:
     - Bảng so sánh tiến trình: Hàng là 5 thuộc tính lớn, Cột là 7 Level từ 1 đến 7.
     - Cho phép đọc ngang để thấy rõ bước nhảy vọt năng lực từ người thực thi (Level 1) đến lãnh đạo chiến lược (Level 7).
- **Tiêu chí nghiệm thu Session 6**:
  - Chuyển đổi giữa 2 chế độ xem mượt mà, không mất trạng thái.
  - Đọc hiểu lộ trình thăng tiến trực quan, hiển thị đầy đủ văn bản định nghĩa của SFIA 9.

---

### Phase 7: Coverage Analytics Dashboard & Blind Spot Alerts (Frontend)
- **Mục tiêu Session**: Xây dựng phân hệ báo cáo độ phủ năng lực, biểu đồ phân tích trực quan và danh sách cảnh báo điểm mù.
- **Nhiệm vụ cụ thể**:
  1. `client/components/sfia/SfiaAnalyticsView.tsx`:
     - 4 Thẻ KPI tổng quan:
       - Tổng số kỹ năng SFIA (147).
       - Tỷ lệ kỹ năng đã có câu hỏi trong ngân hàng (% và số lượng).
       - Tỷ lệ kỹ năng đã được map với O*NET.
       - Tổng số ô năng lực điểm mù (0 câu hỏi).
     - **Biểu đồ cột phân bổ kỹ năng theo 6 Danh mục**: Số kỹ năng và số câu hỏi tương ứng trong từng nhóm.
     - **Biểu đồ tỷ lệ phủ câu hỏi theo 7 Cấp độ trách nhiệm (Levels 1-7)**.
     - **Bảng xếp hạng Top 10 Kỹ năng SFIA phổ biến nhất** trong các nghề O*NET.
  2. `client/components/sfia/SfiaBlindSpotsTable.tsx`:
     - Bảng danh sách các kỹ năng chưa có câu hỏi nào trong ngân hàng câu hỏi.
     - Cột: Mã code, Tên kỹ năng, Danh mục, Dải level, Số nghề O*NET đang cần.
     - Nút hành động: `[Tạo câu hỏi cho kỹ năng này]` và `[📥 Xuất danh sách điểm mù CSV]`.
- **Tiêu chí nghiệm thu Session 7**:
  - Toàn bộ các chỉ số hiển thị logic, đồng nhất với dữ liệu các tab khác.
  - Bấm xuất CSV tải về file danh sách điểm mù chính xác.
  - **CỘT MỐC QUAN TRỌNG: Toàn bộ Frontend (Phase 1 ➔ 7) hoàn chỉnh 100%, Admin nghiệm thu thực tế trên trình duyệt đạt yêu cầu mới chuyển sang Backend**.

---

### Phase 8: Backend NestJS Endpoints & Schema Queries (Backend)
- **Mục tiêu Session**: Xây dựng các API endpoints thực tế trên module `sfia` của NestJS, truy vấn trực tiếp từ PostgreSQL schema `sfia` và các bảng liên kết `onet_sfia_mappings`, `question_bank`.
- **Nhiệm vụ cụ thể**:
  1. `server/src/modules/sfia/sfia-admin.controller.ts`:
     - `@Get('taxonomy')`: Trả về danh sách 6 danh mục, 22 phân nhóm và toàn bộ 147 kỹ năng kèm dải level.
     - `@Get('skills/:code')`: Trả về chi tiết kỹ năng, các bản mô tả cấp độ (`sfia.skill_levels`), và danh sách nghề O*NET + câu hỏi liên quan.
     - `@Get('matrix')`: Trả về toàn bộ dữ liệu ma trận 147 kỹ năng x 7 level kèm số câu hỏi và nghề O*NET.
     - `@Get('generic-attributes')`: Trả về 7 cấp độ trách nhiệm và 16 thuộc tính chung kèm tiêu chuẩn qua các level.
     - `@Get('analytics/coverage')`: Trả về số liệu thống kê độ phủ và danh sách điểm mù.
  2. `server/src/modules/sfia/sfia-admin.service.ts`:
     - Triển khai nghiệp vụ tổng hợp dữ liệu, lọc và tính toán thống kê.
  3. `server/src/modules/sfia/repositories/sfia-admin.repository.ts`:
     - Viết các câu lệnh SQL tối ưu hiệu năng trên schema `sfia` kèm `LEFT JOIN` với `onet_sfia_mappings` và `question_bank`.
     - Tuân thủ nghiêm ngặt Presentation Layer Isolation (Controller không gọi trực tiếp PrismaService).
  4. Unit Tests:
     - `sfia-admin.controller.spec.ts`: Test các endpoints, mã HTTP status, xử lý tham số.
     - `sfia-admin.service.spec.ts`: Test logic tổng hợp ma trận, thống kê độ phủ.
- **Tiêu chí nghiệm thu Session 8**:
  - Chạy `npm run test -- sfia-admin`: 100% tests pass.
  - Kiểm tra các queries SQL phản hồi dưới 50ms nhờ tận dụng indexes có sẵn.

---

### Phase 9: E2E Integration, URL Deep Linking & Final Acceptance (Tích Hợp)
- **Mục tiêu Session**: Chuyển đổi Frontend từ Mock Service sang API thật, kiểm thử liên kết sâu URL, tối ưu hóa giao diện và hoàn tất tài liệu nghiệm thu.
- **Nhiệm vụ cụ thể**:
  1. `client/services/sfia-admin.service.ts`: Đổi cờ `USE_MOCK = false`, gọi trực tiếp các API NestJS Backend qua `apiClient`.
  2. Kiểm thử Deep Linking:
     - Chia sẻ link `/admin/sfia?tab=taxonomy&skill=PROG&level=3` tự động mở đúng tab, bung mở đúng cây danh mục, chọn kỹ năng `PROG` và hiển thị mô tả Level 3.
     - Chia sẻ link `/admin/sfia?tab=matrix&category=DEV_IMPL` tự động lọc đúng nhóm trong ma trận.
  3. Kiểm tra hiển thị Dark Mode / Light Mode trên toàn bộ các bảng, thẻ, stepper và drawer.
  4. Tạo tài liệu `walkthrough.md` tổng kết và nghiệm thu toàn diện toàn bộ tính năng.
- **Tiêu chí nghiệm thu Session 9**:
  - Dữ liệu thật từ PostgreSQL hiển thị đầy đủ, chính xác 100%.
  - Giao diện mượt mà, thời gian tải trang dưới 500ms, 0 lỗi console, sẵn sàng đưa vào vận hành.
