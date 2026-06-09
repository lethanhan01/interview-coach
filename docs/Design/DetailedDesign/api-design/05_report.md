# API Design - Report

Reference: [01_overview.md](01_overview.md)

## GET /api/v1/sessions/:sessionId/report

**Endpoint URL**

`GET /api/v1/sessions/:sessionId/report`

**Purpose**

Lấy báo cáo tổng hợp và transcript có feedback của một session đã xử lý xong.

**Authentication**

Bearer JWT.

**Path parameters**

| Tên | Kiểu | Chú thích |
|-----|------|-----------|
| `sessionId` | string | UUID session cần lấy báo cáo. |

**Request body**

Không có.

**Response body - 200 OK**

```json
{
  "sessionId": "session-uuid",
  "overallScore": 75,
  "executiveSummary": {
    "overallScore": 75,
    "totalTurns": 5,
    "summary": "Interview completed with 5 evaluated answers..."
  },
  "competencyHeatmap": {
    "scores": [
      {
        "answerId": "answer-uuid",
        "score": 75
      }
    ]
  },
  "actionPlan": {
    "items": ["Luyện trả lời theo cấu trúc STAR."]
  },
  "transcript": [
    {
      "questionText": "Hãy giới thiệu về bản thân.",
      "orderIndex": 1,
      "answerText": "Tôi là...",
      "overallScore": 75,
      "modelAnswer": "Một câu trả lời tham khảo...",
      "keyTakeaway": "Cần bổ sung kết quả định lượng.",
      "segments": [
        {
          "id": "segment-uuid",
          "segmentText": "Tôi đã cải thiện hệ thống",
          "startIndex": 10,
          "endIndex": 35,
          "highlightLevel": "warning",
          "annotation": "Chưa nêu số liệu cụ thể.",
          "suggestion": "Bổ sung phần trăm cải thiện."
        }
      ]
    }
  ]
}
```

### Trường cấp report

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `sessionId` | string | UUID session. |
| `overallScore` | number | Điểm tổng; trả `0` nếu DB chưa có điểm. |
| `executiveSummary` | object | Tóm tắt tổng quan; `{}` nếu dữ liệu DB không phải object. |
| `executiveSummary.overallScore` | number | Điểm trung bình các feedback trong processor hiện tại. |
| `executiveSummary.totalTurns` | number | Tổng số answer được đưa vào report job. |
| `executiveSummary.summary` | string | Câu tóm tắt kết quả phỏng vấn. |
| `competencyHeatmap` | object | Dữ liệu heatmap; `{}` nếu chưa có object hợp lệ. |
| `competencyHeatmap.scores` | object[] | Điểm theo từng answer trong processor hiện tại. |
| `actionPlan` | object | Kế hoạch cải thiện; có thể là `{}` nếu AI tạo action plan thất bại. |
| `actionPlan.items` | string[] | Danh sách 3-5 hành động cải thiện khi có. |
| `transcript` | object[] | Danh sách câu hỏi theo `orderIndex`, kèm answer và feedback đầu tiên. |

### Trường transcript

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `transcript[].questionText` | string | Nội dung câu hỏi. |
| `transcript[].orderIndex` | number | Thứ tự câu hỏi. |
| `transcript[].answerText` | string | Nội dung answer đầu tiên; chuỗi rỗng nếu chưa trả lời. |
| `transcript[].overallScore` | number | Điểm feedback; `0` nếu chưa có feedback. |
| `transcript[].modelAnswer` | string | Câu trả lời mẫu; chuỗi rỗng nếu chưa có. |
| `transcript[].keyTakeaway` | string | Nhận xét quan trọng nhất; chuỗi rỗng nếu chưa có. |
| `transcript[].segments` | object[] | Các đoạn được annotate; mảng rỗng nếu không có. |
| `segments[].id` | string | UUID annotated segment. |
| `segments[].segmentText` | string | Đoạn text được đánh dấu. |
| `segments[].startIndex` | number | Vị trí bắt đầu trong answer. |
| `segments[].endIndex` | number | Vị trí kết thúc trong answer. |
| `segments[].highlightLevel` | string | Mức độ highlight do feedback processor lưu. |
| `segments[].annotation` | string | Giải thích cho đoạn được đánh dấu. |
| `segments[].suggestion` | string, optional | Gợi ý chỉnh sửa; vắng mặt nếu DB là `null`. |

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 403 | `FORBIDDEN` | Session thuộc user khác. |
| 404 | `SESSION_NOT_FOUND` | Không tìm thấy session. |
| 404 | `REPORT_NOT_READY` | `executiveSummaryJson` chưa có; report chưa sẵn sàng. |
| 500 | `INTERNAL_ERROR` | Lỗi DB hoặc lỗi ngoài dự kiến. |

Client có thể chờ event SSE `report.ready` trước khi gọi endpoint này.
