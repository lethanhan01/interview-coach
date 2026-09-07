# O*NET Admin Browser — Kế hoạch Triển khai Chi tiết (Comprehensive Phased Specification)

## 1. Mục tiêu & Bối cảnh Nghiệp vụ

### 1.1. Bối cảnh
Hệ thống **AI Mock Interview Coach** sử dụng chuẩn phân loại nghề nghiệp của Bộ Lao động Hoa Kỳ (**O\*NET Content Model**) kết hợp với khung năng lực kỹ năng số chuẩn quốc tế (**SFIA 9**) để gán nhãn ngân hàng câu hỏi, phân tích JD và đánh giá phỏng vấn ứng viên.
Dữ liệu O\*NET trong PostgreSQL bao gồm:
- **`onet.occupation_data`**: 1.016 mã nghề chuẩn SOC (Standard Occupational Classification) phân bổ trên 23 nhóm ngành lớn (Major Groups).
- **`onet.job_titles`**: 54.269 chức danh thay thế / chức danh thị trường (Alternate Job Titles) được index GIN Trigram (`pg_trgm`).
- **`onet.software_skills`**: 31.821 công cụ và công nghệ phần mềm, có cờ `hot_technology` ('Y'/'N') và `in_demand` ('Y'/'N').
- **`onet.task_statements`**: Danh sách nhiệm vụ công việc thực tế được phân loại thành Core Tasks (nhiệm vụ cốt lõi) và Supplemental Tasks (nhiệm vụ bổ trợ).
- **`onet.job_zones` & `onet.job_zone_reference`**: 5 cấp độ kinh nghiệm, trình độ học vấn và thời gian đào tạo cần thiết cho từng nghề.
- **`public.onet_sfia_mappings`**: Bảng ánh xạ kết nối giữa mã nghề O\*NET SOC (`onet_soc_code`) và mã kỹ năng SFIA 9 (`sfia_skill_code`) kèm cấp độ mục tiêu (`target_sfia_level`), trọng số (`default_weight`), cờ cốt lõi (`is_core`) và nguồn gốc (`source`).

### 1.2. Chiến lược Thực thi "Frontend-First & Phân kỳ theo từng Session"
- **Ưu tiên Frontend trước (Phase 1 → 4)**: Xây dựng toàn bộ giao diện, bố cục, luồng tương tác và quản trị CRUD thông qua **Client Mock Data Service** với dữ liệu mẫu phong phú, sát thực tế. Quản trị viên có thể trải nghiệm trực tiếp trên trình duyệt thật (`npm run dev`), đánh giá visual, tinh chỉnh trải nghiệm người dùng (UX) cho đến khi hoàn toàn ưng ý.
- **Backend & Tích hợp sau (Phase 5 → 6)**: Sau khi Frontend đã được nghiệm thu 100%, tiến hành xây dựng các API endpoints NestJS, DTOs validation, queries cơ sở dữ liệu PostgreSQL (`onet` schema & `onet_sfia_mappings`) và chuyển đổi client từ mock sang API thật.
- **Quy tắc Chuyển giao giữa các Phase**: Sau mỗi Phase, hệ thống sẽ dừng lại, báo cáo kết quả và cập nhật `walkthrough.md` để người dùng kiểm tra trực tiếp trên trình duyệt rồi mới chuyển sang Phase tiếp theo.

---

## 2. Đặc tả Kịch bản Tương tác Người dùng & UX Edge Cases (User Stories & Interaction Matrix)

### 2.1. Trải nghiệm Responsive & Chuyển đổi Thiết bị
- **Desktop (Màn hình ≥ 1024px)**:
  - Bố cục 2 cột Master-Detail: Master Sidebar rộng cố định 340px bám sát bên trái (Sticky / Fixed height với thanh cuộn riêng).
  - Detail Panel chiếm toàn bộ phần diện tích còn lại, tự động thích ứng kích thước và cuộn độc lập.
