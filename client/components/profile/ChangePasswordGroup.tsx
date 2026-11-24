'use client'

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Group,
  PasswordInput,
  SimpleGrid,
  Stack,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconCheck, IconKey } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '@/components/auth/auth-schemas'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'
import { extractApiFieldErrors, getErrorMessage } from '@/lib/form-errors'
import { queryKeys } from '@/lib/query-client'
import { authService } from '@/services/auth.service'
import ProfileSection from './ProfileSection'

const CHANGE_PASSWORD_FIELDS = ['currentPassword', 'newPassword'] as const

export default function ChangePasswordGroup() {
  const queryClient = useQueryClient()
  const [newPasswordValue, setNewPasswordValue] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ChangePasswordFormData>({
    mode: 'uncontrolled',
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: schemaResolver(changePasswordSchema, { sync: true }),
    onValuesChange: (values) => {
      setNewPasswordValue(values.newPassword)
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string
      newPassword: string
    }) => authService.changePassword(currentPassword, newPassword),
  })

  const loading = changePasswordMutation.isPending

  async function handleSubmit(values: ChangePasswordFormData) {
    setServerError(null)
    setIsSuccess(false)

    try {
      const updatedUser = await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      if (updatedUser) {
        queryClient.setQueryData(queryKeys.auth.me(), updatedUser)
      }
      form.reset()
      setNewPasswordValue('')
      setIsSuccess(true)
      notifications.show({
        title: 'Đổi mật khẩu thành công',
        message: 'Mật khẩu tài khoản của bạn đã được cập nhật.',
        color: 'success',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
    } catch (err) {
      const mapped = extractApiFieldErrors(err, {
        allowedFields: CHANGE_PASSWORD_FIELDS,
        codeToField: {
          INVALID_CREDENTIALS: 'currentPassword',
          AUTH_INVALID_CREDENTIALS: 'currentPassword',
        },
      })
      if (mapped) form.setErrors(mapped)
      setServerError(getErrorMessage(err, 'Đổi mật khẩu không thành công.'))
    }
  }

  return (
    <ProfileSection title="Đổi mật khẩu & Bảo mật">
      <Box component="form" onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack gap="md">
          {isSuccess ? (
            <Alert
              color="success"
              variant="light"
              role="status"
              icon={<IconCheck size={18} stroke={1.5} aria-hidden="true" />}
            >
              Đổi mật khẩu thành công!
            </Alert>
          ) : null}

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

          <PasswordInput
            id="current-password"
            withAsterisk
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            autoComplete="current-password"
            disabled={loading}
            key={form.key('currentPassword')}
            {...form.getInputProps('currentPassword')}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <PasswordInput
              id="new-password"
              withAsterisk
              label="Mật khẩu mới"
              placeholder="Tối thiểu 12 ký tự"
              autoComplete="new-password"
              disabled={loading}
              key={form.key('newPassword')}
              {...form.getInputProps('newPassword')}
            />

            <PasswordInput
              id="confirm-password"
              withAsterisk
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              disabled={loading}
              key={form.key('confirmPassword')}
              {...form.getInputProps('confirmPassword')}
            />
          </SimpleGrid>

          <PasswordStrengthMeter password={newPasswordValue} />

          <Group pt="xs">
            <Button
              type="submit"
              color="brand"
              loading={loading}
              disabled={loading}
              leftSection={
                <IconKey size={16} stroke={1.5} aria-hidden="true" />
              }
            >
              Cập nhật mật khẩu
            </Button>
          </Group>
        </Stack>
      </Box>
    </ProfileSection>
  )
}
