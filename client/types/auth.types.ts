export type UserRole = 'candidate' | 'admin'

export interface CurrentUser {
  id: string
  email: string
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  status: string
  firstname: string | null
  lastname: string | null
  emailVerified?: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  firstname: string
  lastname: string
}

export interface PasswordResetRequestPayload {
  email: string
}

export interface PasswordResetConfirmPayload {
  email: string
  code: string
  newPassword: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
  data?: {
    id: string
    email: string
    role: string
    status: string
    firstname: string | null
    lastname: string | null
  }
}

export interface ConfirmEmailVerificationPayload {
  code: string
}
