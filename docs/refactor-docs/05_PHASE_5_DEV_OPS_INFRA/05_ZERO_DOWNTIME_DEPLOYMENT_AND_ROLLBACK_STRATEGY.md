# TASK 5.5: TRIỂN KHAI ZERO-DOWNTIME, EXPAND/CONTRACT MIGRATION & CHIẾN LƯỢC ROLLBACK
# (NON-TRANSACTIONAL CONCURRENTLY INDEXING, EXPAND/CONTRACT PATTERN & EMERGENCY BASELINE ROLLBACK)

> **Trạng thái**: Approved / Production Specification  
> **Cấp độ**: Deep Technical Specification (Zero-Downtime Deployments & Safe Database Migrations)  
> **Áp dụng cho**: PostgreSQL, Prisma Migrations, Docker Rolling Updates, `scripts/emergency-rollback.sh`, Đội ngũ DevOps  
> **Tài liệu cha**: [00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.1.0 (Chuẩn hóa toàn diện chuỗi thực thi tuần tự & Thuật ngữ tiếng Anh kỹ thuật)  

---

## 1. PHÂN TÍCH THIẾT KẾ CŨ & NHỮNG ĐIỂM CHƯA CHẶT CHẼ CẦN KHẮC PHỤC

Trong thiết kế triển khai và migration dữ liệu ban đầu, có **3 cạm bẫy kỹ thuật cực kỳ nguy hiểm**:

1. **Cạm Bẫy Khóa Bảng (Table Lock Trap) với Prisma & PostgreSQL `CONCURRENTLY`**:
   * Công cụ `prisma migrate deploy` mặc định gói toàn bộ mã SQL của một migration vào trong **một khối transaction duy nhất (`BEGIN ... COMMIT`)**.
   * Tuy nhiên, PostgreSQL quy định nghiêm ngặt: **Câu lệnh `CREATE INDEX CONCURRENTLY` TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP CHẠY TRONG TRANSACTION BLOCK**.
   * *Hậu quả*: Nếu đưa `CREATE INDEX CONCURRENTLY` vào file migration thông thường, Prisma sẽ báo lỗi Fatal Error và dừng deploy; ngược lại nếu bỏ cờ `CONCURRENTLY`, PostgreSQL sẽ áp dụng **khóa độc quyền (Exclusive Table Lock)** trên bảng `question_bank` trong suốt quá trình xây dựng index vector HNSW, làm toàn bộ hệ thống bị treo trong nhiều phút!
   * *Giải pháp khắc phục*: Sử dụng chỉ thị đặc biệt `-- prisma-disable-transaction` của Prisma để thực thi migration tạo index HNSW bên ngoài khối transaction.
2. **Thiếu Quy Trình Expand/Contract Gây Lỗi Khi Cập Nhật Mã Nguồn**:
   * Nếu thêm trường mới hoặc thay đổi cấu trúc bảng cùng lúc với việc deploy mã nguồn mới, các container phiên bản cũ (vẫn đang phục vụ kết nối người dùng) sẽ gặp lỗi khi đọc ghi dữ liệu.
   * *Giải pháp khắc phục*: Áp dụng triệt để mô hình **Expand/Contract (Tương thích ngược 2 pha)**.
3. **Rollback Làm Mất Dữ Liệu Lịch Sử**:
   * Chưa có hướng dẫn rõ ràng về việc khi rollback từ kiến trúc Python về baseline thuần NestJS thì dữ liệu các cột mới sinh ra sẽ được bảo vệ ra sao.
   * *Giải pháp khắc phục*: Quy định cấm tuyệt đối việc `DROP COLUMN` khi rollback; chỉ chuyển cấu hình provider về baseline NestJS core, giữ nguyên vẹn $100\%$ dữ liệu đã ghi.

---

## 2. QUY TRÌNH MIGRATION CƠ SỞ DỮ LIỆU AN TOÀN (EXPAND / CONTRACT PATTERN)

Mọi thay đổi cấu trúc cơ sở dữ liệu trên môi trường Production phải chia làm 3 bước độc lập:

```mermaid
graph TD
    subgraph Step1["Pha 1: Mở rộng (Expand Phase)"]
        AddCol["Thêm cột mới (NULLable hoặc có Default)<br/>Thêm extension pgvector<br/>Code cũ vẫn chạy bình thường 100%"]
    end

    subgraph Step2["Pha 2: Chuyển dịch (Transition Phase)"]
        DeployCode["Deploy code mới (Ghi đồng thời vào cả cột cũ & mới)<br/>Chạy script background đồng bộ dữ liệu lịch sử<br/>Xây dựng Index HNSW với CONCURRENTLY"]
    end

    subgraph Step3["Pha 3: Thu hẹp (Contract Phase)"]
        Verify["Xác nhận 100% traffic đã chuyển sang code mới<br/>Loại bỏ các trường cũ không còn sử dụng"]
    end

    Step1 --> Step2
    Step2 --> Step3
```

### Xử Lý An Toàn `CREATE INDEX CONCURRENTLY` trong Prisma:
Để Prisma không bọc transaction khi tạo index HNSW, migration được tạo với chỉ thị đặc biệt:
```sql
-- Migration file: prisma/migrations/20261006_create_vector_hnsw_index/migration.sql
-- prisma-disable-transaction

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_bank_embedding_hnsw 
ON question_bank 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```
*(Chỉ thị `-- prisma-disable-transaction` hướng dẫn Prisma thực thi câu lệnh SQL trực tiếp mà không mở `BEGIN ... COMMIT` transaction, ngăn chặn hoàn toàn nguy cơ Table Lock).*

---

## 3. THỨ TỰ CẬP NHẬT ROLLING UPDATE ZERO-DOWNTIME

Khi triển khai bản cập nhật mới trên cụm máy chủ sản xuất:

1. **Bước 1 (Database Migration)**: Chạy `npx prisma migrate deploy` để mở rộng cấu trúc bảng (chỉ thêm cột mới/bảng mới, không sửa/xóa cột cũ).
2. **Bước 2 (Redis Caching)**: Giữ nguyên kết nối Redis, không xóa cache để tránh cache stampede.
3. **Bước 3 (Python AI Service)**: Khởi động container `ai-service` mới song song. Probe kiểm tra `/health` báo `200 OK` mới chuyển sang bước tiếp.
4. **Bước 4 (NestJS Backend)**: Khởi động container backend mới, chuyển dần kết nối HTTP/WebSocket sang phiên bản mới qua Nginx / Docker network.
5. **Bước 5 (Next.js Frontend)**: Cập nhật frontend cuối cùng sau khi toàn bộ backend đã sẵn sàng phục vụ các API contracts mới.

---

## 4. KỊCH BẢN ROLLBACK KHẨN CẤP VỀ THUẦN NESTJS (EMERGENCY ROLLBACK)

Nếu cụm dịch vụ Python hoặc vLLM gặp sự cố bất khả kháng cần hủy bỏ hoàn toàn kiến trúc thử nghiệm:

```mermaid
graph TD
    Incident["Phát hiện Sự cố Nghiêm trọng Cần Rollback"] --> Step1["Bước 1: Chuyển cờ cấu hình môi trường"]
    
    Step1 --> EnvChange["AI_STT_PROVIDER=openai<br/>AI_TTS_PROVIDER=browser<br/>AI_RAG_PROVIDER=prisma<br/>AI_EVALUATION_PROVIDER=openai"]
    
    EnvChange --> Step2["Bước 2: Khởi động lại NestJS Backend"]
    Step2 --> Step3["Bước 3: Dừng container ai-service & vLLM"]
    Step3 --> Verify["Bước 4: Kiểm chứng hệ thống hoạt động ổn định trên NestJS Core"]
```

### Bảo Toàn Dữ Liệu Lịch Sử:
* **Tuyệt đối KHÔNG chạy lệnh `DROP COLUMN`** đối với các cột `embedding` và `tsv_content` trong PostgreSQL.
* Các cột này chỉ chiếm thêm dung lượng đĩa nhưng hoàn toàn vô hại đối với các câu lệnh `SELECT` và `INSERT` thông thường của Prisma Client. Dữ liệu đánh giá của thí sinh trong bảng `ai_feedbacks` vẫn được giữ nguyên vẹn $100\%$.

---

## 5. TASK EXECUTION CONTRACT

### 5.1 Prerequisites (Điều kiện tiên quyết)
* Hoàn thành **Task 5.4** (Bộ Runbook sự cố và cơ chế Failover đã sẵn sàng).
* Cơ sở dữ liệu PostgreSQL đã được cài đặt tiện ích mở rộng `pgvector`.
* Prisma CLI có thể kết nối trực tiếp đến CSDL thông qua biến môi trường `DATABASE_URL`.

### 5.2 Target Deliverables (Sản phẩm bàn giao)
* `server/prisma/migrations/20261006_create_vector_hnsw_index/migration.sql`: File migration có chỉ thị `-- prisma-disable-transaction` tạo index HNSW.
* `scripts/emergency-rollback.sh`: Script tự động chuyển cấu hình biến môi trường về baseline NestJS thuần và restart container.
* Quy trình kiểm thử tải (Load Test Script) đo lường độ trễ transaction trong lúc thực hiện migration.

### 5.3 Verification Commands (Lệnh kiểm thử xác thực)
* **Tier 1 (Kiểm tra Cú pháp Migration & Trạng thái Prisma)**:
  ```bash
  cd server && npx prisma migrate status
  ```
* **Tier 2 (Mô phỏng Zero-Downtime Migration & Rollback)**:
  ```bash
  # 1. Chạy tải nhẹ liên tục đọc bảng question_bank
  # 2. Áp dụng migration tạo index HNSW không khóa bảng
  cd server && npx prisma migrate deploy

  # 3. Chạy script rollback khẩn cấp mô phỏng
  bash scripts/emergency-rollback.sh

  # 4. Kiểm tra sức khỏe hệ thống sau rollback
  curl -s -f http://localhost:4000/api/v1/health | grep -q '"status":"ok"' && echo "ROLLBACK VERIFIED"
  ```

### 5.4 Definition of Done [DoD]
* [ ] **Zero-Downtime Migration**: Quá trình tạo index HNSW trên bảng cơ sở dữ liệu không làm tăng thời gian phản hồi (p99 latency) của các transaction tạo phiên phỏng vấn quá $50\text{ ms}$.
* [ ] **Không Rơi Rớt Kết Nối Người Dùng**: Khi thực hiện rolling update phiên bản mới, tỷ lệ kết nối WebSocket bị đứt đoạn $< 0.1\%$.
* [ ] **Thời Gian Rollback Toàn Diện**: Khi có quyết định rollback khẩn cấp, toàn bộ hệ thống trở về trạng thái hoạt động bình thường trên nền tảng NestJS Core trong vòng $< 3\text{ phút}$.
* [ ] Dữ liệu lịch sử trong các cột `embedding` và `ai_feedbacks` được bảo toàn nguyên vẹn $100\%$ sau rollback.

### 5.5 Next Task Transition (Hoàn tất Toàn bộ Lộ trình Master)
* **🎉 HOÀN TẤT LỘ TRÌNH 25 TASKS (PHASE 1 ĐẾN PHASE 5)**:
  Toàn bộ 25 nhiệm vụ kỹ thuật đã được đặc tả hoàn chỉnh, chuẩn hóa thuật ngữ tiếng Anh kỹ thuật, khớp nối chuỗi thực thi tuần tự từ đầu đến cuối, và sẵn sàng cho việc tự động thực thi mã nguồn an toàn tuyệt đối. Tiến hành nghiệm thu toàn diện theo tiêu chí **Quality Gate 5** tại [00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md).
