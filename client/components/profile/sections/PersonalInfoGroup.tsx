'use client'

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Group,
  SimpleGrid,
  Stack,
  TextInput,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconPencil } from '@tabler/icons-react'
import {
  personalInfoSchema,
  type PersonalInfoFormData,
} from '@/components/auth/auth-schemas'
import { extractApiFieldErrors, getErrorMessage } from '@/lib/form-errors'
import ProfileField from '@/components/profile/primitives/ProfileField'
import ProfileSection from '@/components/profile/primitives/ProfileSection'

export interface PersonalInfoData {
  firstname?: string
  lastname?: string
}

export interface PersonalInfoGroupProps {
  data: PersonalInfoData
  onSave: (data: PersonalInfoData) => Promise<void>
}

const PERSONAL_INFO_FIELDS = ['lastname', 'firstname'] as const

export default function PersonalInfoGroup({
  data,
  onSave,
}: Readonly<PersonalInfoGroupProps>) {
  const [isEditing, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<PersonalInfoFormData>({
    mode: 'uncontrolled',
    initialValues: {
      lastname: data.lastname ?? '',
      firstname: data.firstname ?? '',
    },
    validate: schemaResolver(personalInfoSchema, { sync: true }),
  })

  function handleStartEdit() {
    form.setValues({
      lastname: data.lastname ?? '',
      firstname: data.firstname ?? '',
    })
    form.clearErrors()
    setServerError(null)
    openEdit()
  }

  function handleCancel() {
    form.setValues({
      lastname: data.lastname ?? '',
      firstname: data.firstname ?? '',
    })
    form.clearErrors()
    setServerError(null)
    closeEdit()
  }

  async function handleSubmit(values: PersonalInfoFormData) {
    setSaving(true)
    setServerError(null)

    try {
      await onSave({
        lastname: values.lastname.trim(),
        firstname: values.firstname.trim(),
      })
      notifications.show({
        title: 'Đã cập nhật',
        message: 'Thông tin cá nhân đã được lưu thành công.',
        color: 'success',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
      closeEdit()
    } catch (err) {
      const mapped = extractApiFieldErrors(err, {
        allowedFields: PERSONAL_INFO_FIELDS,
      })
      if (mapped) form.setErrors(mapped)
      setServerError(getErrorMessage(err, 'Lưu thất bại'))
    } finally {
      setSaving(false)
    }
  }

  const fullName =
    [data.lastname, data.firstname].filter(Boolean).join(' ') || undefined

  return (
    <ProfileSection
      title="Thông tin cá nhân"
      action={
        !isEditing ? (
          <Button
            type="button"
            variant="light"
            color="brand"
            size="xs"
            leftSection={
              <IconPencil size={14} stroke={1.5} aria-hidden="true" />
            }
            onClick={handleStartEdit}
          >
            Chỉnh sửa
          </Button>
        ) : undefined
      }
    >
      {!isEditing ? (
        <Box component="dl" m={0}>
          <ProfileField label="Họ và tên" value={fullName} />
        </Box>
      ) : (
        <Box component="form" onSubmit={form.onSubmit(handleSubmit)} noValidate>
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
                id="profile-lastname"
                withAsterisk
                label="Họ"
                placeholder="Nguyễn Văn"
                autoComplete="family-name"
                disabled={saving}
                key={form.key('lastname')}
                {...form.getInputProps('lastname')}
              />

              <TextInput
                id="profile-firstname"
                withAsterisk
                label="Tên"
                placeholder="A"
                autoComplete="given-name"
                disabled={saving}
                key={form.key('firstname')}
                {...form.getInputProps('firstname')}
              />
            </SimpleGrid>

            <Group gap="xs">
              <Button
                type="submit"
                color="brand"
                loading={saving}
                disabled={saving}
              >
                Lưu thay đổi
              </Button>
              <Button
                type="button"
                variant="subtle"
                color="neutral"
                onClick={handleCancel}
                disabled={saving}
              >
                Hủy
              </Button>
            </Group>
          </Stack>
        </Box>
      )}
    </ProfileSection>
  )
}