- **Tablet & Mobile (Màn hình < 1024px)**:
  - Sidebar chuyển thành **Slide-in Sheet/Drawer**:
    - Phía trên Detail Panel xuất hiện thanh công cụ điều hướng có nút: `[📂 Danh sách 1.016 Nghề nghiệp]` kèm badge mã nghề đang chọn.
    - Nhấn nút -> Mở Drawer từ cạnh trái màn hình (chiếm 85% chiều rộng trên mobile hoặc 400px trên tablet).
    - Khi người dùng nhấn chọn một nghề trong Drawer -> Drawer tự động đóng lại mượt mà và cuộn màn hình lên đầu Detail Panel.
  - Detail Panel chiếm 100% chiều rộng màn hình, padding được co gọn (`p-4`) để tối ưu hiển thị trên màn hình nhỏ.

---

### 2.2. Ma trận Trạng thái & Luồng Chỉnh sửa Bảng SFIA Mapping (CRUD Inline State Machine)

```
                       ┌────────────────┐
                       │   View Mode    │
                       └───────┬────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼ (Bấm "+ Thêm mới")                  ▼ (Bấm ✏️ "Sửa hàng")
  ┌───────────────────┐                 ┌───────────────────┐
  │ Insert Row Mode   │                 │   Row Edit Mode   │
  │ (Hàng trống đầu)  │                 │ (Inline tại hàng) │
  └─────────┬─────────┘                 └─────────┬─────────┘
            │                                     │
            ├───────────────[ Nhấn ✖️ / Esc ]─────┤
            │ (Hoàn tác / Hủy bỏ về View Mode)    │
            │                                     │
            └───────────────[ Nhấn ✔️ / Enter ]────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Pessimistic Save  │
                    │ (Nút hiện Spinner,  │
                    │  disable nút khác)  │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼ (Thành công 200/201)                ▼ (Lỗi / Validation Fail)
  ┌───────────────────┐                 ┌───────────────────┐
  │  Về View Mode     │                 │ Giữ nguyên Edit   │
  │  + Toast Xanh lá  │                 │ + Viền đỏ ô lỗi   │
  │  + Cập nhật UI    │                 │ + Toast Đỏ báo lỗi│
  └───────────────────┘                 └───────────────────┘
```

#### Quy tắc tương tác chi tiết:
1. **Nguyên tắc Chỉnh sửa Đơn hàng (Single-row Edit Rule)**:
   - Tại một thời điểm, chỉ cho phép duy nhất 1 hàng ở chế độ chỉnh sửa hoặc thêm mới.
   - Nếu Admin đang chỉnh sửa hàng A mà bấm "Sửa" ở hàng B:
     - Nếu hàng A chưa thay đổi: Tự động đưa hàng A về View mode và mở Edit mode ở hàng B.
     - Nếu hàng A đã có dữ liệu thay đổi (isDirty): Hiển thị modal nhắc nhở: *"Bạn có thay đổi chưa lưu ở hàng trước. Bạn có muốn hủy thay đổi đó để sửa hàng này không?"* -> Nếu đồng ý mới chuyển sang hàng B.
2. **Ràng buộc Dải Level SFIA Thông minh (Dynamic Min-Max Level Limiter)**:
   - Khi Admin chọn kỹ năng SFIA (ví dụ: `PROG` có dải level từ 2 đến 6):
     - Dropdown chọn Level tự động lọc bỏ các option không hợp lệ (Level 1 và Level 7 bị ẩn hoặc disabled).
     - Giá trị mặc định của Level tự động gán bằng `minLevel` nếu giá trị cũ nằm ngoài dải hợp lệ.
3. **Phản hồi Lưu Trầm lặng & Xử lý Lỗi (Pessimistic Save & Error Recovery)**:
   - Khi bấm **Lưu (✔️ Check)**:
     - Nút Lưu lập tức chuyển thành **Loading Spinner** nhỏ.
     - Các nút Hủy và các hàng khác bị disabled tạm thời để chống click đúp (Double-submit prevention).
   - **Kịch bản Thành công**:
     - Hàng cập nhật dữ liệu mới và chuyển về View mode.
     - Xuất hiện thông báo nổi: `<Toast variant="success">` *"Đã lưu ánh xạ kỹ năng SFIA thành công!"*.
   - **Kịch bản Lỗi (Trùng lặp Unique Constraint, rớt mạng, hoặc backend từ chối)**:
     - Không đóng hàng; hàng vẫn giữ nguyên trạng thái Edit mode kèm toàn bộ dữ liệu Admin vừa nhập để không làm mất công sức người dùng.
     - Viền đỏ nổi bật tại trường vi phạm (`border-critical focus:ring-critical`).
     - Xuất hiện thông báo nổi: `<Toast variant="error">` hiển thị chi tiết lý do lỗi (ví dụ: *"Ánh xạ giữa mã nghề này, kỹ năng PROG và cấp độ 3 đã tồn tại trong hệ thống"*).
