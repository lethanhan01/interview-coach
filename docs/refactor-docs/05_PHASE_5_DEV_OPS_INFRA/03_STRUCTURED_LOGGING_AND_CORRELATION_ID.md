# TASK 5.3: STRUCTURED JSON LOGGING & CORRELATION-ID PROPAGATION
# (QUAN SÁT THỰC DỤNG: GHI LOG CẤU TRÚC JSON, TRUY VẾT CORRELATION-ID XUYÊN SUỐT DỊCH VỤ)

> **Trạng thái**: Approved / Pragmatic Production Specification  
> **Cấp độ**: Deep Technical Specification (Observability & Logging Architecture)  
> **Áp dụng cho**: `server/src/core/logging/`, `ai-service/app/core/logging.py`, Middleware NestJS & FastAPI  
> **Tài liệu cha**: [00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_5_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0 (Thay thế mạng lưới OpenTelemetry/Jaeger bằng Structured Logging tinh gọn)  

---

## 1. NGUYÊN LÝ THIẾT KẾ: TẠI SAO STRUCTURED LOGGING ĐỦ TỐT & VƯỢT TRỘI?

Trong các hệ thống phân tán phức tạp, OpenTelemetry (OTel) và Jaeger mang lại giá trị nhưng đi kèm chi phí vận hành khổng lồ:
* **Bộ nhớ & CPU**: OTel Collector chạy ngốn RAM, việc serialize protobuf trace spans gây sụt giảm throughput của tiến trình Node.js và Python.
* **Độ phức tạp mạng**: Phải duy trì kết nối gRPC/HTTP tới OTel daemon; khi OTel collector gặp sự cố hoặc nghẽn mạng, luồng chính có nguy cơ bị treo hoặc rò rỉ bộ nhớ đệm spans.
* **Khó khăn khi chạy Local / VPS nhỏ**: Trên máy tính cá nhân hoặc server tài nguyên vừa phải, việc chạy thêm container Jaeger + OTel Collector là lãng phí tài nguyên không cần thiết.

**Giải pháp Thực dụng của InterviewAI**:
* Áp dụng **Structured JSON Logging chuẩn hóa** (mỗi log entry là 1 dòng JSON có cấu trúc).
* Sử dụng **Correlation-ID (`x-correlation-id`)** được sinh ra từ Client hoặc API Gateway NestJS và lan truyền xuyên suốt qua:
  $$\text{Next.js UI} \xrightarrow{\text{HTTP REST}} \text{NestJS Core} \xrightarrow{\text{BullMQ Outbox}} \text{NestJS Worker} \xrightarrow{\text{HTTP REST}} \text{Python AI Service}$$
* Khi có sự cố, kỹ sư chỉ cần lọc theo `correlationId` trong log là có thể thấy toàn bộ hành trình của request từ lúc người dùng gửi audio cho đến khi feedback được lưu vào cơ sở dữ liệu.

---

## 2. CHUẨN HOÁ LOG ENTRY SCHEMA (CANONICAL LOG FORMAT)

Mọi dòng log của cả NestJS và Python bắt buộc in ra stdout theo schema thống nhất:

```json
{
  "timestamp": "2026-10-07T12:00:00.123Z",
  "level": "INFO",
  "service": "server",
  "correlationId": "c9b8e21a-4d7a-4b9e-b810-73f1d3c52a01",
  "context": "VoiceAnswerIntakeHandler",
  "message": "User answer submitted successfully",
  "sessionId": "4bf92f11-0000-0000-0000-000000000000",
  "userId": "1a2b3c4d-0000-0000-0000-000000000000",
  "durationMs": 42.5
}
```

---

## 3. CÀI ĐẶT TRUY VẾT TRÊN NESTJS (`server/`)

### 3.1 Correlation-ID Interceptor (`server/src/core/logging/correlation.interceptor.ts`)

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const correlationId =
      request.headers[CORRELATION_ID_HEADER] || randomUUID();
    request.correlationId = correlationId;
    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    return next.handle();
  }
}
```

### 3.2 Lan truyền qua BullMQ Outbox Worker
Khi đưa tác vụ vào hàng đợi Outbox, NestJS tự động đính kèm `correlationId` vào metadata của job:

```typescript
await this.workflow.enqueueInTransaction(tx, {
  commandType: 'feedback',
  aggregateId: answer.id,
  payload: {
    ...feedbackPayload,
    correlationId: request.correlationId,
  },
});
```

---

## 4. CÀI ĐẶT TRUY VẾT TRÊN PYTHON (`ai-service/`)

### 4.1 Structlog Middleware (`ai-service/app/core/logging.py`)

```python
import structlog
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get("x-correlation-id", str(uuid.uuid4()))
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            correlation_id=correlation_id,
            path=request.url.path,
        )
        response = await call_next(request)
        response.headers["x-correlation-id"] = correlation_id
        return response
```

---

## 5. TRA CỨU SỰ CỐ TRONG THỰC TẾ (INCIDENT INVESTIGATION)

Khi có lỗi xảy ra (ví dụ: người dùng báo cáo câu trả lời bị lỗi chấm điểm):
1. Lấy `correlationId` từ Response Header hoặc bảng lịch sử lỗi.
2. Tra cứu tức thời qua Docker logs:
   ```bash
   docker compose logs | grep "c9b8e21a-4d7a-4b9e-b810-73f1d3c52a01"
   ```
3. Toàn bộ tiến trình xử lý từ NestJS API $\to$ BullMQ Worker $\to$ Python STT $\to$ LLM Evaluation sẽ hiện ra theo thứ tự thời gian chi tiết. Không cần cài đặt hay duy trì bất kỳ máy chủ giám sát bên thứ ba nào.
