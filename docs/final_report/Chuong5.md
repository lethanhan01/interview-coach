# Chương 5. Kết Quả Thu Được Và Đánh Giá

## 5.1 Môi Trường Thực Nghiệm Và Đánh Giá

Phần thực nghiệm được thực hiện trên môi trường chạy local, gồm một ứng dụng frontend Next.js, một backend NestJS và các dịch vụ phụ trợ cho xác thực, lưu trữ dữ liệu, hàng đợi xử lý nền và gọi mô hình AI. Các thông tin phiên bản dưới đây được đối chiếu trực tiếp từ cấu hình trong `client/` và `server/`.

### 5.1.1 Môi trường chạy dự án

| Nhóm | Môi trường | Mục đích |
| --- | --- | --- |
| Frontend | Next.js 16.2.6, App Router, React 19.2.4, React DOM 19.2.4; chạy local tại `http://localhost:5173` bằng `npm run dev`. | Xây dựng giao diện web cho các luồng thiết lập phiên, phỏng vấn, lịch sử và báo cáo. |
| Frontend | Tailwind CSS 4.3.0, `@tailwindcss/postcss` 4.3.0, lucide-react 1.17.0. | Định nghĩa giao diện, bố cục và biểu tượng trong ứng dụng. |
| Frontend | `@supabase/ssr` 0.10.3, `@supabase/supabase-js` 2.107.0, SWR 2.4.1. | Quản lý session, xác thực và gọi dữ liệu phía client. |
| Frontend | TypeScript 5.9.3, ESLint 9.39.4, `eslint-config-next` 16.2.6, Playwright 1.60.0. | Hỗ trợ phát triển, kiểm tra mã nguồn và kiểm thử end-to-end giao diện. |
| Backend | Node.js 20.19.2-alpine3.22 theo Dockerfile production; NestJS `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` 11.1.24; API chạy local tại `http://localhost:3000/api/v1`. | Cung cấp REST API, module nghiệp vụ và runtime cho backend. |
| Backend | `@nestjs/config` 4.0.4, Zod 4.4.3, class-validator 0.15.1, class-transformer 0.5.1. | Đọc cấu hình môi trường và validate dữ liệu request. |
| Backend | `@nestjs/jwt` 11.0.2, `@nestjs/passport` 11.0.5, passport 0.7.0, passport-jwt 4.0.1, cookie-parser 1.4.7. | Xử lý xác thực JWT, guard truy cập và cookie. |
| Backend | BullMQ 5.78.0, `@nestjs/bullmq` 11.0.4, ioredis 5.11.1. | Chạy hàng đợi và worker nền cho sinh câu hỏi, feedback và báo cáo. |
| Backend | TypeScript 5.9.3, Jest 30.4.2, ts-jest 29.4.11. | Hỗ trợ phát triển và kiểm thử backend. |
| Database | PostgreSQL trên Supabase, datasource Prisma `postgresql`, kết nối qua `DATABASE_URL`; phiên bản máy chủ PostgreSQL không được pin trực tiếp trong mã nguồn. | Lưu trữ dữ liệu người dùng, hồ sơ, phiên phỏng vấn, câu trả lời, feedback và báo cáo. |
| Database | Prisma Client 7.8.0, Prisma CLI 7.8.0, `@prisma/adapter-pg` 7.8.0, `pg` 8.21.0. | Truy cập database và đồng bộ schema từ mã nguồn. |
| Database | `DB_TIMEZONE=Asia/Ho_Chi_Minh`, schema dùng `TIMESTAMPTZ`. | Chuẩn hóa dữ liệu thời gian theo timestamp có múi giờ. |
| Các công cụ bên ngoài | Redis `redis:7-alpine` trong Docker Compose, cổng `6379`, `TZ=Asia/Ho_Chi_Minh`. | Làm hạ tầng hàng đợi và pub/sub cho backend. |
| Các công cụ bên ngoài | OpenAI SDK 6.42.0, endpoint mặc định `http://127.0.0.1:1234/v1`, model mặc định `google/gemma-4-e4b`. | Gọi API tương thích OpenAI để sinh câu hỏi, feedback và báo cáo. |
| Các công cụ bên ngoài | Supabase Auth/Storage qua `@supabase/supabase-js` 2.107.0; frontend dùng `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, backend dùng `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`. | Cung cấp xác thực, token JWT và lưu trữ tài nguyên liên quan đến người dùng. |

### 5.1.2 Hướng dẫn chạy dự án

Thứ tự chạy local được chia thành backend trước, frontend sau để frontend có thể gọi API tại `http://localhost:3000/api/v1`.

