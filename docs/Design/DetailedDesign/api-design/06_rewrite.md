# Draft API - Rewrite (chưa triển khai)

Reference: [HLD §7.4](../../ArchitecturalDesign/HLD_InterviewAI_v1.0.md) · [ADR-007](../../ArchitecturalDesign/ADRs/ADR-007_bullmq-upgrade.md)

> **Không thuộc API backend hiện tại.** `server/src` không có rewrite controller. Không endpoint hay SSE event nào trong file này có thể được gọi ở phiên bản đang chạy.

UC-07 (Answer Rewrite) được giữ lại như tài liệu định hướng. Mọi request/response bên dưới chỉ là draft và không được dùng làm contract tích hợp cho đến khi có controller, DTO, service và test tương ứng.

## Endpoint Inventory

| Method | Path | Auth | Use Case |
|--------|------|------|----------|
| GET | `/api/v1/sessions/:id/answers/:answerId/rewrite-context` | Bearer | UC-07 — init |
| POST | `/api/v1/sessions/:id/answers/:answerId/rewrites` | Bearer | UC-07 — submit |
| GET | `/api/v1/sessions/:id/answers/:answerId/rewrites` | Bearer | UC-07 — list |

---

## GET /api/v1/sessions/:id/answers/:answerId/rewrite-context

> **v1.1:** UC-07 is deferred. This endpoint is not implemented in MVP.

Returns the original transcript and surgical feedback score for a given answer, giving the user context before writing a rewrite. Triggers the rewrite workflow.

Path params: `id` (session UUID), `answerId` (answer/turn UUID).

**Response body**

```json
{
	"success": true,
	"data": {
		"original_transcript": "[LẦN GỐC] Ừm, thì hồi đó tôi làm việc với...",
		"original_score": 68,
		"original_segments": [
			{
				"text": "Ừm, thì hồi đó tôi làm việc với...",
				"start_index": 0,
				"end_index": 31,
				"level": "critical",
				"reason": "Filler words nhiều và chưa nêu hành động cụ thể.",
				"suggestion": "Mô tả rõ bạn đã làm gì và kết quả ra sao.",
				"improved_version": null
			}
		],
		"key_takeaway": "Thiếu kết quả cụ thể trong STAR story."
	}
}
```

`original_segments` dùng cùng schema với rewrite evaluator output để UI hiển thị highlight ngay trên transcript gốc.

---

## POST /api/v1/sessions/:id/answers/:answerId/rewrites

> **v1.1:** UC-07 is deferred. This endpoint is not implemented in MVP.

Accepts the user's rewritten answer text and enqueues `RewriteEvalJob` (timeout 15s, retry 0 — ADR-007). The job compares the rewrite against the original rubric and emits `rewrite.done` SSE event when complete.

Path params: `id` (session UUID), `answerId` (answer/turn UUID).

**Response body**

```json
{
	"success": true,
	"data": {
		"rewrite_id": "uuid",
		"attempt_number": 2,
		"status": "queued",
		"message": "Rewrite submitted. Evaluation will complete in the background."
	}
}
```

The `rewrite_id` is the identifier used later by the evaluator and the `rewrite.done` SSE event.

---

## GET /api/v1/sessions/:id/answers/:answerId/rewrites

> **v1.1:** UC-07 is deferred. This endpoint is not implemented in MVP.

Returns all rewrite attempts for a given answer, ordered by submission time. Includes eval score per attempt to let the user track improvement.

Path params: `id` (session UUID), `answerId` (answer/turn UUID).

**Response body**

```json
{
	"success": true,
	"data": {
		"rewrites": [
			{
				"rewrite_id": "uuid",
				"attempt_number": 2,
				"overall_score": 79,
				"delta_score": 17,
				"model_answer": "...",
				"key_takeaway": "Tiến bộ rõ rệt! (+17 điểm). Chỉ cần thêm Result cụ thể để hoàn thiện STAR.",
				"comparison_summary": {
					"issues_fixed": [
						"Loại bỏ hoàn toàn 3 filler words",
						"Action trong STAR đã cụ thể hơn với POC và số liệu benchmark"
					],
					"issues_remaining": [
						"Phần Result chưa hoàn chỉnh"
					],
					"new_issues": []
				},
				"created_at": "2026-06-05T01:15:00Z"
			}
		]
	}
}
```

If the user has not submitted a rewrite yet, `rewrites` is an empty array.

---

## SSE event for rewrite completion

When `RewriteEvalJob` finishes, it publishes to `sse:session:{session_id}`. The SSE stream at `GET /api/v1/sessions/:id/events` emits:

```
event: rewrite.done
data: {"rewrite_id": "uuid", "score": 82, "delta": +14}
```

This is the only rewrite-related SSE event type. See [01_overview.md §7](./01_overview.md) for full SSE channel specification.
