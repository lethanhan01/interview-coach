'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api-client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Search, AlertCircle, Trash2, Unlock, Lock, Users } from 'lucide-react'

type AdminUser = {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
}

export default function AdminUsersPage() {
  const { role, isLoading: authLoading } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  const load = async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await apiClient.get<{ data: AdminUser[] }>('/admin/users')
      setUsers(result.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải users')
    } finally {
      setIsLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!authLoading && role === 'admin') void load()
  }, [role, authLoading])

  const changeStatus = async (id: string, currentStatus: string) => {
    try {
      await apiClient.patch(`/admin/users/${id}`, {
        status: currentStatus === 'active' ? 'locked' : 'active',
      })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể cập nhật trạng thái')
    }
  }

  const deleteUser = async () => {
    if (!userToDelete) return
    try {
      await apiClient.delete<void>(`/admin/users/${userToDelete}`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể xóa user')
    } finally {
      setUserToDelete(null)
    }
  }

  if (authLoading || role !== 'admin') return null

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section className="mx-auto max-w-5xl space-y-6 py-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-ink text-2xl font-bold tracking-tight">
            Quản lý người dùng
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            Quản lý tài khoản, phân quyền và trạng thái hệ thống.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-full sm:max-w-sm">
          <Input
            placeholder="Tìm theo email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leadingIcon={<Search className="size-4" />}
          />
        </div>
      </div>

      {error && (
        <div className="bg-danger-bg text-danger border-danger/20 flex items-center gap-2 rounded-xl border p-4 text-sm font-medium">
          <AlertCircle className="size-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-surface shadow-card border-border overflow-hidden rounded-xl border">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-ink-muted flex h-48 flex-col items-center justify-center">
            <Users className="mb-2 size-8 opacity-50" />
            <p>Không tìm thấy người dùng nào.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-ink font-medium">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'admin' ? 'brand' : 'default'}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === 'active' ? 'success' : 'danger'}
                    >
                      {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeStatus(user.id, user.status)}
                    >
                      {user.status === 'active' ? (
                        <>
                          <Lock className="size-3" />
                          Khóa
                        </>
                      ) : (
                        <>
                          <Unlock className="size-3" />
                          Mở khóa
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setUserToDelete(user.id)}
                    >
                      <Trash2 className="size-3" />
                      Xóa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa mềm tài khoản khỏi hệ thống. Người dùng sẽ
              không thể đăng nhập được nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser}>
              Xóa tài khoản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
