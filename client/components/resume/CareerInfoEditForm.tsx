'use client'

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle } from '@tabler/icons-react'
import OnetOccupationPicker from '@/components/onet/OnetOccupationPicker'
import { getErrorMessage } from '@/lib/form-errors'
import { JD_LEVEL_OPTIONS, POSITION_OPTIONS } from '@/lib/interview-options'
import { mapJdLevelToSfia } from '@/lib/setup-helpers'
import type { CareerInfoData, OnetOccupation } from '@/types'
import { careerInfoSchema, type CareerInfoFormValues } from './resume-schemas'

export interface CareerInfoEditFormProps {
  initialValues: CareerInfoFormValues
  onSave: (data: CareerInfoData) => Promise<void>
  onSuccess: () => void
  onCancel: () => void
  onDirtyChange?: (dirty: boolean) => void
}

export default function CareerInfoEditForm({
  initialValues,
  onSave,
  onSuccess,
  onCancel,
  onDirtyChange,
}: Readonly<CareerInfoEditFormProps>) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onetView, setOnetView] = useState({
    socCode: initialValues.onetSocCode,
    title: initialValues.onetOccupationTitle,
    targetLevel: initialValues.targetLevel,
  })

  const form = useForm<CareerInfoFormValues>({
    mode: 'uncontrolled',
    initialValues,
    validate: schemaResolver(careerInfoSchema, { sync: true }),
    onValuesChange: (values) => {
      onDirtyChange?.(true)
      setOnetView({
        socCode: values.onetSocCode,
        title: values.onetOccupationTitle,
        targetLevel: values.targetLevel,
      })
    },
  })

  function handleSelectOnet(occ: OnetOccupation) {
    const current = form.getValues()
    form.setValues({
      ...current,
      onetSocCode: occ.socCode,
      onetOccupationTitle: occ.title,
      targetPosition: current.targetPosition || occ.title,
    })
  }

  function handleClearOnet() {
    const current = form.getValues()
    form.setValues({
      ...current,
      onetSocCode: undefined,
      onetOccupationTitle: undefined,
    })
  }

  function handleLevelChange(val: string | null) {
    const nextLevel = val ?? ''
    const current = form.getValues()
    form.setValues({
      ...current,
      targetLevel: nextLevel,
      targetSfiaLevel: nextLevel ? mapJdLevelToSfia(nextLevel) : undefined,
    })
  }

  async function handleSubmit(values: CareerInfoFormValues) {
    setSaving(true)
    setError(null)
    try {
      await onSave({
        targetPosition: values.targetPosition.trim(),
        targetLevel: values.targetLevel.trim(),
        onetSocCode: values.onetSocCode?.trim() || undefined,
        onetOccupationTitle: values.onetOccupationTitle?.trim() || undefined,
        targetSfiaLevel:
          values.targetSfiaLevel ??
          (values.targetLevel
            ? mapJdLevelToSfia(values.targetLevel)
            : undefined),
      })
      onDirtyChange?.(false)
      notifications.show({
        title: 'Đã cập nhật',
        message: 'Định hướng nghề nghiệp đã được lưu.',
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

  const levelSelectData = [
    ...(onetView.targetLevel &&
    !JD_LEVEL_OPTIONS.some((o) => o.value === onetView.targetLevel)
      ? [
          {
            value: onetView.targetLevel,
            label: `Giá trị hiện tại: ${onetView.targetLevel}`,
          },
        ]
      : []),
    ...JD_LEVEL_OPTIONS.map((o) => ({
      value: o.value,
      label: `${o.label} (SFIA Level ${mapJdLevelToSfia(o.value)})`,
    })),
  ]

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

        <OnetOccupationPicker
          inputId="career-onet-occupation"
          label="Chức danh chuẩn O*NET (Taxonomy)"
          helperText="Chuẩn hóa câu hỏi & kỹ năng"
          codePrefix="Mã O*NET SOC"
          clearLabel="Đổi"
          socCode={onetView.socCode}
          occupationTitle={onetView.title}
          disabled={saving}
          onSelect={handleSelectOnet}
          onClear={handleClearOnet}
        />

        <Stack gap={6}>
          <TextInput
            id="target-position"
            label="Vị trí mục tiêu (Tên hiển thị)"
            placeholder="VD: Senior Frontend Engineer, Full-stack Developer..."
            disabled={saving}
            key={form.key('targetPosition')}
            {...form.getInputProps('targetPosition')}
          />
          <Group gap={6} wrap="wrap" align="center">
            <Text size="xs" c="dimmed">
              Vị trí IT phổ biến:
            </Text>
            {POSITION_OPTIONS.slice(0, 5).map((pos) => (
              <Button
                key={pos}
                type="button"
                variant="light"
                color="brand"
                size="compact-xs"
                disabled={saving}
                onClick={() => form.setFieldValue('targetPosition', pos)}
              >
                {pos}
              </Button>
            ))}
          </Group>
        </Stack>

        <Select
          id="target-level"
          clearable
          label="Mức kinh nghiệm"
          placeholder="Chọn mức kinh nghiệm"
          description={
            onetView.targetLevel
              ? `Ánh xạ SFIA Level: ${mapJdLevelToSfia(onetView.targetLevel)}`
              : undefined
          }
          data={levelSelectData}
          disabled={saving}
          key={form.key('targetLevel')}
          {...form.getInputProps('targetLevel')}
          onChange={handleLevelChange}
        />

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
