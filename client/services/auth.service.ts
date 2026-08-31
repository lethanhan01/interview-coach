import { apiClient } from '@/lib/api-client'
import type {
  AuthUser,
  ChangePasswordResponse,
  LoginPayload,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  RegisterPayload,
} from '@/lib/types'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export const authService = {
  /**
   * Đăng nhập người dùng và thiết lập cookie xác thực
   */
  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = await apiClient.post<ApiResponse<AuthUser>>('/auth/login', payload)
    return res.data
  },

  /**
   * Đăng ký tài khoản mới và thiết lập cookie xác thực
   */
  async register(payload: RegisterPayload): Promise<AuthUser> {
    const res = await apiClient.post<ApiResponse<AuthUser>>('/auth/register', payload)
    return res.data
  },

  /**
   * Đăng xuất và xóa cookie xác thực
   */
  async logout(): Promise<void> {
    await apiClient.post<void>('/auth/logout')
  },

  /**
   * Lấy thông tin người dùng hiện tại từ phiên cookie
   */
  async getMe(): Promise<AuthUser | null> {
    const res = await apiClient.get<ApiResponse<AuthUser | null>>('/auth/me')
    return res.data
  },

  /**
   * Đổi mật khẩu tài khoản và làm mới cookie
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthUser> {
    const res = await apiClient.post<ChangePasswordResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return res.data as AuthUser
  },

  /**
   * Yêu cầu gửi mã đặt lại mật khẩu qua email
   */
  async requestPasswordReset(payload: PasswordResetRequestPayload): Promise<void> {
    await apiClient.post<void>('/auth/password-reset/request', payload)
  },

  /**
   * Xác nhận đặt lại mật khẩu với email, mã xác thực và mật khẩu mới
   */
  async confirmPasswordReset(payload: PasswordResetConfirmPayload): Promise<AuthUser> {
    const res = await apiClient.post<ApiResponse<AuthUser>>(
      '/auth/password-reset/confirm',
      payload
    )
    return res.data
  },
}
