import Link from 'next/link'

export function CtaSection() {
  return (
    <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl bg-brand px-8 py-12 text-center">
        <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-brand-light opacity-30 blur-2xl" />
        <h2 className="text-3xl font-bold text-white mb-3">Sẵn sàng luyện tập?</h2>
        <p className="text-brand-100 mb-8 max-w-md mx-auto">
          Tạo tài khoản miễn phí và bắt đầu phiên phỏng vấn đầu tiên ngay hôm nay.
        </p>
        <Link
          href="/sessions"
          className="inline-flex px-8 py-3 text-base font-medium text-brand bg-white rounded-full hover:bg-brand-50 transition-all duration-150 hover:scale-[1.02] shadow-lg"
        >
          Đăng ký miễn phí
        </Link>
      </div>
    </section>
  )
}
