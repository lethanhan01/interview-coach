const features = [
  {
    title: 'AI Follow-up thông minh',
    description:
      'Hệ thống đặt câu hỏi tiếp theo dựa trên câu trả lời của bạn, giống phỏng vấn thật.',
  },
  {
    title: 'Surgical Feedback',
    description:
      'Phản hồi highlight từng đoạn cụ thể trong câu trả lời kèm gợi ý cải thiện rõ ràng.',
  },
  {
    title: 'Context Pack VN / Western',
    description:
      'Rubric chấm điểm phù hợp văn hóa — chọn kiểu phỏng vấn phù hợp với công ty bạn target.',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-ink mb-3">Tại sao chọn InterviewAI?</h2>
        <p className="text-ink-muted">Được thiết kế riêng cho thị trường tuyển dụng IT Việt Nam</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-surface rounded-2xl shadow-card border border-border p-6 flex flex-col gap-3"
          >
            <div className="size-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <span className="size-4 rounded-full bg-brand" />
            </div>
            <h3 className="font-semibold text-ink">{f.title}</h3>
            <p className="text-sm text-ink-muted leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
