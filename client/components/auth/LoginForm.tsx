'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Form } from '@/components/ui/form-adapters/rhf-form-field'
import {
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/form/FormField'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void | Promise<void>
  loading?: boolean
  inactiveMessage?: string | null
  serverError?: string | null
}

export default function LoginForm({
  onSubmit,
  loading = false,
  inactiveMessage = null,
  serverError = null,
}: LoginFormProps) {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  return (
    <Form
      form={form}
      onSubmit={onSubmit}
      className="bg-surface shadow-card mx-auto mt-16 max-w-md space-y-4 rounded-xl p-6"
    >
      <h1 className="text-xl font-semibold">Đăng nhập</h1>
      
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <FormField name="email" isInvalid={!!fieldState.error} isRequired>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="Nhập email" {...field} />
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
              <Input type="password" placeholder="Nhập mật khẩu" {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormField>
        )}
      />

      {(inactiveMessage || serverError) && (
        <p role="alert" className="text-danger text-sm">
          {inactiveMessage ?? serverError}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Đang xử lý…' : 'Đăng nhập'}
      </Button>

      <div className="text-center">
        <a href="/register" className="text-brand text-sm underline">
          Chưa có tài khoản? Đăng ký
        </a>
      </div>
    </Form>
  )
}
