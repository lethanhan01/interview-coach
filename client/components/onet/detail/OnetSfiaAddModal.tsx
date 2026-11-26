'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'
import type {
  CreateOnetSfiaMappingPayload,
  OnetSfiaMapping,
  SfiaLevelResponsibility,
  SfiaSkillDefinition,
} from '@/types'
import {
  buildSfiaSkillSelectData,
  createOnetSfiaMappingSchema,
  mapMappingServerFieldErrors,
  type OnetSfiaMappingFormValues,
} from './onet-sfia-mapping.schema'
import { OnetSfiaLevelPreview } from './OnetSfiaLevelPreview'

export interface OnetSfiaAddModalProps {
  opened: boolean
  onClose: () => void
  availableSkills: SfiaSkillDefinition[]
  currentMappings: OnetSfiaMapping[]
  levels?: SfiaLevelResponsibility[]
  onAddMapping: (payload: CreateOnetSfiaMappingPayload) => Promise<void>
  isPending?: boolean
}

export function OnetSfiaAddModal({
  opened,
  onClose,
  availableSkills,
  currentMappings,
  levels = [],
  onAddMapping,
  isPending = false,
}: Readonly<OnetSfiaAddModalProps>) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [selectedSkillCode, setSelectedSkillCode] = useState('')
  const [previewLevel, setPreviewLevel] = useState(3)

  const unmappedSkills = useMemo(() => {
    const mappedCodes = new Set(currentMappings.map((m) => m.skillCode))
    return availableSkills.filter((s) => !mappedCodes.has(s.code))
  }, [availableSkills, currentMappings])

  const selectData = useMemo(
    () => buildSfiaSkillSelectData(unmappedSkills),
    [unmappedSkills]
  )
  const currentSkill = useMemo(
    () => unmappedSkills.find((s) => s.code === selectedSkillCode),
    [unmappedSkills, selectedSkillCode]
  )
  const selectedSkillRef = useRef<SfiaSkillDefinition | undefined>(undefined)

  useEffect(() => {
    selectedSkillRef.current = currentSkill
  }, [currentSkill])

  const minLevel = currentSkill?.minLevel ?? 1
  const maxLevel = currentSkill?.maxLevel ?? 7

  const form = useForm<OnetSfiaMappingFormValues>({
    mode: 'uncontrolled',
    initialValues: { skillCode: '', targetLevel: 3, weight: 1.0, isCore: true },
    validate: (values) => {
      const skill =
        unmappedSkills.find((s) => s.code === values.skillCode) ??
        selectedSkillRef.current
      return schemaResolver(
        createOnetSfiaMappingSchema(skill?.minLevel ?? 1, skill?.maxLevel ?? 7),
        { sync: true }
      )(values)
    },
  })

  form.watch('targetLevel', ({ value }) => {
    if (value === '' || value === null || value === undefined) return
    const num = Number(value)
    if (!Number.isNaN(num)) setPreviewLevel(num)
  })

  const resetAndClose = () => {
    form.reset()
    setServerError(null)
    setSelectedSkillCode('')
    setPreviewLevel(3)
    onClose()
  }

  const handleClose = () => {
    if (!isPending) resetAndClose()
  }

  const handleSkillSelect = (code: string | null) => {
    const val = code ?? ''
    setSelectedSkillCode(val)
    form.setFieldValue('skillCode', val)
    const found = unmappedSkills.find((s) => s.code === val)
    selectedSkillRef.current = found
    if (found) {
      const rawCurrent = Number(form.getValues().targetLevel)
      const base = Number.isNaN(rawCurrent) ? found.minLevel : rawCurrent
      const clamped = Math.min(Math.max(base, found.minLevel), found.maxLevel)
      form.setFieldValue('targetLevel', clamped)
      setPreviewLevel(clamped)
    }
  }

  const handleFormSubmit = async (values: OnetSfiaMappingFormValues) => {
    setServerError(null)
    try {
      await onAddMapping({
        skillCode: values.skillCode.trim(),
        targetLevel: Number(values.targetLevel),
        weight: Number(values.weight),
        isCore: values.isCore,
      })
      resetAndClose()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể thêm ánh xạ SFIA'
      setServerError(message)
      const fieldErrors = mapMappingServerFieldErrors(message)
      if (Object.keys(fieldErrors).length > 0) form.setErrors(fieldErrors)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      closeOnClickOutside={!isPending}
      closeOnEscape={!isPending}
      withCloseButton={!isPending}
      closeButtonProps={{ 'aria-label': 'Đóng cửa sổ thêm ánh xạ SFIA' }}
      title="Thêm Ánh Xạ Kỹ Năng SFIA Mới"
      centered
      size="lg"
    >
      <Box
        component="form"
        onSubmit={form.onSubmit(handleFormSubmit)}
        noValidate
      >
        <Stack gap="sm">
          {serverError ? (
            <Alert
              color="danger"
              variant="light"
              icon={<IconAlertCircle size={16} stroke={1.5} />}
              title="Lỗi xử lý"
            >
              {serverError}
            </Alert>
          ) : null}

          <Select
            label="Kỹ năng SFIA"
            placeholder="Chọn một kỹ năng từ thư viện SFIA 9..."
            data={selectData}
            searchable
            clearable={false}
            required
            value={selectedSkillCode || null}
            onChange={handleSkillSelect}
            error={form.errors.skillCode}
          />

          <Group grow align="flex-start">
            <NumberInput
              label="Cấp độ mục tiêu"
              description={`Giới hạn từ L${minLevel} đến L${maxLevel}`}
              min={minLevel}
              max={maxLevel}
              step={1}
              clampBehavior="none"
              required
              key={form.key('targetLevel')}
              {...form.getInputProps('targetLevel')}
            />
            <NumberInput
              label="Trọng số đánh giá"
              description="Từ 0.1 đến 5.0 (Mặc định: 1.0)"
              min={0.1}
              max={5.0}
              step={0.1}
              decimalScale={1}
              fixedDecimalScale
              clampBehavior="none"
              required
              key={form.key('weight')}
              {...form.getInputProps('weight')}
            />
          </Group>

          {currentSkill ? (
            <OnetSfiaLevelPreview
              skill={currentSkill}
              level={previewLevel}
              levels={levels}
            />
          ) : null}

          <Switch
            label="Kỹ năng cốt lõi"
            description="Ưu tiên cao khi sinh câu hỏi phỏng vấn và tính điểm năng lực"
            aria-label="Kỹ năng cốt lõi"
            key={form.key('isCore')}
            {...form.getInputProps('isCore', { type: 'checkbox' })}
          />

          <Group justify="flex-end" pt="sm">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" color="brand" loading={isPending}>
              Thêm ánh xạ
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  )
}
