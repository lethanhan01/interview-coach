import RoleGuard from '@/components/auth/RoleGuard'
import LogoutButton from '@/components/ui/LogoutButton'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRole="admin" fallbackRoute="/sessions">
      <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            <a href="/admin-dashboard" className="block px-4 py-2 rounded hover:bg-gray-700">Dashboard</a>
            <a href="/users" className="block px-4 py-2 rounded hover:bg-gray-700">Quản lý User</a>
            <a href="/admin-profile" className="block px-4 py-2 rounded hover:bg-gray-700">Hồ sơ</a>
          </nav>
        </div>
        <div>
          <LogoutButton className="w-full text-left px-4 py-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white transition-colors" />
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
    </RoleGuard>
  );
}
