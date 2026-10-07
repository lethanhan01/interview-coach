# HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG TOÀN DIỆN (INTERVIEWCOACH LOCAL RUNNING GUIDE)

Tài liệu này cung cấp chi tiết:
1. **Phân tích nguyên nhân gốc rễ (Root Cause Analysis)** của lỗi biên dịch khi chạy server.
2. **Giải pháp đã khắc phục triệt để (Applied Fixes)**.
3. **Trình tự và câu lệnh khởi chạy đúng cách (Step-by-step Running Guide)**.
4. **Hướng dẫn sử dụng Script 1-Click tự động hóa (`scripts/dev-all.bat` / `scripts/dev-all.ps1`)**.

---

## 1. PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS)

Khi chạy `npm run start:dev` trên `server/`, quá trình khởi động thực hiện `prebuild` (`prisma generate`) rồi đến `nest build` (biên dịch TypeScript). Quá trình này đã gặp **12 lỗi biên dịch TypeScript (Exit code 1)**:

### 1.1 Xung đột Type Global Multer (`idempotency.interceptor.ts:27:11`)
- **Triệu chứng**:
  ```text
  error TS2430: Interface 'AuthenticatedRequest' incorrectly extends interface 'Request'.
  Types of property 'file' are incompatible.
  Type '{ originalname?: string; ... }' is not assignable to type 'File | undefined'.
  ```
- **Nguyên nhân**:
  Khi cài đặt `@types/multer` làm devDependency, thư viện này kích hoạt declaration merging toàn cục (global type augmentation) lên `Express.Request`, định nghĩa thuộc tính `file?: Express.Multer.File`.
  Trước đó, interface nội bộ `AuthenticatedRequest extends Request` trong `idempotency.interceptor.ts` tự khai báo thuộc tính `file?: { originalname?: string; size?: number; mimetype?: string; buffer?: Buffer; }`. Kiểu tùy biến này thiếu 6 thuộc tính bắt buộc của `Express.Multer.File` (`fieldname`, `encoding`, `destination`, `filename`, `path`, `stream`), dẫn đến vi phạm quy tắc kế thừa giao diện của TypeScript.

### 1.2 Lệch chuẩn Enum `ErrorCode` (`error-code.enum.ts`)
- **Triệu chứng**:
  ```text
  error TS2551: Property 'AI_SERVICE_UNAVAILABLE' does not exist on type 'typeof ErrorCode'.
  error TS2339: Property 'UNSUPPORTED_MEDIA_TYPE' does not exist on type 'typeof ErrorCode'.
  ```
- **Nguyên nhân**:
  Các thành phần mới của Phase 1 (`MediaController`, `PythonAiClient`, `AIGatewayDispatcher`) sử dụng các mã lỗi chuẩn REST và microservice (`UNSUPPORTED_MEDIA_TYPE` tương ứng HTTP 415 và `AI_SERVICE_UNAVAILABLE` tương ứng HTTP 502/503), nhưng trong enum tập trung `server/src/core/common/exceptions/error-code.enum.ts` trước đó chưa khai báo 2 giá trị này.

---

## 2. CÁC BIỆN PHÁP KHẮC PHỤC TRIỆT ĐỂ ĐÃ ÁP DỤNG

1. **Chuẩn hóa `idempotency.interceptor.ts`**:
   Đồng bộ `AuthenticatedRequest.file` kế thừa trực tiếp kiểu `Express.Multer.File` chính thức từ `@types/multer`, loại bỏ hoàn toàn xung đột declaration merging:
   ```typescript
   interface AuthenticatedRequest extends Request {
     user?: { id?: string; user?: { id?: string } };
     file?: Express.Multer.File;
   }
   ```
2. **Bổ sung chính thức vào `ErrorCode` Enum (`error-code.enum.ts`)**:
   Bổ sung 2 enum values có phân nhóm rõ ràng:
   - `AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE'` (nhóm AI)
   - `UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE'` (nhóm General & Infra)
3. **Đồng bộ hóa Secret giữa các tầng**:
   Đã cấu hình đồng bộ `INTERNAL_AI_SECRET=dev-secret-internal-ai-key` trong cả `server/.env` và `ai-service/.env`, bảo đảm mọi request liên dịch vụ qua header `x-internal-secret` được xác thực thành công.
4. **Kiểm tra nghiệm thu**:
   - `npm run build` trên `server/`: **Thành công 100% (0 errors)**.
   - `npm test` trên `server/`: **91/91 test suites, 802/802 tests passed**.
   - `npm run check:conventions`: **100% compliant**.

---

