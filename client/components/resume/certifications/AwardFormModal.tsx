'use client'

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { schemaResolver, useForm } from '@mantine/form'
import { IconAlertCircle, IconCalendar } from '@tabler/icons-react'
import { toMantineMonthDate } from '@/lib/date-time'
import { getErrorMessage } from '@/lib/form-errors'
import type { AwardEntry } from '@/types'
import {
  awardItemSchema,
  type AwardFormValues,
} from '@/components/resume/resume-schemas'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function toPickerDate(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (ISO_DATE_RE.test(trimmed)) return trimmed
  return toMantineMonthDate(trimmed)
}

export interface AwardFormModalProps {
  opened: boolean
  initialEntry: AwardEntry | null
  onClose: () => void
  onSubmit: (entry: AwardEntry) => Promise<void>
}

export default function AwardFormModal({
  opened,
  initialEntry,
  onClose,
  onSubmit,
}: Readonly<AwardFormModalProps>) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AwardFormValues>({
    mode: 'uncontrolled',
    initialValues: {
      name: initialEntry?.name ?? '',
      organization: initialEntry?.organization ?? '',
      date: toPickerDate(initialEntry?.date),
      description: initialEntry?.description ?? '',
    },
    validate: schemaResolver(awardItemSchema, { sync: true }),
  })

  async function handleFormSubmit(values: AwardFormValues) {
    setSaving(true)
    setError(null)
    try {
      const entry: AwardEntry = {
        id: initialEntry?.id || crypto.randomUUID(),
        name: values.name.trim(),
        organization: values.organization.trim(),
        date: values.date ?? '',
        description: values.description.trim(),
      }
      await onSubmit(entry)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể lưu giải thưởng'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={initialEntry ? 'Chỉnh sửa giải thưởng' : 'Thêm giải thưởng'}
      closeButtonProps={{ 'aria-label': 'Đóng hộp thoại' }}
    >
      <Box
        component="form"
        onSubmit={form.onSubmit(handleFormSubmit)}
        noValidate
      >
        <Stack gap="md">
          {error ? (
            <Alert
              color="danger"
              variant="light"
              role="alert"
              icon={
                <IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />
              }
            >
              {error}
            </Alert>
          ) : null}

          <TextInput
            withAsterisk
            label="Tên giải thưởng"
            placeholder="VD: Giải Nhất Hackathon AI 2025"
            disabled={saving}
            key={form.key('name')}
            {...form.getInputProps('name')}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Tổ chức trao"
              placeholder="VD: FPT University, Bộ KH&CN"
              disabled={saving}
              key={form.key('organization')}
              {...form.getInputProps('organization')}
            />
            <DatePickerInput
              clearable
              label="Ngày nhận"
              placeholder="Chọn ngày/tháng/năm"
              valueFormat="DD/MM/YYYY"
              leftSection={
                <IconCalendar size={16} stroke={1.5} aria-hidden="true" />
              }
              disabled={saving}
              key={form.key('date')}
              {...form.getInputProps('date')}
            />
          </SimpleGrid>

          <Textarea
            autosize
            minRows={2}
            label="Mô tả"
            placeholder="Mô tả thành tích (tùy chọn)..."
            disabled={saving}
            key={form.key('description')}
            {...form.getInputProps('description')}
          />

          <Group justify="flex-end" gap="xs">
            <Button
              type="button"
              variant="subtle"
              color="neutral"
              disabled={saving}
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              color="brand"
              loading={saving}
              disabled={saving}
            >
              {initialEntry ? 'Lưu thay đổi' : 'Thêm giải thưởng'}
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  )
}
