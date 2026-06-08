import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-brand-100 blur-3xl opacity-40" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 size-80 rounded-full bg-brand-200 blur-3xl opacity-30" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6">
          <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand text-xs font-medium">
            Dành cho sinh viên CNTT Việt Nam
          </span>

          <h1 className="text-4xl sm:text-5xl font-bold text-ink leading-tight tracking-tight">
            Luyện phỏng vấn<br />
            <span className="text-brand">thông minh hơn</span>
          </h1>

          <p className="text-ink-muted text-lg leading-relaxed">
            Paste Job Description, trả lời bằng giọng nói, nhận phản hồi chi tiết từng câu.
            Chuẩn bị sẵn sàng cho mọi buổi phỏng vấn — hoàn toàn miễn phí.
          </p>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-8 py-3 text-base font-medium text-white bg-brand rounded-full shadow-btn hover:bg-brand-light hover:shadow-glow transition-all duration-150 hover:scale-[1.02]"
            >
              Bắt đầu miễn phí
            </Link>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="bg-surface rounded-2xl shadow-card border border-border p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success" />
              <span className="text-xs text-ink-muted">Đang phỏng vấn...</span>
            </div>
            <div className="bg-brand-50 rounded-xl p-4 text-sm text-ink leading-relaxed">
              &ldquo;Hãy kể về một tình huống bạn phải debug một lỗi khó trong production.&rdquo;
            </div>
            <div className="bg-surface-raised rounded-xl p-4 text-sm text-ink-muted leading-relaxed border border-border">
              Câu trả lời của bạn sẽ được phân tích từng đoạn với gợi ý cụ thể...
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