## 3. HƯỚNG DẪN KHỞI CHẠY ĐÚNG CÁCH (STEP-BY-STEP)

Hệ thống InterviewCoach hoạt động theo mô hình **Pragmatic Polyglot Architecture**, bao gồm 4 dịch vụ cần chạy song song trong quá trình phát triển:

```
[Port 6379] Redis (Docker)
[Port 5432] PostgreSQL (Host OS / VPS)
[Port 8000] AI Service (Python FastAPI & Speech Pipeline)
[Port 3000] Backend Orchestrator (NestJS API & BullMQ Workers)
[Port 5173] Frontend Client (Next.js 15)
```

---

### Cách 1: Khởi Chạy 1-Click Tự Động (Khuyên Dùng Trên Windows)

Trong thư mục gốc của dự án, mở terminal hoặc click đúp chuột vào file script:
```powershell
# Chạy file Batch:
.\scripts\dev-all.bat

# Hoặc chạy file PowerShell:
.\scripts\dev-all.ps1
```

Script sẽ tự động:
1. Bật container Redis qua Docker Compose.
2. Mở một cửa sổ riêng khởi chạy `ai-service` trên port 8000 (`uv run uvicorn`).
3. Mở một cửa sổ riêng khởi chạy `server` trên port 3000 (`npm run start:dev`).
4. Mở một cửa sổ riêng khởi chạy `client` trên port 5173 (`npm run dev`).

---

### Cách 2: Khởi Chạy Từng Dịch Vụ Độc Lập (Manual Multi-Terminal)

Nếu bạn muốn kiểm soát chi tiết từng dịch vụ hoặc debug logs:

#### Bước 1: Khởi động Redis
Mở terminal tại thư mục `server/`:
```bash
npm run infra:up
```
*(Lệnh này chạy container `interviewcoach-redis` trên port 6379).*

#### Bước 2: Khởi động AI Service (Python FastAPI)
Mở terminal thứ 2 tại thư mục `ai-service/`:
```bash
# Đảm bảo đã có uv:
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Endpoint kiểm tra sức khỏe: `http://localhost:8000/healthz`
- Swagger UI tài liệu API: `http://localhost:8000/docs`

#### Bước 3: Khởi động NestJS Backend
Mở terminal thứ 3 tại thư mục `server/`:
```bash
npm run start:dev
```
- API Base URL: `http://localhost:3000/api/v1`
- Swagger API Docs: `http://localhost:3000/docs`

#### Bước 4: Khởi động Next.js Frontend
Mở terminal thứ 4 tại thư mục `client/`:
```bash
npm run dev
```
- Truy cập giao diện ứng viên: `http://localhost:5173`

---

## 4. BẢNG KIỂM TRA SỨC KHỎE SAU KHI KHỞI CHẠY

| Dịch vụ | URL Kiểm Tra | Kết quả mong đợi |
| :--- | :--- | :--- |
| **Redis** | `docker ps` | Container `interviewcoach-redis` trạng thái `Up (healthy)` |
| **AI Service** | `GET http://localhost:8000/healthz` | `{"status":"ok","timestamp":"...","version":"0.1.0"}` |
| **NestJS Backend** | `GET http://localhost:3000/health` | `{"status":"ok","info":{"database":{"status":"up"}}}` |
| **Swagger UI** | `GET http://localhost:3000/docs` | Hiển thị bảng điều khiển API đầy đủ module `Media` |
| **Client UI** | `GET http://localhost:5173` | Giao diện phòng thi trực tiếp, hiển thị đầy đủ Voice Recorder |

---

## 5. MỘT SỐ LƯU Ý KHI GẶP SỰ CỐ (TROUBLESHOOTING)

1. **Lỗi `ECONNREFUSED 127.0.0.1:6379`**:
   - Nguyên nhân: Redis chưa được bật.
   - Khắc phục: Chạy `cd server && npm run infra:up` hoặc kiểm tra Docker Desktop đã mở chưa.
2. **Lỗi `P1001: Can't reach database server at 10.66.66.1:5432`**:
   - Nguyên nhân: Chưa kết nối VPN vào VPS hoặc database host đang offline.
   - Khắc phục: Bật kết nối VPN WireGuard/Tailscale hoặc cập nhật `DATABASE_URL` trong `server/.env` về localhost nếu chạy PostgreSQL cục bộ.
3. **Microservice AI báo lỗi `401 Unauthorized`**:
   - Nguyên nhân: `INTERNAL_AI_SECRET` trong `server/.env` và `ai-service/.env` không khớp nhau.
   - Khắc phục: Đảm bảo cả hai tệp đều có `INTERNAL_AI_SECRET=dev-secret-internal-ai-key`.
