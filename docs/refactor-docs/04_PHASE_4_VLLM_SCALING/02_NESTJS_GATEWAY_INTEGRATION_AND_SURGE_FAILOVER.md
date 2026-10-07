# TASK 4.2: TÍCH HỢP NESTJS AI GATEWAY, CIRCUIT BREAKER & CLOUD SURGE OVERFLOW
# (NESTJS IAIGATEWAY ADAPTER, OPOSSUM CIRCUIT BREAKER & AUTOMATIC OPENAI FAILOVER)

> **Trạng thái**: Approved / Production Specification  
> **Cấp độ**: Deep Technical Specification (Backend Resilience & Cloud Failover)  
> **Áp dụng cho**: `server/src/infrastructure/ai/`, `IAIGateway`, `OpenAIGateway`, Circuit Breaker  
> **Tài liệu cha**: [00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0  

---

## 1. PHÂN TÍCH THIẾT KẾ CŨ & NHỮNG ĐIỂM CHƯA CHẶT CHẼ CẦN KHẮC PHỤC

Bản thiết kế ban đầu giả định việc tích hợp vLLM vào NestJS chỉ đơn giản là thay đổi biến môi trường:
```bash
OPENAI_BASE_URL=http://vllm-service:8001/v1
```
Cách tiếp cận ngây thơ này tiềm ẩn **3 rủi ro chí mạng trong sản xuất**:

1. **Hiệu ứng Thác đổ (Cascading Failure) khi vLLM Quá tải hoặc Treo**:
   * Nếu vLLM bị treo driver GPU hoặc trả HTTP 503 do cạn KV-Cache, client NestJS sẽ chờ đến khi HTTP timeout (30-60 giây).
   * Hàng trăm request từ các thí sinh khác bị nghẽn trong event loop của Node.js, gây sập luôn cả máy chủ NestJS backend.
2. **Thiếu Cơ chế Điều tiết Quá tải Động (Cloud Surge Overflow)**:
   * Vào các khung giờ cao điểm (ví dụ: các kỳ thi tuyển dụng đồng loạt), số lượng thí sinh có thể tăng vọt gấp 3-4 lần năng lực của cụm GPU cục bộ.
   * Nếu không có cơ chế tự động "xả lũ" (overflow) sang Cloud OpenAI, hệ thống sẽ từ chối phục vụ thí sinh.
3. **Thiếu Khả năng Tự phục hồi (Self-Healing)**:
   * Khi vLLM khởi động lại xong, hệ thống không tự động đưa lưu lượng trở lại GPU mà bắt buộc kỹ sư SRE phải cấu hình lại thủ công.

---

## 2. KIẾN TRÚC BẢO VỆ CHỐNG SẬP 3 TẦNG (RESILIENCE ARCHITECTURE)

Hệ thống triển khai mẫu thiết kế **Resilient AI Gateway** với Circuit Breaker (sử dụng thư viện `opossum` chuẩn enterprise):

```mermaid
graph TD
    Req["Request Suy luận LLM (Turn / Probing / Summary)"] --> Router{"VLLM Resilient Router"}
    
    Router -->|Kiểm tra Trạng thái| CB{"Circuit Breaker<br/>(Opossum)"}
    
    subgraph PrimaryNode["Tuyến Chính: GPU vLLM Cục bộ"]
        CB -->|CLOSED / HALF-OPEN| CallVLLM["Gọi Local vLLM Engine<br/>(http://vllm:8001/v1)"]
        CallVLLM -->|Phản hồi 200 OK (< 800ms)| Success["Trả kết quả cho Hệ thống"]
    end
    
    subgraph FallbackNode["Tuyến Dự phòng: Cloud OpenAI API"]
        CallVLLM -->|Lỗi 503 / Timeout 1.2s| TriggerSurge["Kích hoạt Surge Overflow"]
        CB -->|OPEN (Lỗi liên tục > 30%)| RouteCloud["Bỏ qua vLLM, gọi thẳng OpenAI"]
        TriggerSurge --> RouteCloud
        RouteCloud --> CallCloud["Gọi OpenAI Cloud API<br/>(gpt-4o / gpt-4o-mini)"]
        CallCloud --> Success
    end
```

### Các Thông số Cấu hình Circuit Breaker:
* **Timeout**: $1.500\text{ ms}$ (Nếu vLLM không trả về token đầu tiên sau 1.5 giây, coi như request đó thất bại).
* **Error Threshold Percentage**: $30\%$ (Nếu quá 30% số request trong 10 giây bị lỗi/timeout, mạch chuyển sang trạng thái `OPEN`).
* **Reset Timeout**: $20.000\text{ ms}$ (Sau 20 giây ở trạng thái OPEN, chuyển sang `HALF-OPEN` để thử nghiệm 5% lưu lượng sang vLLM xem GPU đã hồi phục chưa).

---

## 3. MÃ NGUỒN TRIỂN KHAI GATEWAY BẢO VỆ (`server/src/infrastructure/ai/vllm-resilient.gateway.ts`)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import CircuitBreaker from 'opossum';
import OpenAI from 'openai';
import { IAIGateway, ChatCompletionOptions, ChatCompletionResult } from '../contracts/ai-gateway.interface';

@Injectable()
export class VLLMResilientGateway implements IAIGateway {
  private readonly logger = new Logger(VLLMResilientGateway.name);
  private readonly localVllmClient: OpenAI;
  private readonly cloudOpenAiClient: OpenAI;
  private readonly breaker: CircuitBreaker<[ChatCompletionOptions], ChatCompletionResult>;

  constructor(private readonly config: ConfigService) {
    // 1. Client vLLM tự host
    this.localVllmClient = new OpenAI({
      baseURL: this.config.get<string>('VLLM_BASE_URL', 'http://vllm-service:8001/v1'),
      apiKey: 'not-needed-local',
      timeout: 2000, // Timeout ngắn cho local GPU
    });

    // 2. Client Cloud OpenAI Fallback
    this.cloudOpenAiClient = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
      timeout: 15000,
    });

    // 3. Khởi tạo Circuit Breaker bao bọc luồng gọi vLLM
    this.breaker = new CircuitBreaker(
      (options: ChatCompletionOptions) => this.callLocalVLLM(options),
      {
        timeout: 2000,
        errorThresholdPercentage: 30,
        resetTimeout: 20000,
        rollingCountTimeout: 10000,
        name: 'vLLM-Local-Engine',
      },
    );

    // Đăng ký fallback tự động khi Circuit Breaker MỞ hoặc Timeout
    this.breaker.fallback(async (options: ChatCompletionOptions, error: Error) => {
      this.logger.warn(`Circuit Breaker ACTIVE -> Routing request to Cloud OpenAI. Reason: ${error?.message}`);
      return this.callCloudOpenAI(options);
    });

    this.breaker.on('open', () => this.logger.error('CRITICAL: vLLM Circuit Breaker OPENED! Diverting 100% traffic to Cloud.'));
    this.breaker.on('halfOpen', () => this.logger.log('INFO: vLLM Circuit Breaker HALF-OPEN. Probing GPU recovery...'));
    this.breaker.on('close', () => this.logger.log('INFO: vLLM Circuit Breaker CLOSED. Normal GPU traffic resumed.'));
  }

  async generateChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const isVllmEnabled = this.config.get<boolean>('VLLM_ENABLED', true);
    if (!isVllmEnabled) {
      return this.callCloudOpenAI(options);
    }

    return this.breaker.fire(options);
  }

  private async callLocalVLLM(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const model = this.config.get<string>('VLLM_MODEL', 'Qwen/Qwen2.5-32B-Instruct-AWQ');
    const response = await this.localVllmClient.chat.completions.create({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 1024,
    });

    return {
      content: response.choices[0]?.message?.content ?? '',
      provider: 'vllm-local',
      modelUsed: model,
    };
  }

  private async callCloudOpenAI(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const model = this.config.get<string>('OPENAI_FALLBACK_MODEL', 'gpt-4o-mini');
    const response = await this.cloudOpenAiClient.chat.completions.create({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 1024,
    });

    return {
      content: response.choices[0]?.message?.content ?? '',
      provider: 'openai-cloud-fallback',
      modelUsed: model,
    };
  }
}
```

---

## 4. BIẾN MÔI TRƯỜNG & CHẾ ĐỘ QUẢN TRỊ (CONFIGURATION MATRIX)

```bash
# --- CẤU HÌNH VLLM HYBRID GATEWAY ---
VLLM_ENABLED=true
VLLM_BASE_URL=http://vllm-service:8001/v1
VLLM_MODEL=Qwen/Qwen2.5-32B-Instruct-AWQ

