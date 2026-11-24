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
  Switch,
  TagsInput,
  Textarea,
  TextInput,
} from '@mantine/core'
import { MonthPickerInput } from '@mantine/dates'
import { schemaResolver, useForm } from '@mantine/form'
import { IconAlertCircle, IconCalendar } from '@tabler/icons-react'
import { fromMantineMonthDate, toMantineMonthDate } from '@/lib/date-time'
import { getErrorMessage } from '@/lib/form-errors'
import type { ProjectEntry } from '@/types'
import { projectItemSchema, type ProjectFormValues } from './resume-schemas'

export interface ProjectFormModalProps {
  opened: boolean
  initialEntry: ProjectEntry | null
  suggestedTechs: string[]
  onClose: () => void
  onSubmit: (entry: ProjectEntry) => Promise<void>
}

function toInitialValues(entry: ProjectEntry | null): ProjectFormValues {
  return {
    name: entry?.name ?? '',
    url: entry?.url ?? '',
    startDate: toMantineMonthDate(entry?.startDate),
    endDate: entry?.isCurrent ? null : toMantineMonthDate(entry?.endDate),
    isCurrent: Boolean(entry?.isCurrent),
    description: entry?.description ?? '',
    techStack: entry?.techStack ?? [],
  }
}

export default function ProjectFormModal({
  opened,
  initialEntry,
  suggestedTechs,
  onClose,
  onSubmit,
}: Readonly<ProjectFormModalProps>) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCurrent, setIsCurrent] = useState(Boolean(initialEntry?.isCurrent))

  const form = useForm<ProjectFormValues>({
    mode: 'uncontrolled',
    initialValues: toInitialValues(initialEntry),
    validate: schemaResolver(projectItemSchema, { sync: true }),
    onValuesChange: (values) => {
      setIsCurrent(values.isCurrent)
    },
  })

  async function handleFormSubmit(values: ProjectFormValues) {
    setSaving(true)
    setError(null)
    try {
      const entry: ProjectEntry = {
        id: initialEntry?.id || crypto.randomUUID(),
        name: values.name.trim(),
        url: values.url.trim(),
        startDate: fromMantineMonthDate(values.startDate),
        endDate: values.isCurrent ? '' : fromMantineMonthDate(values.endDate),
        isCurrent: values.isCurrent,
        description: values.description.trim(),
        techStack: values.techStack,
      }
      await onSubmit(entry)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể lưu dự án'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={initialEntry ? 'Chỉnh sửa dự án' : 'Thêm dự án cá nhân'}
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
            label="Tên dự án"
            placeholder="VD: InterviewCoach"
            disabled={saving}
            key={form.key('name')}
            {...form.getInputProps('name')}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <MonthPickerInput
              clearable
              label="Tháng bắt đầu"
              placeholder="Chọn tháng/năm"
              valueFormat="MM/YYYY"
              leftSection={
                <IconCalendar size={16} stroke={1.5} aria-hidden="true" />
              }
              disabled={saving}
              key={form.key('startDate')}
              {...form.getInputProps('startDate')}
            />
            <MonthPickerInput
              clearable
              label="Tháng kết thúc"
              placeholder={isCurrent ? 'Hiện tại' : 'Chọn tháng/năm'}
              valueFormat="MM/YYYY"
              leftSection={
                <IconCalendar size={16} stroke={1.5} aria-hidden="true" />
              }
              disabled={saving || isCurrent}
              key={form.key('endDate')}
              {...form.getInputProps('endDate')}
            />
          </SimpleGrid>

          <Switch
            label="Dự án đang thực hiện"
            disabled={saving}
            key={form.key('isCurrent')}
            {...form.getInputProps('isCurrent', { type: 'checkbox' })}
            onChange={(event) => {
              const checked = event.currentTarget.checked
              form.setFieldValue('isCurrent', checked)
              if (checked) form.setFieldValue('endDate', null)
            }}
          />

          <TagsInput
            label="Tech stack"
            placeholder="Chọn từ kỹ năng hồ sơ hoặc gõ rồi nhấn Enter"
            data={suggestedTechs}
            disabled={saving}
            key={form.key('techStack')}
            {...form.getInputProps('techStack')}
          />

          <TextInput
            label="Link dự án"
            placeholder="https://github.com/..."
            disabled={saving}
            key={form.key('url')}
            {...form.getInputProps('url')}
          />

          <Textarea
            autosize
            minRows={3}
            label="Mô tả dự án"
            placeholder="Mô tả ngắn về bài toán, vai trò và kết quả đạt được..."
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
              {initialEntry ? 'Lưu thay đổi' : 'Thêm dự án'}
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  )
}
