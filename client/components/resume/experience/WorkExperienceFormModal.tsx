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
import type { WorkExperienceEntry } from '@/types'
import {
  workExperienceItemSchema,
  type WorkExperienceFormValues,
} from '@/components/resume/resume-schemas'

export interface WorkExperienceFormModalProps {
  opened: boolean
  initialEntry: WorkExperienceEntry | null
  suggestedTechs: string[]
  onClose: () => void
  onSubmit: (entry: WorkExperienceEntry) => Promise<void>
}

function toInitialValues(
  entry: WorkExperienceEntry | null
): WorkExperienceFormValues {
  return {
    company: entry?.company ?? '',
    position: entry?.position ?? '',
    startDate: toMantineMonthDate(entry?.startDate),
    endDate: entry?.isCurrent ? null : toMantineMonthDate(entry?.endDate),
    isCurrent: Boolean(entry?.isCurrent),
    description: entry?.description ?? '',
    techStack: entry?.techStack ?? [],
  }
}

export default function WorkExperienceFormModal({
  opened,
  initialEntry,
  suggestedTechs,
  onClose,
  onSubmit,
}: Readonly<WorkExperienceFormModalProps>) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCurrent, setIsCurrent] = useState(Boolean(initialEntry?.isCurrent))

  const form = useForm<WorkExperienceFormValues>({
    mode: 'uncontrolled',
    initialValues: toInitialValues(initialEntry),
    validate: schemaResolver(workExperienceItemSchema, { sync: true }),
    onValuesChange: (values) => {
      setIsCurrent(values.isCurrent)
    },
  })

  async function handleFormSubmit(values: WorkExperienceFormValues) {
    setSaving(true)
    setError(null)
    try {
      const entry: WorkExperienceEntry = {
        id: initialEntry?.id || crypto.randomUUID(),
        company: values.company.trim(),
        position: values.position.trim(),
        startDate: fromMantineMonthDate(values.startDate),
        endDate: values.isCurrent ? '' : fromMantineMonthDate(values.endDate),
        isCurrent: values.isCurrent,
        description: values.description.trim(),
        techStack: values.techStack,
      }
      await onSubmit(entry)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể lưu kinh nghiệm làm việc'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={
        initialEntry
          ? 'Chỉnh sửa kinh nghiệm làm việc'
          : 'Thêm kinh nghiệm làm việc'
      }
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

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              withAsterisk
              label="Công ty"
              placeholder="VD: FPT Software, VNG..."
              disabled={saving}
              key={form.key('company')}
              {...form.getInputProps('company')}
            />
            <TextInput
              withAsterisk
              label="Vị trí"
              placeholder="VD: Frontend Developer"
              disabled={saving}
              key={form.key('position')}
              {...form.getInputProps('position')}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <MonthPickerInput
              withAsterisk
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
            label="Đang làm việc tại đây"
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

          <Textarea
            autosize
            minRows={3}
            label="Mô tả công việc & thành tích"
            placeholder="Mô tả vai trò, trách nhiệm và các kết quả nổi bật..."
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
              {initialEntry ? 'Lưu thay đổi' : 'Thêm kinh nghiệm'}
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  )
}
