'use client'

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Group,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { getErrorMessage } from '@/lib/form-errors'
import { catalogQueries } from '@/queries/catalog.queries'
import type { EducationEntry } from '@/types'
import {
  educationSchema,
  type EducationFormValues,
} from '@/components/resume/resume-schemas'

export interface EducationEditFormProps {
  initialValues: EducationFormValues
  onSave: (data: EducationEntry) => Promise<void>
  onSuccess: () => void
  onCancel: () => void
  onDirtyChange?: (dirty: boolean) => void
}

export default function EducationEditForm({
  initialValues,
  onSave,
  onSuccess,
  onCancel,
  onDirtyChange,
}: Readonly<EducationEditFormProps>) {
  const catalogQuery = useQuery(catalogQueries.interviewOptions())
  const degreeOptions = [
    { value: '', label: 'Chọn trình độ' },
    ...(catalogQuery.data?.educationDegrees ?? []),
  ]

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<EducationFormValues>({
    mode: 'uncontrolled',
    initialValues,
    validate: schemaResolver(educationSchema, { sync: true }),
    onValuesChange: () => onDirtyChange?.(true),
  })

  async function handleSubmit(values: EducationFormValues) {
    setSaving(true)
    setError(null)
    try {
      await onSave(values)
      onDirtyChange?.(false)
      notifications.show({
        title: 'Đã cập nhật',
        message: 'Thông tin học vấn đã được lưu.',
        color: 'success',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
      onSuccess()
    } catch (err) {
      setError(getErrorMessage(err, 'Lưu thất bại'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box component="form" onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <Stack gap="md">
        {error ? (
          <Alert
            color="danger"
            variant="light"
            role="alert"
            icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
          >
            {error}
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {catalogQuery.isPending ? (
            <Stack gap={4}>
              <Text size="sm" fw={500}>
                Trình độ
              </Text>
              <Skeleton h={36} radius="sm" />
            </Stack>
          ) : catalogQuery.isError ? (
            <Alert
              color="danger"
              variant="light"
              role="alert"
              title="Không thể tải danh mục cấu hình"
              icon={
                <IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />
              }
            >
              <Stack gap="xs">
                <Text size="xs">
                  Không thể tải danh mục trình độ học vấn từ máy chủ.
                </Text>
                <Group>
                  <Button
                    type="button"
                    size="compact-xs"
                    variant="light"
                    color="danger"
                    onClick={() => void catalogQuery.refetch()}
                  >
                    Thử lại
                  </Button>
                </Group>
              </Stack>
            </Alert>
          ) : (
            <Select
              id="education-degree"
              clearable
              label="Trình độ"
              placeholder="Chọn trình độ..."
              data={degreeOptions}
              disabled={saving}
              key={form.key('degree')}
              {...form.getInputProps('degree')}
              onChange={(val) => form.setFieldValue('degree', val ?? '')}
            />
          )}

          <TextInput
            id="education-grad-year"
            label="Năm tốt nghiệp"
            placeholder="2024"
            maxLength={4}
            disabled={saving}
            key={form.key('graduationYear')}
            {...form.getInputProps('graduationYear')}
          />
        </SimpleGrid>

        <TextInput
          id="education-school"
          label="Trường"
          placeholder="Đại học Bách Khoa Hà Nội"
          disabled={saving}
          key={form.key('school')}
          {...form.getInputProps('school')}
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            id="education-major"
            label="Ngành học"
            placeholder="Công nghệ thông tin"
            disabled={saving}
            key={form.key('major')}
            {...form.getInputProps('major')}
          />

          <TextInput
            id="education-gpa"
            label="GPA / CPA"
            placeholder="3.2 / 4.0"
            disabled={saving}
            key={form.key('gpa')}
            {...form.getInputProps('gpa')}
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
            onClick={() => {
              onDirtyChange?.(false)
              onCancel()
            }}
            disabled={saving}
          >
            Hủy
          </Button>
        </Group>
      </Stack>
    </Box>
  )
}
