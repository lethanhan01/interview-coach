'use client'

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Group,
  Modal,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { schemaResolver, useForm } from '@mantine/form'
import { IconAlertCircle, IconCalendar } from '@tabler/icons-react'
import { toMantineMonthDate } from '@/lib/date-time'
import { getErrorMessage } from '@/lib/form-errors'
import type { CertificationEntry } from '@/types'
import {
  certificationItemSchema,
  type CertificationFormValues,
} from './resume-schemas'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function toPickerDate(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (ISO_DATE_RE.test(trimmed)) return trimmed
  return toMantineMonthDate(trimmed)
}

export interface CertificationFormModalProps {
  opened: boolean
  initialEntry: CertificationEntry | null
  defaultType?: CertificationEntry['type']
  onClose: () => void
  onSubmit: (entry: CertificationEntry) => Promise<void>
}

export default function CertificationFormModal({
  opened,
  initialEntry,
  defaultType = 'professional',
  onClose,
  onSubmit,
}: Readonly<CertificationFormModalProps>) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [certType, setCertType] = useState<CertificationEntry['type']>(
    initialEntry?.type ?? defaultType
  )

  const form = useForm<CertificationFormValues>({
    mode: 'uncontrolled',
    initialValues: {
      type: initialEntry?.type ?? defaultType,
      name: initialEntry?.name ?? '',
      issuer: initialEntry?.issuer ?? '',
      issueDate: toPickerDate(initialEntry?.issueDate),
      expiryDate: toPickerDate(initialEntry?.expiryDate),
      score: initialEntry?.score ?? '',
    },
    validate: schemaResolver(certificationItemSchema, { sync: true }),
    onValuesChange: (values) => {
      setCertType(values.type)
    },
  })

  async function handleFormSubmit(values: CertificationFormValues) {
    setSaving(true)
    setError(null)
    try {
      const entry: CertificationEntry = {
        id: initialEntry?.id || crypto.randomUUID(),
        type: values.type,
        name: values.name.trim(),
        issuer: values.issuer.trim(),
        issueDate: values.issueDate ?? '',
        expiryDate: values.expiryDate ?? '',
        score: values.type === 'language' ? values.score.trim() : '',
      }
      await onSubmit(entry)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể lưu chứng chỉ'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={initialEntry ? 'Chỉnh sửa chứng chỉ' : 'Thêm chứng chỉ'}
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

          <Stack gap={6}>
            <Text size="sm" fw={500}>
              Loại chứng chỉ
            </Text>
            <SegmentedControl
              aria-label="Loại chứng chỉ"
              disabled={saving}
              data={[
                { value: 'professional', label: 'Chuyên môn' },
                { value: 'language', label: 'Ngoại ngữ' },
              ]}
              value={certType}
              onChange={(val) =>
                form.setFieldValue('type', val as CertificationEntry['type'])
              }
            />
          </Stack>

          <TextInput
            withAsterisk
            label="Tên chứng chỉ"
            placeholder={
              certType === 'language'
                ? 'VD: IELTS, TOEIC, JLPT N2'
                : 'VD: AWS Solutions Architect Associate'
            }
            disabled={saving}
            key={form.key('name')}
            {...form.getInputProps('name')}
          />

          <SimpleGrid
            cols={{ base: 1, sm: certType === 'language' ? 2 : 1 }}
            spacing="md"
          >
            <TextInput
              withAsterisk
              label="Đơn vị cấp"
              placeholder={
                certType === 'language'
                  ? 'VD: British Council, IIG'
                  : 'VD: Amazon Web Services'
              }
              disabled={saving}
              key={form.key('issuer')}
              {...form.getInputProps('issuer')}
            />
            {certType === 'language' ? (
              <TextInput
                label="Điểm số"
                placeholder="VD: 7.5, 850"
                disabled={saving}
                key={form.key('score')}
                {...form.getInputProps('score')}
              />
            ) : null}
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <DatePickerInput
              clearable
              label="Ngày cấp"
              placeholder="Chọn ngày/tháng/năm"
              valueFormat="DD/MM/YYYY"
              leftSection={
                <IconCalendar size={16} stroke={1.5} aria-hidden="true" />
              }
              disabled={saving}
              key={form.key('issueDate')}
              {...form.getInputProps('issueDate')}
            />
            <DatePickerInput
              clearable
              label="Ngày hết hạn"
              placeholder="Không giới hạn nếu để trống"
              valueFormat="DD/MM/YYYY"
              leftSection={
                <IconCalendar size={16} stroke={1.5} aria-hidden="true" />
              }
              disabled={saving}
              key={form.key('expiryDate')}
              {...form.getInputProps('expiryDate')}
            />
          </SimpleGrid>

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
              {initialEntry ? 'Lưu thay đổi' : 'Thêm chứng chỉ'}
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  )
}