4. **Hộp thoại Xác nhận Xóa An toàn (Delete Confirmation Guard)**:
   - Khi bấm 🗑️ (Xóa):
     - Không xóa ngay; kích hoạt hộp thoại `<AlertDialog>`.
     - Tiêu đề: *"Xác nhận xóa ánh xạ SFIA"*
     - Nội dung: *"Bạn có chắc chắn muốn xóa ánh xạ kỹ năng {SKILL_CODE} ({SKILL_NAME}) cấp độ {LEVEL} khỏi nghề {SOC_CODE} không? Hành động này sẽ làm thay đổi tiêu chuẩn đánh giá của các bài phỏng vấn liên quan."*
     - Nút hành động: `[Hủy bỏ]` (Ghost) và `[Xác nhận xóa]` (Destructive/Critical Red).
     - Khi xác nhận -> Nút xóa hiển thị spinner -> Xóa khỏi bảng -> Toast thông báo thành công.

---

### 2.3. Điều hướng An toàn & Cảnh báo Thay đổi Chưa Lưu (Unsaved Navigation Guard)
- **Hành vi**: Nếu Admin đang có hàng ở Edit mode hoặc đang nhập hàng thêm mới:
  - Bất chợt nhấn chọn một nghề khác trên Master Sidebar.
  - Hoặc bấm chuyển từ tab `Explorer` sang tab `Analytics`.
  - Hoặc bấm chuyển tab con (`Overview`, `Tech Skills`, `Tasks`...).
- **Xử lý**:
  - Chặn ngay hành vi chuyển trang / chuyển tab.
  - Hiển thị Modal cảnh báo:
    - Tiêu đề: *"Thay đổi chưa được lưu"*
    - Mô tả: *"Bạn đang có các thay đổi chưa được lưu trên bảng ánh xạ SFIA. Nếu rời đi bây giờ, các thay đổi này sẽ bị mất."*
    - Hai nút lựa chọn:
      - `[Ở lại trang]`: Giữ nguyên vị trí hiện tại, tiếp tục cho Admin lưu dữ liệu.
      - `[Rời đi mà không lưu]`: Hủy bỏ chế độ sửa (Discard changes) và tiếp tục thực hiện hành động chuyển đổi của người dùng.

---

### 2.4. Phím tắt Bàn phím & Khả năng Tiếp cận (Keyboard Accessibility)
- **Khi trong bảng Inline Table**:
  - Phím `Escape`: Hủy bỏ chế độ chỉnh sửa của hàng hiện tại và quay về View mode (kèm xác nhận nếu có thay đổi).
  - Phím `Enter` (khi đang focus trong ô Weight hoặc ô Level): Tự động kích hoạt hành động Lưu (Submit).
  - Phím `Tab`: Điều hướng tuần tự từ Mã Skill -> Level -> Weight -> IsCore Switch -> Nút Lưu -> Nút Hủy.
- **Khi tìm kiếm tại Sidebar**:
  - Nhập ký tự: Debounce 250ms tự động lọc danh sách không cần nhấn Enter.
  - Nút `✕` xuất hiện khi có ký tự để xóa nhanh từ khóa (Clear search).
- **Trong SFIA Combobox**:
  - Phím `Mũi tên Lên / Xuống`: Di chuyển highlight giữa các kỹ năng gợi ý.
  - Phím `Enter`: Chọn kỹ năng đang được highlight và đóng dropdown.

---

### 2.5. Xử lý 4 Trạng thái Giao diện Chuẩn (UI State Definitions)
Mọi component, tab và view đều phải xử lý đầy đủ và đồng bộ 4 trạng thái thị giác:
1. **Loading State**:
   - Sử dụng Skeleton UI đồng nhất (`<Skeleton>` với hiệu ứng pulse mượt mà) tương ứng với layout của từng tab (ví dụ: Skeleton dạng Accordion cho Sidebar, Skeleton dạng Table cho SFIA Tab, Skeleton dạng Card cho Overview Tab).
   - Tuyệt đối không dùng màn hình trắng hoặc loader toàn màn hình gây giật mắt.
