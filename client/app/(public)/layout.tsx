export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Interview Coach</h1>
        <nav>
          <a href="/login" className="text-sm font-medium hover:underline">Đăng nhập</a>
        </nav>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t px-6 py-4 text-center text-sm text-gray-500">
        &copy; 2026 Interview Coach. All rights reserved.
      </footer>
    </div>
  );
}
