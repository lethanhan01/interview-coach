'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Alert,
  Anchor,
  Box,
  Button,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'
import {
  registerSchema,
  type RegisterFormData,
} from '@/components/auth/auth-schemas'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'

export {
  registerSchema,
  type RegisterFormData,
} from '@/components/auth/auth-schemas'

export interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void | Promise<void>
  loading?: boolean
  serverError?: string | null
  fieldErrors?: Partial<Record<keyof RegisterFormData, string>> | null
}

export default function RegisterForm({
  onSubmit,
  loading = false,
  serverError = null,
  fieldErrors = null,
}: Readonly<RegisterFormProps>) {
  const [passwordValue, setPasswordValue] = useState('')

  const form = useForm<RegisterFormData>({
    mode: 'uncontrolled',
    initialValues: {
      lastname: '',
      firstname: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: schemaResolver(registerSchema, { sync: true }),
    onValuesChange: (values) => {
      setPasswordValue(values.password)
    },
  })

  const { setErrors } = form

  useEffect(() => {
    if (fieldErrors) {
      setErrors(fieldErrors)
    }
  }, [fieldErrors, setErrors])

  return (
    <Stack gap="lg">
      <Stack gap={4} ta="center">
        <Title order={1} size="h2">
          Tạo tài khoản
        </Title>
        <Text size="sm" c="dimmed">
          Bắt đầu hành trình nâng cao kỹ năng phỏng vấn của bạn
        </Text>
      </Stack>

      <Box
        component="form"
        onSubmit={form.onSubmit((values) => onSubmit(values))}
        noValidate
      >
        <Stack gap="md">
          {serverError ? (
            <Alert
              color="danger"
              variant="light"
              role="alert"
              icon={
                <IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />
              }
            >
              {serverError}
            </Alert>
          ) : null}

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              withAsterisk
              label="Họ"
              placeholder="Nguyễn"
              autoComplete="family-name"
              disabled={loading}
              key={form.key('lastname')}
              {...form.getInputProps('lastname')}
            />

            <TextInput
              withAsterisk
              label="Tên"
              placeholder="Văn A"
              autoComplete="given-name"
              disabled={loading}
              key={form.key('firstname')}
              {...form.getInputProps('firstname')}
            />
          </SimpleGrid>

          <TextInput
            withAsterisk
            type="email"
            label="Email"
            placeholder="Địa chỉ email của bạn"
            autoComplete="email"
            disabled={loading}
            key={form.key('email')}
            {...form.getInputProps('email')}
          />

          <Stack gap="xs">
            <PasswordInput
              withAsterisk
              label="Mật khẩu"
              placeholder="Ít nhất 12 ký tự"
              autoComplete="new-password"
              disabled={loading}
              key={form.key('password')}
              {...form.getInputProps('password')}
            />
            <PasswordStrengthMeter password={passwordValue} />
          </Stack>

          <PasswordInput
            withAsterisk
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            disabled={loading}
            key={form.key('confirmPassword')}
            {...form.getInputProps('confirmPassword')}
          />

          <Button
            type="submit"
            color="brand"
            fullWidth
            mt="xs"
            loading={loading}
            disabled={loading}
          >
            Đăng ký
          </Button>
        </Stack>
      </Box>

      <Text size="sm" c="dimmed" ta="center">
        Đã có tài khoản?{' '}
        <Anchor
          component={Link}
          href="/login"
          size="sm"
          c="brand"
          underline="always"
        >
          Đăng nhập ngay
        </Anchor>
      </Text>
    </Stack>
  )
}