2. **Empty State**:
   - Khi tìm kiếm Sidebar không có kết quả: Icon `SearchX`, tiêu đề *"Không tìm thấy nghề nghiệp"*, mô tả *"Không có mã nghề hoặc chức danh nào khớp với từ khóa '{query}'"*, nút *"Xóa bộ lọc"*.
   - Khi nghề chưa có SFIA Mapping: Icon `Network` / `Sparkles`, tiêu đề *"Chưa có ánh xạ năng lực SFIA"*, mô tả *"Nghề này chưa được kết nối với khung kỹ năng SFIA 9"*, nút nổi bật `+ Thêm ánh xạ SFIA đầu tiên`.
   - Khi lọc Hot Tech không có công cụ: Icon `Flame`, mô tả *"Nghề này không có công cụ nào thuộc danh mục Hot Technology"*, nút *"Xem tất cả công cụ"*.
3. **Error State**:
   - Icon `AlertCircle` màu critical, thông báo lỗi thân thiện kèm nút `[Thử lại]` để gọi lại service.
4. **Success / Content State**:
   - Giao diện hoàn chỉnh với micro-animations khi hover, badge semantic sắc nét và độ tương phản cao.

---

## 3. Kế hoạch Triển khai 6 Phase Chi tiết

### Phase 1: Layout Shell, Điều hướng, Mock Service & Master Sidebar (✅ Hoàn thành)

**Mục tiêu**: Thiết lập bộ khung điều hướng trang `/admin/onet`, cơ chế cấp dữ liệu mẫu (Mock Service), bộ chuyển đổi 2 chế độ xem (`Analytics` vs `Explorer`), và Master Sidebar phân cấp theo 23 nhóm SOC lớn.

**Các công việc cụ thể**:
1. **Menu Navigation**: Cập nhật `client/config/navigation.ts`, thêm mục **"O\*NET Browser"** (icon `BookOpen`, link `/admin/onet`) vào menu quản trị `adminNavigation`.
2. **Client Mock Data Service (`client/services/onet.mock.ts`)**:
   - Dữ liệu 23 Major Groups SOC chuẩn (ví dụ: `15 - Máy tính & Toán học`, `11 - Quản lý`, `17 - Kỹ thuật`...).
   - Danh sách nghề mẫu chi tiết cho nhóm 15 và các nhóm tiêu biểu (Software Developers `15-1252.00`, QA Testers `15-1253.00`, Database Architects `15-1243.00`, Information Security Analysts `15-1212.00`, Data Scientists `15-2051.00`, Computer Systems Architects `15-1299.08`...).
   - Danh sách SFIA 9 skills mock (PROG, TEST, DBDS, ITOP, BURM, DATM...).
3. **Trang chính (`client/app/(admin)/admin/onet/page.tsx`)**:
   - Quản lý đồng bộ URL Query Params (`tab`, `soc`, `detail`, `group`).
   - Top-level Switcher: Tabs chuyển đổi giữa **"Khám phá & Quản lý (Explorer)"** và **"Thống kê & Phân tích (Analytics)"**.
4. **Master Sidebar Component (`client/components/onet/OnetSidebar.tsx`)**:
   - Ô tìm kiếm có debounce (tìm theo mã SOC hoặc tên nghề).
   - Accordion 23 Major Groups: Hiển thị tên nhóm, badge số lượng nghề, badge số lượng mapping. Mặc định mở nhóm 15.
   - Danh sách occupations: Badge mã SOC, chấm tròn trạng thái (xanh lá: đã mapped; xám: chưa mapped).
   - Xử lý Drawer trên Mobile/Tablet (`<Sheet>` trượt từ trái).

**Tiêu chí nghiệm thu Phase 1**:
- [x] Truy cập `/admin/onet` từ thanh menu quản trị thành công.
- [x] Chuyển đổi tab Explorer và Analytics mượt mà, URL cập nhật đúng `?tab=explorer`.
- [x] Sidebar hiển thị đầy đủ 23 Major Groups, mở/đóng accordion mượt, ô tìm kiếm lọc chính xác nghề.
- [x] Click chọn một nghề -> URL cập nhật `?soc=15-1252.00`.
- [x] Trên màn hình nhỏ (<1024px), sidebar tự ẩn và mở qua Drawer nút bấm mượt mà.

