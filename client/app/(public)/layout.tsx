import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-xl font-bold">Interview Coach</h1>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <a href="/login" className="text-sm font-medium hover:underline">
            Đăng nhập
          </a>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t px-6 py-4 text-center text-sm text-gray-500">
        &copy; 2026 Interview Coach. All rights reserved.
      </footer>
    </div>
  )
}
