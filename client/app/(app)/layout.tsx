import Link from 'next/link'
import NavLinks from '@/components/ui/NavLinks'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const accessToken = 'dev-mock-token'

  return (
    <div className="min-h-screen bg-surface-raised">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-surface-overlay backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/sessions"
            className="font-semibold text-base text-brand tracking-tight hover:text-brand-light transition-colors"
          >
            InterviewAI
          </Link>

          <div className="flex items-center gap-1">
            <NavLinks />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8" data-access-token={accessToken}>
        {children}
      </main>
    </div>
  )
}
