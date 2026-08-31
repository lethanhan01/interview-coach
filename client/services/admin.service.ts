import { apiClient } from '@/lib/api-client'
import type { AdminUser } from '@/lib/types'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export const adminService = {
  /**
   * Lấy danh sách toàn bộ người dùng trong hệ thống (chỉ dành cho admin)
   */
  async listUsers(): Promise<AdminUser[]> {
    const res = await apiClient.get<ApiResponse<AdminUser[]>>('/admin/users')
    return res.data
  },

  /**
   * Lấy thông tin một người dùng theo ID (chỉ dành cho admin)
   */
  async getUser(id: string): Promise<AdminUser> {
    const res = await apiClient.get<ApiResponse<AdminUser>>(`/admin/users/${id}`)
    return res.data
  },

  /**
   * Cập nhật vai trò hoặc trạng thái tài khoản (chỉ dành cho admin)
   */
  async updateUser(
    id: string,
    payload: { role?: string; status?: string }
  ): Promise<AdminUser> {
    const res = await apiClient.patch<ApiResponse<AdminUser>>(
      `/admin/users/${id}`,
      payload
    )
    return res.data
  },

  /**
   * Xóa tài khoản người dùng (chỉ dành cho admin)
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete<void>(`/admin/users/${id}`)
  },
}