---

### Phase 2: Detail Panel — 4 Tab Nội dung (Overview, Tech Skills, Tasks, Alternate Titles) (✅ Hoàn thành)

**Mục tiêu**: Xây dựng Detail Panel hoàn chỉnh bên phải và 4 tab nội dung chuyên sâu phục vụ tra cứu tài liệu O\*NET.

**Các công việc cụ thể**:
1. **Detail Panel Container (`client/components/onet/OnetDetailPanel.tsx`)**:
   - Header hiển thị Mã SOC lớn, Tên nghề, Badge Major Group, nút chia sẻ link.
   - Tabs chuyển đổi giữa 5 tab: `[Tổng quan]`, `[Kỹ năng Phần mềm]`, `[Ánh xạ SFIA]`, `[Nhiệm vụ]`, `[Chức danh Thị trường]`.
2. **Tab 1: Overview (`client/components/onet/OnetOverviewTab.tsx`)**:
   - Đoạn mô tả chuẩn hóa đầy đủ về vai trò nghề nghiệp.
   - Thẻ thông tin Job Zone (mức học vấn, kinh nghiệm yêu cầu, thời gian đào tạo).
   - Grid 4 chỉ số thống kê nhanh của nghề (số tool, số task, số mapping, số alternate titles).
3. **Tab 2: Tech Skills (`client/components/onet/OnetTechSkillsTab.tsx`)**:
   - Interactive Tech Cloud & Grid danh mục công cụ/phần mềm.
   - Filter chips: `Tất cả`, `🔥 Hot Tech`, `⚡ In Demand`.
   - Ô tìm kiếm nhanh công nghệ trong danh sách.
   - Badge màu cam cho Hot Technology, badge màu ngọc lục bảo cho In Demand.
4. **Tab 3: Tasks (`client/components/onet/OnetTasksTab.tsx`)**:
   - Phân loại rõ ràng thành 2 section: **Core Tasks (Nhiệm vụ cốt lõi)** và **Supplemental Tasks (Nhiệm vụ bổ trợ)**.
   - Đánh số thứ tự, có icon và badge nhận diện.
   - Ô tìm kiếm lọc nội dung nhiệm vụ.
5. **Tab 4: Alternate Job Titles (`client/components/onet/OnetAlternateTitlesTab.tsx`)**:
   - Danh sách chức danh thị trường O\*NET.
   - Phân trang gọn gàng (Pagination) và ô tìm kiếm chức danh.

**Tiêu chí nghiệm thu Phase 2**:
- [x] Click bất kỳ nghề nào ở Sidebar -> Detail Panel cập nhật nội dung tức thì.
- [x] Chuyển đổi giữa các tab lưu trạng thái vào URL `?detail=tech`, `?detail=tasks`...
- [x] Tab Tech Skills lọc đúng theo chips "Hot Tech", "In Demand", ô search, hỗ trợ 2 chế độ xem (Category & Cloud) và copy nhanh.
- [x] Tab Tasks hiển thị 2 nhóm nhiệm vụ (Core & Supplemental) rõ ràng, đánh số thứ tự, highlight từ khóa tìm kiếm và copy câu phát biểu.
- [x] Tab Alternate Titles phân trang 10/20/50, ô tìm kiếm chức danh và sao chép lẻ/hàng loạt hoạt động mượt mà.
- [x] Tab Overview hiển thị 4 KPI click chuyển tab, nút sao chép mô tả, và thanh đo trực quan 5 mức Job Zone.

---

### Phase 3: Detail Panel — Tab SFIA Mapping CRUD Inline (✅ Hoàn thành)

**Mục tiêu**: Xây dựng tab Ánh xạ năng lực SFIA với kiến trúc trực quan 2 tầng (**2-Tier Visual Competency Architecture**), gồm **Level Spectrum Bar** (Tier 1) và **Inline Editable Table** (Tier 2), cho phép Admin xem, chỉnh sửa trực tiếp trên hàng, thêm mới qua Combobox gợi ý SFIA, và xóa mapping an toàn.

