# Fix AI JSON Failures + Report 404 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sửa hai bug gây ra AI pipeline failure với LM Studio và 404 sai ngữ nghĩa trên report endpoint.

**Architecture:** (1) Thêm JSON extraction helper trong `OpenAIGateway` để strip markdown code fences mà LM Studio đôi khi wrap quanh JSON response — fix này cover tất cả callers (BasePipeline, ComprehensiveReportProcessor). (2) Bật `OPENAI_JSON_MODE=true` trong `.env` để gửi `response_format: { type: 'json_object' }` tới LM Studio, buộc grammar-based JSON output. (3) Đổi HTTP status của `REPORT_NOT_READY` từ 404 sang 202 cho đúng ngữ nghĩa.

**Tech Stack:** NestJS 11, Jest 30, TypeScript 5.7, BullMQ, LM Studio (OpenAI-compatible API).

## Context

Trong session `2dafce71-c504-451e-888a-cc8ca18ed59a`, toàn bộ FeedbackProcessor fail với "Invalid JSON from AI" vì `OPENAI_JSON_MODE` default là `'false'` — nên `response_format: { type: 'json_object' }` không bao giờ được gửi đến LM Studio. Model `google/gemma-4-e4b` trả về text tự do (hoặc markdown-wrapped JSON) thay vì clean JSON. Kết quả: tất cả feedback dùng fallback content → ComprehensiveReportProcessor cũng fail tương tự → không có row `session_reports` → `GET /sessions/:id/report` trả 404.

Thêm vào đó, `REPORT_NOT_READY` được throw với `HttpStatus.NOT_FOUND` (404) thay vì `HttpStatus.ACCEPTED` (202) — sai ngữ nghĩa HTTP (404 = không tìm thấy resource, 202 = đang xử lý).

## Global Constraints

- Không thay đổi public interface: `chatCompletion()` signature giữ nguyên, chỉ thêm private method.
- Không chỉnh sửa prompt files — JSON extraction là defensive layer, không phải thay thế instruction trong prompt.
- Test commands: `cd server && npx jest --no-coverage` (Jest 30, tất cả `*.spec.ts`).
- Chỉ touch các file cần thiết. Không refactor code xung quanh.

---

## File Map

| File | Thay đổi |
|------|----------|
| `server/.env` | Thêm `OPENAI_JSON_MODE=true` |
| `server/src/ai/openai.gateway.ts` | Thêm private `extractJsonContent()`, gọi từ `chatCompletion()` |
| `server/src/ai/openai.gateway.spec.ts` | Thêm 3 test cases cho JSON extraction |
| `server/src/report/report.service.ts` | Đổi `HttpStatus.NOT_FOUND` → `HttpStatus.ACCEPTED` tại dòng 69 |
| `server/src/report/report.service.spec.ts` | Cập nhật test REPORT_NOT_READY để verify HTTP 202 |

---

## Task 1: Bật OPENAI_JSON_MODE trong server/.env [DONE]

- [x] Tìm dòng `OPENAI_JSON_MODE` trong `server/.env` và sửa thành `OPENAI_JSON_MODE=true`

---

## Task 2: Thêm JSON extraction trong OpenAIGateway [DONE]

- [x] Thêm `private extractJsonContent(raw: string): string` sau `quotaExceededException()`
- [x] Thay `return content;` → `return responseFormat === 'json_object' ? this.extractJsonContent(content) : content;`
- [x] Thêm 3 test cases: strip fence, plain JSON, extract từ prose
- [x] Tất cả tests pass

---

## Task 3: Fix REPORT_NOT_READY HTTP status [DONE]

- [x] Đổi `HttpStatus.NOT_FOUND` → `HttpStatus.ACCEPTED` tại `report.service.ts:69`
- [x] Thêm assertion `getStatus() === 202` vào test REPORT_NOT_READY
- [x] Tất cả tests pass

---

## Verification — Điều kiện xác nhận thành công

### Unit tests

```bash
cd server && npx jest --no-coverage
```

Điều kiện pass:
- `openai.gateway.spec.ts` — cả 3 test JSON extraction PASS
- `report.service.spec.ts` — test REPORT_NOT_READY verify `getStatus() === 202` PASS
- Không có test nào bị regression

**Kết quả thực tế (2026-06-28): 187/187 pass, 34 suites.**

### Integration test thủ công

1. Đảm bảo LM Studio đang chạy tại `http://127.0.0.1:1234/v1` với model đã load.
2. Khởi động server: `cd server && npm run start:dev`
3. Tạo session mới → POST `/api/v1/sessions`
4. Quan sát server log: **không có** `Invalid JSON from AI` hoặc `AI provider returned empty response`
5. Hoàn thành phỏng vấn → PATCH `/api/v1/sessions/:id/status { "status": "completed" }`
6. Poll GET `/api/v1/sessions/:id/report`:
   - Trong lúc đang generate: response phải là **HTTP 202** với body `{ "errorCode": "REPORT_NOT_READY" }`
   - Sau khi generate xong: response là **HTTP 200** với report data đầy đủ
