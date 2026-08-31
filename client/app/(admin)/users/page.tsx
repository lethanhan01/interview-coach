'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { adminService } from '@/services'
import type { AdminUser } from '@/lib/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
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
import { PageContainer, PageHeader } from '@/components/patterns/LayoutPatterns'
import { LoadingState, EmptyState, ErrorState } from '@/components/patterns/FeedbackPatterns'
import { Search, Trash2, Unlock, Lock, Users } from 'lucide-react'

export default function AdminUsersPage() {
  const { role, isLoading: authLoading } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setError('')
    try {
      const data = await adminService.listUsers()
      setUsers(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải users')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const load = async () => {
    setIsLoading(true)
    await fetchUsers()
  }

  useEffect(() => {
    if (!authLoading && role === 'admin') {
      const timeout = window.setTimeout(() => void fetchUsers(), 0)
      return () => window.clearTimeout(timeout)
    }
  }, [role, authLoading, fetchUsers])

  const changeStatus = async (id: string, currentStatus: string) => {
    try {
      await adminService.updateUser(id, {
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
      await adminService.deleteUser(userToDelete)
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
    <PageContainer maxWidth="lg" className="space-y-6 py-0">
      <PageHeader
        title="Quản lý người dùng"
        description="Quản lý tài khoản, phân quyền và trạng thái hệ thống."
      />

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
        <ErrorState description={error} minHeight="min-h-[100px]" />
      )}

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <LoadingState text="Đang tải danh sách người dùng..." minHeight="h-48" />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            minHeight="h-48"
            title="Không tìm thấy người dùng"
            description={search ? `Không có kết quả nào khớp với "${search}"` : 'Hệ thống chưa có người dùng nào'}
            icon={<Users className="size-8 text-ink-muted/50" />}
          />
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
      </Card>

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
    </PageContainer>
  )
}
