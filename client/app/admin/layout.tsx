export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          <a href="/admin" className="block px-4 py-2 rounded hover:bg-gray-700">Dashboard</a>
          <a href="/admin/users" className="block px-4 py-2 rounded hover:bg-gray-700">Quản lý User</a>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