**Các công việc cụ thể**:
1. **SFIA Tab Container (`client/components/onet/OnetSfiaTab.tsx`)**:
   - Header hiển thị thanh tìm kiếm, bộ lọc Core/Secondary, nút khôi phục dữ liệu mẫu và nút `+ Thêm Ánh xạ Mới`.
   - Tích hợp Level Spectrum Bar (Tier 1) phản ánh phân bố cấp độ L1–L7 của toàn bộ nghề nghiệp.
   - Bảng hiển thị danh sách mappings với các cột: Kỹ năng SFIA, Cấp độ mục tiêu & Thang đo 7 mức (Mini Gauge), Trọng số (Weight), Vai trò (Core/Secondary), Nguồn (Source), Thao tác (Actions).
2. **Hàng Bảng Inline Editable (`client/components/onet/OnetSfiaRow.tsx`)**:
   - **View Mode**: Hiển thị dữ liệu dạng Badge và Text chuẩn token; thanh 7-bar Mini Gauge trực quan; Popover tra cứu định nghĩa SFIA 9; nút ✏️ (Chỉnh sửa) và 🗑️ (Xóa).
   - **Edit Mode**:
     - Cột Level chuyển thành `<Select>` chỉ chứa các level hợp lệ trong dải `[minLevel, maxLevel]` của skill đó, kèm thẻ mô tả trách nhiệm công việc thực tế theo SFIA.
     - Cột Weight chuyển thành `<Input type="number" min="0.1" max="5.0" step="0.1">`.
     - Cột Core chuyển thành `<Switch>`.
     - Cột Actions chuyển thành nút **Lưu (✔️ Check)** và **Hủy (✖️ X)**, hỗ trợ phím tắt Enter và Escape.
3. **Luồng Thêm mới Mapping**:
   - Bấm `+ Thêm Ánh xạ Mới` -> Chèn 1 hàng mới ở đầu bảng.
   - Ô Kỹ năng SFIA sử dụng `<Combobox>` tìm kiếm theo mã hoặc tên kỹ năng (ví dụ gõ "prog" -> gợi ý `PROG - Lập trình/phát triển phần mềm`).
   - Sau khi chọn Skill: Dropdown Level tự động tính toán và giới hạn chỉ cho chọn các level hợp lệ của skill đó.
   - Bấm Lưu -> Thêm vào danh sách mock state -> Hiển thị Toast thông báo thành công.
4. **Luồng Xóa Mapping**:
   - Bấm 🗑️ -> Mở `<AlertDialog>` xác nhận: *"Bạn có chắc chắn muốn xóa ánh xạ kỹ năng SFIA {CODE} level {LEVEL}?"* -> Xác nhận -> Xóa khỏi bảng.
5. **Cảnh báo Thay đổi Chưa lưu (`UnsavedNavigationGuard`)**:
   - Chặn chuyển nghề/chuyển tab/chuyển hàng khi đang có hàng ở Edit mode và hiển thị modal cảnh báo an toàn.

**Tiêu chí nghiệm thu Phase 3**:
- [x] Kiến trúc 2 tầng (Tier 1 Visual Spectrum Bar + Tier 2 Inline Table) trực quan, có 4 KPI cards và pin kỹ năng click-to-highlight.
- [x] Bấm Sửa trên hàng -> Chuyển thành form inline mượt mà, áp dụng đúng Single-row Edit Rule.
- [x] Dropdown Level không cho phép chọn ngoài khoảng min-max của kỹ năng, hiển thị mô tả trách nhiệm trực tiếp theo cấp độ.
- [x] Thêm mới qua Combobox mượt mà, hỗ trợ tìm kiếm nhanh theo mã hoặc tên kỹ năng SFIA 9.
- [x] Xóa có modal xác nhận an toàn (`AlertDialog`), có toast feedback rõ ràng.
- [x] Chuyển nghề/chuyển tab/chuyển hàng khi đang sửa -> Modal cảnh báo `UnsavedNavigationGuard` xuất hiện đúng yêu cầu.

---

### Phase 4: Chế độ xem Thống kê & Phân tích (Analytics Dashboard View) (✅ Hoàn thành)

**Mục tiêu**: Xây dựng màn hình Dashboard tổng quan giúp quản trị viên nắm bắt các chỉ số vĩ mô về chuẩn O\*NET và độ hoàn thiện dữ liệu mapping SFIA.

