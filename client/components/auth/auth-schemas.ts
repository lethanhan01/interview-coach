import { z } from 'zod'
import type { SemanticColor } from '@/theme'

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128
export const NAME_MAX_LENGTH = 100

const emailField = z
  .string()
  .trim()
  .min(1, 'Email là bắt buộc')
  .email('Email không hợp lệ')

const newPasswordField = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`
  )
  .max(PASSWORD_MAX_LENGTH, `Mật khẩu tối đa ${PASSWORD_MAX_LENGTH} ký tự`)

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
})
export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    lastname: z
      .string()
      .trim()
      .min(1, 'Họ là bắt buộc')
      .max(NAME_MAX_LENGTH, `Họ tối đa ${NAME_MAX_LENGTH} ký tự`),
    firstname: z
      .string()
      .trim()
      .min(1, 'Tên là bắt buộc')
      .max(NAME_MAX_LENGTH, `Tên tối đa ${NAME_MAX_LENGTH} ký tự`),
    email: emailField,
    password: newPasswordField,
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu và xác nhận mật khẩu không khớp',
    path: ['confirmPassword'],
  })
export type RegisterFormData = z.infer<typeof registerSchema>

export const resetPasswordRequestSchema = z.object({
  email: emailField,
})
export type ResetPasswordRequestFormData = z.infer<
  typeof resetPasswordRequestSchema
>

export const resetPasswordConfirmSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Mã xác thực phải gồm đúng 6 chữ số'),
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
export type ResetPasswordConfirmFormData = z.infer<
  typeof resetPasswordConfirmSchema
>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export const personalInfoSchema = z.object({
  lastname: z
    .string()
    .trim()
    .min(1, 'Họ không được để trống')
    .max(NAME_MAX_LENGTH, `Họ tối đa ${NAME_MAX_LENGTH} ký tự`),
  firstname: z
    .string()
    .trim()
    .min(1, 'Tên không được để trống')
    .max(NAME_MAX_LENGTH, `Tên tối đa ${NAME_MAX_LENGTH} ký tự`),
})
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>

export interface PasswordCriterion {
  key: 'length' | 'lowercase' | 'uppercase' | 'numberOrSymbol'
  label: string
  met: boolean
}

export interface PasswordStrengthResult {
  score: number
  color: Extract<SemanticColor, 'danger' | 'warning' | 'success'>
  label: string
  checks: PasswordCriterion[]
}

export function evaluatePasswordStrength(
  password: string
): PasswordStrengthResult {
  const checks: PasswordCriterion[] = [
    {
      key: 'length',
      label: `Ít nhất ${PASSWORD_MIN_LENGTH} ký tự`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      key: 'lowercase',
      label: 'Có chữ cái thường (a–z)',
      met: /[a-z]/.test(password),
    },
    {
      key: 'uppercase',
      label: 'Có chữ cái viết hoa (A–Z)',
      met: /[A-Z]/.test(password),
    },
    {
      key: 'numberOrSymbol',
      label: 'Có chữ số hoặc ký tự đặc biệt',
      met: /[0-9]|[^A-Za-z0-9]/.test(password),
    },
  ]

  const passedCount = checks.filter((item) => item.met).length
  const score = passedCount * 25
  const color: PasswordStrengthResult['color'] =
    score === 100 ? 'success' : score >= 50 ? 'warning' : 'danger'
  const label =
    password.length === 0
      ? 'Chưa nhập mật khẩu'
      : score === 100
        ? 'Mạnh'
        : score >= 50
          ? 'Trung bình'
          : 'Yếu'

  return { score, color, label, checks }
}