# --- CẤU HÌNH CLOUD FALLBACK & SURGE ---
OPENAI_API_KEY=sk-proj-prod-live-secret-key
OPENAI_FALLBACK_MODEL=gpt-4o-mini
AI_SURGE_OVERFLOW_ENABLED=true
AI_SURGE_LATENCY_THRESHOLD_MS=1200
```

---

## 5. TIÊU CHÍ NGHIỆM THU (QUALITY GATES)

1. **Thời Gian Chuyển Mạch Tức thì (Zero Impact Failover)**: Khi cố tình tắt container vLLM (`docker stop interviewai-vllm`), các request gửi đến NestJS chuyển đổi sang OpenAI Cloud thành công $100\%$ với độ trễ tăng không quá $1.5\text{s}$.
2. **Tự Động Phục Hồi (Self-Healing)**: Khi container vLLM được bật lại (`docker start`), mạch tự chuyển từ `OPEN` sang `HALF-OPEN` và `CLOSED` trong vòng $30\text{ giây}$ mà không cần restart server NestJS.
3. **Minh bạch Nhà cung cấp (Auditability)**: Kết quả trả về luôn gắn kèm nhãn `provider: 'vllm-local' | 'openai-cloud-fallback'` giúp hệ thống đo đạc chính xác tỷ lệ phân bổ lưu lượng trên Grafana.
