'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  Alert,
  Anchor,
  Box,
  Button,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-react'
import { loginSchema, type LoginFormData } from '@/components/auth/auth-schemas'

export { loginSchema, type LoginFormData } from '@/components/auth/auth-schemas'

export interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void | Promise<void>
  loading?: boolean
  inactiveMessage?: string | null
  sessionExpiredMessage?: string | null
  serverError?: string | null
  fieldErrors?: Partial<Record<keyof LoginFormData, string>> | null
}

export default function LoginForm({
  onSubmit,
  loading = false,
  inactiveMessage = null,
  sessionExpiredMessage = null,
  serverError = null,
  fieldErrors = null,
}: Readonly<LoginFormProps>) {
  const form = useForm<LoginFormData>({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      password: '',
    },
    validate: schemaResolver(loginSchema, { sync: true }),
  })

  const { setErrors } = form

  useEffect(() => {
    if (fieldErrors) {
      setErrors(fieldErrors)
    }
  }, [fieldErrors, setErrors])

  const dangerMessage = inactiveMessage ?? serverError

  return (
    <Stack gap="lg">
      <Stack gap={4} ta="center">
        <Title order={1} size="h2">
          Đăng nhập
        </Title>
        <Text size="sm" c="dimmed">
          Chưa có tài khoản?{' '}
          <Anchor
            component={Link}
            href="/register"
            size="sm"
            c="brand"
            underline="always"
          >
            Đăng ký
          </Anchor>
        </Text>
      </Stack>

      <Box
        component="form"
        onSubmit={form.onSubmit((values) => onSubmit(values))}
        noValidate
      >
        <Stack gap="md">
          {dangerMessage ? (
            <Alert
              color="danger"
              variant="light"
              role="alert"
              icon={
                <IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />
              }
            >
              {dangerMessage}
            </Alert>
          ) : sessionExpiredMessage ? (
            <Alert
              color="warning"
              variant="light"
              role="status"
              icon={
                <IconInfoCircle size={18} stroke={1.5} aria-hidden="true" />
              }
            >
              {sessionExpiredMessage}
            </Alert>
          ) : null}

          <TextInput
            withAsterisk
            type="email"
            label="Email"
            placeholder="Nhập email"
            autoComplete="email"
            disabled={loading}
            key={form.key('email')}
            {...form.getInputProps('email')}
          />

          <PasswordInput
            withAsterisk
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            disabled={loading}
            key={form.key('password')}
            {...form.getInputProps('password')}
          />

          <Group justify="flex-end">
            <Anchor component={Link} href="/reset-password" size="sm" c="brand">
              Quên mật khẩu?
            </Anchor>
          </Group>

          <Button
            type="submit"
            color="brand"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Đăng nhập
          </Button>
        </Stack>
      </Box>
    </Stack>
  )
}
