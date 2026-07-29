'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api-client'

type AdminUser = { id: string; email: string; role: string; status: string; createdAt: string }

export default function AdminUsersPage() {
  const { role, isLoading } = useAuth(); const router = useRouter(); const [users, setUsers] = useState<AdminUser[]>([]); const [error, setError] = useState('')
  const load = async () => { try { const result = await apiClient.get<{ data: AdminUser[] }>('/admin/users'); setUsers(result.data) } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải users') } }
  useEffect(() => { if (!isLoading && role !== 'admin') router.replace('/sessions'); if (role === 'admin') void load() }, [role, isLoading, router])
  const change = async (id: string, remove = false) => {
    if (remove && !confirm('Xóa mềm tài khoản này?')) return
    try {
      if (remove) await apiClient.delete<void>(`/admin/users/${id}`)
      else await apiClient.patch(`/admin/users/${id}/status`, {})
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể cập nhật') }
  }
  if (isLoading || role !== 'admin') return null
  return <section><h1 className="text-2xl font-semibold">Quản lý người dùng</h1>{error && <p role="alert" className="mt-3 text-danger">{error}</p>}<div className="mt-5 overflow-x-auto rounded-lg bg-surface shadow-card"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Email</th><th>Vai trò</th><th>Trạng thái</th><th></th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b"><td className="p-3">{user.email}</td><td>{user.role}</td><td>{user.status}</td><td className="space-x-2 p-3"><button onClick={() => void change(user.id)} className="text-brand underline">{user.status === 'active' ? 'Khóa' : 'Mở khóa'}</button><button onClick={() => void change(user.id, true)} className="text-danger underline">Xóa</button></td></tr>)}</tbody></table></div></section>
}
