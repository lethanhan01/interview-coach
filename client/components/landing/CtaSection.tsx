import Link from 'next/link'

export function CtaSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="bg-brand relative overflow-hidden rounded-2xl px-8 py-12 text-center">
        <div className="bg-brand-light pointer-events-none absolute -right-12 -top-12 size-48 rounded-full opacity-30 blur-2xl" />
        <h2 className="mb-3 text-3xl font-bold text-white">
          Sẵn sàng luyện tập?
        </h2>
        <p className="text-brand-100 mx-auto mb-8 max-w-md">
          Tạo tài khoản miễn phí và bắt đầu phiên phỏng vấn đầu tiên ngay hôm
          nay.
        </p>
        <Link
          href="/login?next=/setup"
          className="text-brand hover:bg-brand-subtle inline-flex rounded-full bg-white px-8 py-3 text-base font-medium shadow-lg transition-all duration-150 hover:scale-[1.02]"
        >
          Đăng ký miễn phí
        </Link>
      </div>
    </section>
  )
}