**Các công việc cụ thể**:
1. **Analytics View Container (`client/components/onet/OnetAnalyticsView.tsx`)**:
   - Bố cục lưới 3 tầng thông minh, cân đối các khối thông tin, header banner với nút làm mới reactive.
2. **KPI Summary Cards (`client/components/onet/OnetSummaryCards.tsx`)**:
   - 4 thẻ chỉ số: Tổng số nghề chuẩn (1.016), Tổng số mapping O\*NET ↔ SFIA, Tỷ lệ bao phủ nhóm IT (%), Tổng số công nghệ và số Hot Tech.
   - Gradient tinh tế, icon Lucide sắc nét, số liệu trực quan `tabular-nums`.
3. **Biểu đồ Phân bổ 23 Major Groups (`client/components/onet/SocGroupDistributionChart.tsx`)**:
   - Biểu đồ phân bổ tỷ lệ các nhóm nghề SOC bằng CSS/SVG nhẹ, tương thích 100% theme, highlight đặc biệt nhóm 15 - Computer & Math.
   - Hỗ trợ chuyển đổi giữa [Số lượng nghề] và [Tỷ lệ đã mapped %], tooltip chi tiết và click cross-filter xuống bảng Top Nghề.
4. **Bảng Top Nghề Quan tâm nhất (`client/components/onet/OnetTopOccupations.tsx`)**:
   - Danh sách các nghề nghiệp có lượng ứng viên và JD liên kết cao nhất, thứ hạng vinh danh `#1 - #3`.
   - Tìm kiếm, sắp xếp theo Lượt luyện phỏng vấn / JD / Mapping, phân trang 10/20/50, và điều hướng kép sang Explorer:
     - Nút **"Xem trong Explorer"** -> Mở tab con Tổng quan (`overview`).
     - Click badge **"SFIA Mappings"** -> Mở thẳng tab con Ánh xạ SFIA (`sfia`).
5. **Biểu đồ Độ phủ Kỹ năng SFIA (`client/components/onet/SfiaSkillCoverageChart.tsx`)**:
   - Biểu đồ thanh ngang (Horizontal Bar Chart) hiển thị các kỹ năng SFIA được gán nhiều nhất (PROG, TEST, DBDS, ITOP...).
   - Lọc theo Danh mục SFIA, dải level L2–L6, Core/Secondary ratio, và toggle Top 8 <-> 25 kỹ năng.

**Tiêu chí nghiệm thu Phase 4**:
- [x] Chuyển sang tab "Thống kê & Phân tích" hiển thị đầy đủ, đẹp mắt với bố cục 3 tầng cân xứng.
- [x] Biểu đồ 23 Major Groups tương tác mượt, highlight nhóm 15, nhấp cột lọc chéo bảng Top Nghề thành công.
- [x] Biểu đồ SFIA lọc Category mượt mà, mở rộng/thu gọn danh sách kỹ năng tức thì.
- [x] Bảng Top Nghề tìm kiếm, sắp xếp, phân trang chuẩn 10/20/50 hàng.
- [x] Cơ chế điều hướng kép: Bấm nút Explorer mở tab overview; click badge SFIA mở thẳng tab sfia.
- [x] **Nghiệm thu toàn bộ Giai đoạn Frontend**: Giao diện và tương tác đạt 100% yêu cầu trước khi bước sang Backend.

---

### Phase 5: Backend Controller, Service, DTOs Validation & Database Queries

**Mục tiêu**: Xây dựng toàn bộ hạ tầng Backend trong NestJS tuân thủ nghiêm ngặt Bounded Contexts, Presentation Layer Isolation và Transactional Integrity.

**Các công việc cụ thể**:
1. **DTOs Validation**:
   - Tạo `server/src/modules/onet/dto/onet-admin.dto.ts` (các response DTOs).
   - Tạo `CreateOnetSfiaMappingDto` và `UpdateOnetSfiaMappingDto` với decorator `class-validator`, `class-transformer`.
