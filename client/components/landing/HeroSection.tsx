import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="bg-brand-100 pointer-events-none absolute -left-32 -top-32 size-96 rounded-full opacity-40 blur-3xl" />
      <div className="bg-brand-200 pointer-events-none absolute -bottom-32 -right-16 size-80 rounded-full opacity-30 blur-3xl" />

      <div className="relative mx-auto grid max-w-5xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <span className="bg-brand-subtle border-brand-subtle-border text-brand-subtle-fg inline-flex items-center self-start rounded-full border px-3 py-1 text-xs font-medium">
            Dành cho sinh viên CNTT Việt Nam
          </span>

          <h1 className="text-ink text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Luyện phỏng vấn
            <br />
            <span className="text-brand">thông minh hơn</span>
          </h1>

          <p className="text-ink-muted text-lg leading-relaxed">
            Paste Job Description, trả lời bằng giọng nói, nhận phản hồi chi
            tiết từng câu. Chuẩn bị sẵn sàng cho mọi buổi phỏng vấn — hoàn toàn
            miễn phí.
          </p>

          <div className="flex items-center gap-3">
            <Link
              href="/login?next=/setup"
              className="bg-brand shadow-btn hover:bg-brand-light hover:shadow-glow rounded-full px-8 py-3 text-base font-medium text-white transition-all duration-150 hover:scale-[1.02]"
            >
              Bắt đầu miễn phí
            </Link>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="bg-surface shadow-card border-border flex flex-col gap-4 rounded-2xl border p-6">
            <div className="flex items-center gap-2">
              <span className="bg-success size-2 rounded-full" />
              <span className="text-ink-muted text-xs">Đang phỏng vấn...</span>
            </div>
            <div className="bg-brand-subtle text-ink rounded-xl p-4 text-sm leading-relaxed">
              &ldquo;Hãy kể về một tình huống bạn phải debug một lỗi khó trong
              production.&rdquo;
            </div>
            <div className="bg-surface-raised text-ink-muted border-border rounded-xl border p-4 text-sm leading-relaxed">
              Câu trả lời của bạn sẽ được phân tích từng đoạn với gợi ý cụ
              thể...
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