1. Cài đặt dependency cho backend:

```powershell
cd server
npm install
Copy-Item .env.example .env
```

2. Điền các biến bắt buộc trong `server/.env`, tối thiểu gồm cấu hình Supabase, `DATABASE_URL`, `OPENAI_API_KEY`, Redis và `CLIENT_URL=http://localhost:5173`. Khi chạy demo local có thể đặt `AUTH_ENABLED=false` và cấu hình `MOCK_USER_ID` hợp lệ trong database.

3. Khởi động Redis và backend:

```powershell
npm run infra:up
npm run start:dev
```

Backend sẵn sàng khi API chạy ở `http://localhost:3000/api/v1`. Có thể kiểm tra nhanh bằng:

```powershell
npm run verify:runtime
```

4. Cài đặt dependency cho frontend:

```powershell
cd ../client
npm install
Copy-Item .env.example .env.local
```

5. Điền các biến trong `client/.env.local`, gồm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` và `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1`. Nếu backend đang chạy chế độ bỏ qua đăng nhập, frontend cần đặt `NEXT_PUBLIC_SKIP_AUTH=true`.

6. Khởi động frontend:

```powershell
npm run dev
```

Ứng dụng frontend chạy tại `http://localhost:5173`.

### 5.1.3 Phương pháp đánh giá thực nghiệm

Việc đánh giá trong GR1 tập trung vào khả năng vận hành đúng của các luồng chính thay vì đo tải lớn. Các tiêu chí được sử dụng gồm: frontend khởi động và điều hướng được các trang chính; backend trả lời được `/api/v1` và `/health`; hệ thống tạo được phiên phỏng vấn từ JD; người dùng trả lời hoặc bỏ qua câu hỏi; worker nền sinh feedback và báo cáo; dữ liệu phiên, câu hỏi, câu trả lời và báo cáo được lưu trong PostgreSQL thông qua Prisma. Ngoài ra, dự án có thể kiểm tra build bằng `npm run build`, kiểm thử backend bằng `npm run test` và kiểm thử giao diện bằng `npm run test:e2e` khi cần đánh giá sâu hơn.

## 5.2 Kết Quả Chức Năng Đạt Được Trong GR1

> Cần bổ sung: tổng hợp ảnh chụp các chức năng đã hoàn thành. Cần đối chiếu code/demo thực tế, không chỉ dựa vào thiết kế.




## 5.3 Kịch Bản Vận Hành Minh Họa

> Cần bổ sung: mô tả một happy path từ đầu đến cuối.

Kịch bản vận hành:

1. Người dùng cập nhật các tthoong tin trong hồ sơ 
2. Người dùng nhập JD và cấu hình phiên phỏng vấn.
3. Hệ thống sinh câu hỏi từ JD người dùng nhập vào và các thông tin cấu hình phiên
4. Hệ thống tạo session và hiển thị lần lượt từng câu hỏi để người dùng trả lời
5. Người dùng trả lời lần lượt từng câu hỏi
- 5.1 Người dùng có thể ấn bỏ qua đối với các câu hỏi khó
- 5.2 Người dùng có thể ấn tạm dừng phiên phỏng vấn, hệ thống lưu lại trạng thái tiến độ hiện tại của người dùng
- 5.3 Người dùng hủy phiên phỏng vấn
6. Hệ thống sinh feedback/report sau khi kết thúc phỏng vấn
7. Người dùng có thể xem lịch sử các phiên phỏng vấn 


## 5.12 Hạn Chế Của Sản Phẩm GR1

> Cần bổ sung: nêu rõ hạn chế một cách thẳng thắn.

Gợi ý hạn chế:

- Chất lượng AI phụ thuộc vào provider và prompt.
- Chưa đánh giá với số lượng lớn người dùng thực.
- Một số tính năng như rewrite, progress dashboard, reverse questions, admin có thể chưa hoàn thiện.
- Chưa phát triển tính năng trả lời bằng giọng nói, phiên âm hoặc phân tích cách trình bày.
- Triển khai local/prototype, chưa tối ưu production.
- Chi phí/hạn mức API ảnh hưởng khả năng demo liên tục.

## 5.14 Tổng Kết Chương

> Cần bổ sung: tóm tắt kết quả đạt được, mức độ đáp ứng mục tiêu GR1 và những nội dung sẽ tiếp tục phát triển.

---
