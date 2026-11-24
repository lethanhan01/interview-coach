'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  Group,
  Input,
  Paper,
  PasswordInput,
  PinInput,
  Stack,
  Text,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import {
  resetPasswordConfirmSchema,
  type ResetPasswordConfirmFormData,
} from '@/components/auth/auth-schemas'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'

export interface ResetPasswordConfirmStepProps {
  email: string
  loading: boolean
  onBack: () => void
  onSubmit: (
    values: ResetPasswordConfirmFormData,
    setErrors: (
      errors: Partial<Record<keyof ResetPasswordConfirmFormData, string>>
    ) => void
  ) => Promise<void>
}

export function ResetPasswordConfirmStep({
  email,
  loading,
  onBack,
  onSubmit,
}: Readonly<ResetPasswordConfirmStepProps>) {
  const [newPasswordValue, setNewPasswordValue] = useState('')

  const form = useForm<ResetPasswordConfirmFormData>({
    mode: 'uncontrolled',
    initialValues: {
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: schemaResolver(resetPasswordConfirmSchema, { sync: true }),
    onValuesChange: (values) => {
      setNewPasswordValue(values.newPassword)
    },
  })

  return (
    <Box
      component="form"
      onSubmit={form.onSubmit((values) => onSubmit(values, form.setErrors))}
      noValidate
    >
      <Stack gap="md">
        <Paper withBorder p="xs" radius="sm">
          <Group justify="space-between" gap="xs" wrap="nowrap">
            <Stack gap={0}>
              <Text size="xs" c="dimmed">
                Email nhận mã
              </Text>
              <Text size="sm" fw={500}>
                {email}
              </Text>
            </Stack>
            <Button
              type="button"
              variant="subtle"
              size="xs"
              color="brand"
              onClick={onBack}
              disabled={loading}
            >
              Đổi email / Gửi lại mã
            </Button>
          </Group>
        </Paper>

        <Input.Wrapper
          label="Mã xác thực (6 số)"
          withAsterisk
          error={form.errors.code}
        >
          <Group justify="center" mt={4}>
            <PinInput
              length={6}
              type="number"
              oneTimeCode
              ariaLabel="Mã xác thực 6 số"
              disabled={loading}
              key={form.key('code')}
              {...form.getInputProps('code')}
              error={Boolean(form.errors.code)}
            />
          </Group>
        </Input.Wrapper>

        <Stack gap="xs">
          <PasswordInput
            withAsterisk
            label="Mật khẩu mới"
            placeholder="Ít nhất 12 ký tự"
            autoComplete="new-password"
            disabled={loading}
            key={form.key('newPassword')}
            {...form.getInputProps('newPassword')}
          />
          <PasswordStrengthMeter password={newPasswordValue} />
        </Stack>

        <PasswordInput
          withAsterisk
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          disabled={loading}
          key={form.key('confirmPassword')}
          {...form.getInputProps('confirmPassword')}
        />

        <Button
          type="submit"
          color="brand"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          Xác nhận đổi mật khẩu
        </Button>
      </Stack>
    </Box>
  )
}
