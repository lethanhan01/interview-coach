'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Anchor,
  Box,
  Button,
  Group,
  Stack,
  Stepper,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle,
  IconArrowLeft,
  IconKey,
  IconMail,
} from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  resetPasswordRequestSchema,
  type ResetPasswordConfirmFormData,
  type ResetPasswordRequestFormData,
} from '@/components/auth/auth-schemas'
import { applyAuthenticatedSession } from '@/providers/AuthProvider'
import { extractApiFieldErrors, getErrorMessage } from '@/lib/form-errors'
import { authService } from '@/services/auth.service'
import { ResetPasswordConfirmStep } from './ResetPasswordConfirmStep'

const REQUEST_FIELDS = ['email'] as const
const CONFIRM_FIELDS = ['code', 'newPassword'] as const

export default function ResetPasswordClient() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [activeStep, setActiveStep] = useState<0 | 1>(0)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)

  const requestForm = useForm<ResetPasswordRequestFormData>({
    mode: 'uncontrolled',
    initialValues: { email: '' },
    validate: schemaResolver(resetPasswordRequestSchema, { sync: true }),
  })

  const requestMutation = useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset({ email }),
  })

  const confirmMutation = useMutation({
    mutationFn: (payload: {
      email: string
      code: string
      newPassword: string
    }) => authService.confirmPasswordReset(payload),
  })

  const handleRequestSubmit = async (values: ResetPasswordRequestFormData) => {
    setServerError(null)
    try {
      await requestMutation.mutateAsync(values.email)
      setSubmittedEmail(values.email)
      setActiveStep(1)
      notifications.show({
        title: 'Đã gửi mã xác thực',
        message: 'Mã xác thực đặt lại mật khẩu đã được gửi đến email của bạn.',
        color: 'success',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
    } catch (err) {
      const mapped = extractApiFieldErrors(err, {
        allowedFields: REQUEST_FIELDS,
      })
      if (mapped) requestForm.setErrors(mapped)
      setServerError(
        getErrorMessage(
          err,
          'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.'
        )
      )
    }
  }

  const handleConfirmSubmit = async (
    values: ResetPasswordConfirmFormData,
    setErrors: (
      errors: Partial<Record<keyof ResetPasswordConfirmFormData, string>>
    ) => void
  ) => {
    setServerError(null)
    try {
      const user = await confirmMutation.mutateAsync({
        email: submittedEmail,
        code: values.code,
        newPassword: values.newPassword,
      })
      applyAuthenticatedSession(queryClient, user)
      notifications.show({
        title: 'Đặt lại mật khẩu thành công',
        message: 'Bạn đã được đăng nhập tự động vào hệ thống.',
        color: 'success',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/sessions')
    } catch (err) {
      const mapped = extractApiFieldErrors(err, {
        allowedFields: CONFIRM_FIELDS,
        codeToField: {
          INVALID_VERIFICATION_CODE: 'code',
        },
      })
      if (mapped) setErrors(mapped)
      setServerError(
        getErrorMessage(
          err,
          'Không thể đặt lại mật khẩu. Kiểm tra lại mã xác nhận hoặc email.'
        )
      )
    }
  }

  const handleBackToRequest = () => {
    setServerError(null)
    setActiveStep(0)
  }

  return (
    <Stack gap="lg">
      <Stack gap="xs" align="center" ta="center">
        <ThemeIcon color="brand" variant="light" size={44} radius="md">
          {activeStep === 0 ? (
            <IconMail size={22} stroke={1.5} aria-hidden="true" />
          ) : (
            <IconKey size={22} stroke={1.5} aria-hidden="true" />
          )}
        </ThemeIcon>
        <Title order={1} size="h2">
          {activeStep === 0 ? 'Quên mật khẩu?' : 'Đặt lại mật khẩu'}
        </Title>
        <Text size="sm" c="dimmed">
          {activeStep === 0
            ? 'Nhập email đã đăng ký để nhận mã xác thực đặt lại mật khẩu.'
            : 'Nhập mã 6 chữ số từ hộp thư và tạo mật khẩu mới.'}
        </Text>
      </Stack>

      <Stepper active={activeStep} size="xs" allowNextStepsSelect={false}>
        <Stepper.Step label="Nhập email" />
        <Stepper.Step label="Mật khẩu mới" />
      </Stepper>

      {serverError ? (
        <Alert
          color="danger"
          variant="light"
          role="alert"
          icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
        >
          {serverError}
        </Alert>
      ) : null}

      {activeStep === 0 ? (
        <Box
          component="form"
          onSubmit={requestForm.onSubmit(handleRequestSubmit)}
          noValidate
        >
          <Stack gap="md">
            <TextInput
              withAsterisk
              type="email"
              label="Địa chỉ Email"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={requestMutation.isPending}
              key={requestForm.key('email')}
              {...requestForm.getInputProps('email')}
            />

            <Button
              type="submit"
              color="brand"
              fullWidth
              loading={requestMutation.isPending}
              disabled={requestMutation.isPending}
            >
              Gửi mã xác thực
            </Button>
          </Stack>
        </Box>
      ) : (
        <ResetPasswordConfirmStep
          email={submittedEmail}
          loading={confirmMutation.isPending}
          onBack={handleBackToRequest}
          onSubmit={handleConfirmSubmit}
        />
      )}

      <Group justify="center">
        <Anchor component={Link} href="/login" size="sm" c="brand">
          <Group gap={4} wrap="nowrap">
            <IconArrowLeft size={16} stroke={1.5} aria-hidden="true" />
            <Text span size="sm">
              Quay lại Đăng nhập
            </Text>
          </Group>
        </Anchor>
      </Group>
    </Stack>
  )
}
