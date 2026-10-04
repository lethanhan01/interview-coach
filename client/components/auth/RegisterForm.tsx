'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Form } from '@/components/ui/form-adapters/rhf-form-field'
import {
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/form/FormField'

export const registerSchema = z
  .object({
    lastname: z.string().min(1, 'Họ là bắt buộc'),
    firstname: z.string().min(1, 'Tên là bắt buộc'),
    email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
    password: z.string().min(12, 'Mật khẩu phải có ít nhất 12 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu và xác nhận mật khẩu không khớp',
    path: ['confirmPassword'],
  })

export type RegisterFormData = z.infer<typeof registerSchema>

export interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void | Promise<void>
  loading?: boolean
  serverError?: string | null
}

export default function RegisterForm({
  onSubmit,
  loading = false,
  serverError = null,
}: RegisterFormProps) {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      lastname: '',
      firstname: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  return (
    <div className="bg-surface-raised flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <Form
        form={form}
        onSubmit={onSubmit}
        className="bg-surface shadow-card border-border w-full max-w-md rounded-2xl border p-8"
      >
        <h1 className="text-ink mb-2 text-center text-2xl font-bold">
          Tạo tài khoản
        </h1>
        <p className="text-ink-muted mb-8 text-center text-sm">
          Bắt đầu hành trình nâng cao kỹ năng phỏng vấn của bạn
        </p>

        {serverError && (
          <div
            className="bg-danger-bg text-danger border-danger/20 mb-6 rounded-lg border p-3 text-center text-sm"
            role="alert"
          >
            {serverError}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="lastname"
              render={({ field, fieldState }) => (
                <FormField name="lastname" isInvalid={!!fieldState.error} isRequired>
                  <FormLabel>Họ</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Nguyễn" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormField>
              )}
            />

            <Controller
              control={form.control}
              name="firstname"
              render={({ field, fieldState }) => (
                <FormField name="firstname" isInvalid={!!fieldState.error} isRequired>
                  <FormLabel>Tên</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Văn A" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormField>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormField name="email" isInvalid={!!fieldState.error} isRequired>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Địa chỉ email của bạn" {...field} />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormField>
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormField name="password" isInvalid={!!fieldState.error} isRequired>
                <FormLabel>Mật khẩu</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Ít nhất 12 ký tự" {...field} />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormField>
            )}
          />

          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <FormField name="confirmPassword" isInvalid={!!fieldState.error} isRequired>
                <FormLabel>Xác nhận Mật khẩu</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Nhập lại mật khẩu" {...field} />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormField>
            )}
          />
        </div>

        <Button type="submit" loading={loading} disabled={loading} className="mt-6 w-full">
          Đăng ký
        </Button>

        <div className="text-ink-muted mt-6 text-center text-sm">
          Đã có tài khoản?{' '}
          <Link
            href="/login"
            className="text-brand hover:text-brand-light font-medium transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </Form>
    </div>
  )
}

