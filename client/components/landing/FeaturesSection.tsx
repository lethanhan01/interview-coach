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
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h2 className="text-ink mb-3 text-3xl font-bold">
          Tại sao chọn AI Mock Interview?
        </h2>
        <p className="text-ink-muted">
          Được thiết kế riêng cho thị trường tuyển dụng IT Việt Nam
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-surface shadow-card border-border flex flex-col gap-3 rounded-2xl border p-6"
          >
            <div className="bg-brand-subtle flex size-10 items-center justify-center rounded-xl">
              <span className="bg-brand size-4 rounded-full" />
            </div>
            <h3 className="text-ink font-semibold">{f.title}</h3>
            <p className="text-ink-muted text-sm leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
