import { redirect } from 'next/navigation'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { CtaSection } from '@/components/landing/CtaSection'

export default async function HomePage() {
  if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
    redirect('/sessions')
  }

  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase-server')
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) redirect('/sessions')
  } catch {
    // Supabase not configured — fall through to landing
  }

  return (
    <div className="min-h-screen bg-surface-raised">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-surface-overlay backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-base text-brand tracking-tight">InterviewAI</span>
          <a
            href="/login"
            className="px-5 py-2 text-sm font-medium text-white bg-brand rounded-full shadow-btn hover:bg-brand-light transition-all duration-150"
          >
            Đăng nhập
          </a>
        </div>
      </header>

      <HeroSection />
      <FeaturesSection />
      <CtaSection />
    </div>
  )
}