2. **OnetAdminService (`server/src/modules/onet/onet-admin.service.ts`)**:
   - Tính toán thống kê KPI thực tế từ PostgreSQL (`onet.occupation_data`, `onet.software_skills`, `public.onet_sfia_mappings`).
   - Phân bổ 23 Major Groups và query Top Occupations join với `user_profiles` & `saved_job_descriptions`.
   - Query chi tiết nghề kèm `job_zones`, software skills, task statements, alternate titles (phân trang).
   - Tích hợp `ISfiaFacade` để lấy danh sách SFIA skills và validate min/max level của kỹ năng.
   - Xử lý CRUD trên `onet_sfia_mappings` bọc trong `prisma.$transaction`, kiểm tra lỗi Unique Constraint.
3. **OnetAdminController (`server/src/modules/onet/onet-admin.controller.ts`)**:
   - Định nghĩa 13 endpoints admin với `@Roles(UserRole.admin)`, `@ApiTags('O*NET Admin')`, `@ApiCookieAuth('cookieAuth')`.
4. **Khai báo Module (`server/src/modules/onet/onet.module.ts`)**:
   - Import `SfiaModule` lấy provider `ISfiaFacade`.
   - Đăng ký `OnetAdminController` và `OnetAdminService`.
5. **Unit Tests (`server/src/modules/onet/onet-admin.service.spec.ts`)**:
   - Viết test suite kiểm thử tính toán KPI, validation min/max level, conflict handling, transaction rollback.

**Tiêu chí nghiệm thu Phase 5**:
- Chạy `npm test -- onet-admin.service.spec.ts` vượt qua 100% tests.
- Chạy `npm run lint` backend không có cảnh báo hoặc lỗi type.
- Swagger API Docs (`/api/docs`) hiển thị đầy đủ nhóm O\*NET Admin endpoints.

---

### Phase 6: Ghép nối API Thật, Phân quyền Admin & Kiểm thử E2E Toàn diện

**Mục tiêu**: Kết nối Frontend với Backend thật, kiểm tra phân quyền bảo mật và nghiệm thu luồng nghiệp vụ thực tế từ đầu đến cuối.

**Các công việc cụ thể**:
1. **Chuyển đổi Client Service (`client/services/onet.service.ts`)**:
   - Bổ sung các phương thức gọi API thật thông qua `apiClient` (`/onet/admin/...`).
   - Thay thế mock data bằng dữ liệu thật từ database PostgreSQL.
2. **Kiểm thử Phân quyền & Bảo mật**:
   - Kiểm tra tài khoản Candidate không thể truy cập route `/admin/onet` (RoleGuard tự động chuyển hướng).
   - Kiểm tra các endpoint `/onet/admin/*` trả về `403 FORBIDDEN` nếu không có role Admin.
3. **Kiểm thử Luồng Tương tác Thực tế (E2E Manual Verification)**:
   - Dữ liệu 1.016 nghề, 54K titles, 31K tools hiển thị đúng từ DB.
   - Thao tác thêm mapping mới -> Lưu thành công vào DB thật (`SELECT * FROM onet_sfia_mappings`).
   - Thao tác sửa level, weight -> Cập nhật đúng trong DB thật.
   - Thao tác xóa mapping -> Bản ghi bị xóa khỏi DB thật.

**Tiêu chí nghiệm thu Phase 6**:
- Build production client `cd client && npm run build` thành công.
- Toàn bộ tính năng hoạt động trơn tru với dữ liệu thật.

---

## 4. Checklist & Bảng Theo dõi Tiến độ Triển khai

| Phase | Tên Phase | Trọng tâm | Trạng thái |
|---|---|---|---|
| **Phase 1** | Shell, Navigation, Mock Service & Master Sidebar | Frontend UI & Navigation | ✅ Hoàn thành |
| **Phase 2** | Detail Panel 4 Tab nội dung (Overview, Tech, Tasks, Titles) | Frontend UI & Content | ✅ Hoàn thành |
| **Phase 3** | Detail Panel Tab SFIA Mapping CRUD Inline | Frontend Interaction & State | ✅ Hoàn thành |
| **Phase 4** | Chế độ xem Thống kê Analytics Dashboard | Frontend Visual & Analytics | ✅ Hoàn thành |
| **Phase 5** | Backend Controller, Service, DTOs & DB Queries | Backend Architecture & DB | ⏳ Chờ duyệt toàn bộ UI |
| **Phase 6** | Ghép nối API Thật, Phân quyền Admin & E2E Acceptance | Integration & Acceptance | ⏳ Chờ Phase 5 hoàn thành |
