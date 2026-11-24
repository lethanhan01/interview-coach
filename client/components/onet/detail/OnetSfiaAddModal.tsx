'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import type {
  CreateOnetSfiaMappingPayload,
  OnetSfiaMapping,
  SfiaSkillDefinition,
} from '@/types'
import {
  createOnetSfiaMappingSchema,
  type OnetSfiaMappingFormValues,
} from './onet-sfia-mapping.schema'

export interface OnetSfiaAddModalProps {
  opened: boolean
  onClose: () => void
  availableSkills: SfiaSkillDefinition[]
  currentMappings: OnetSfiaMapping[]
  onAddMapping: (payload: CreateOnetSfiaMappingPayload) => Promise<void>
  isPending?: boolean
}

export function OnetSfiaAddModal({
  opened,
  onClose,
  availableSkills,
  currentMappings,
  onAddMapping,
  isPending = false,
}: Readonly<OnetSfiaAddModalProps>) {
  const [serverError, setServerError] = useState<string | null>(null)

  const mappedCodes = useMemo(
    () => new Set(currentMappings.map((m) => m.skillCode)),
    [currentMappings]
  )

  const unmappedSkills = useMemo(
    () => availableSkills.filter((s) => !mappedCodes.has(s.code)),
    [availableSkills, mappedCodes]
  )

  const selectData = useMemo(() => {
    const grouped = new Map<string, Array<{ value: string; label: string }>>()
    for (const skill of unmappedSkills) {
      const groupName = skill.category || 'Chung'
      const list = grouped.get(groupName) ?? []
      list.push({
        value: skill.code,
        label: `${skill.code} — ${skill.name} (L${skill.minLevel}..L${skill.maxLevel})`,
      })
      grouped.set(groupName, list)
    }
    return Array.from(grouped.entries()).map(([group, items]) => ({
      group,
      items,
    }))
  }, [unmappedSkills])

  const [selectedSkillCode, setSelectedSkillCode] = useState<string>('')
  const currentSkill = useMemo(
    () => unmappedSkills.find((s) => s.code === selectedSkillCode),
    [unmappedSkills, selectedSkillCode]
  )

  const minLevel = currentSkill?.minLevel ?? 1
  const maxLevel = currentSkill?.maxLevel ?? 7

  const form = useForm<OnetSfiaMappingFormValues>({
    mode: 'uncontrolled',
    initialValues: {
      skillCode: '',
      targetLevel: minLevel,
      weight: 1.0,
      isCore: true,
    },
    validate: schemaResolver(createOnetSfiaMappingSchema(minLevel, maxLevel), {
      sync: true,
    }),
  })

  const handleSkillSelect = (code: string | null) => {
    const val = code ?? ''
    setSelectedSkillCode(val)
    form.setFieldValue('skillCode', val)
    const found = unmappedSkills.find((s) => s.code === val)
    if (found) {
      const currentLevel = form.getValues().targetLevel
      const clamped = Math.min(Math.max(currentLevel, found.minLevel), found.maxLevel)
      form.setFieldValue('targetLevel', clamped)
    }
  }

  const handleFormSubmit = async (values: OnetSfiaMappingFormValues) => {
    setServerError(null)
    try {
      await onAddMapping({
        skillCode: values.skillCode,
        targetLevel: values.targetLevel,
        weight: values.weight,
        isCore: values.isCore,
      })
      form.reset()
      setSelectedSkillCode('')
      onClose()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể thêm ánh xạ SFIA'
      setServerError(message)
    }
  }

  const watchedTargetLevel = form.getValues().targetLevel
  const levelDescription =
    currentSkill?.levelDescriptions?.[watchedTargetLevel] ??
    `Cấp độ ${watchedTargetLevel} theo tiêu chuẩn SFIA 9.`

  return (
    <Modal
      opened={opened}
      onClose={isPending ? () => undefined : onClose}
      closeOnClickOutside={!isPending}
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
              icon={<IconAlertCircle size={16} />}
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
            value={form.getValues().skillCode}
            onChange={handleSkillSelect}
            error={form.errors.skillCode}
          />

          {currentSkill ? (
            <Paper p="xs" radius="sm" className={surfaces.subtleSurface}>
              <Stack gap={4}>
                <Group justify="space-between" align="center">
                  <Text size="xs" fw={600}>
                    {currentSkill.name} ({currentSkill.code})
                  </Text>
                  <Badge color="brand" variant="light" size="xs">
                    Dải cấp độ: L{currentSkill.minLevel} – L{currentSkill.maxLevel}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  {currentSkill.description}
                </Text>
              </Stack>
            </Paper>
          ) : null}

          <Group grow align="flex-start">
            <NumberInput
              label="Cấp độ Mục tiêu (Target Level)"
              description={`Giới hạn từ L${minLevel} đến L${maxLevel}`}
              min={minLevel}
              max={maxLevel}
              step={1}
              required
              key={form.key('targetLevel')}
              {...form.getInputProps('targetLevel')}
            />

            <NumberInput
              label="Trọng số Đánh giá (Weight)"
              description="Từ 0.1 đến 5.0 (Mặc định: 1.0)"
              min={0.1}
              max={5.0}
              step={0.1}
              decimalScale={1}
              fixedDecimalScale
              required
              key={form.key('weight')}
              {...form.getInputProps('weight')}
            />
          </Group>

          {currentSkill ? (
            <Paper p="xs" radius="sm" className={surfaces.subtleSurface}>
              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={600}>
                  Mô tả hành vi cấp độ {watchedTargetLevel}:
                </Text>
                <Text size="xs">{levelDescription}</Text>
              </Stack>
            </Paper>
          ) : null}

          <Switch
            label="Kỹ năng Cốt lõi (Core Skill)"
            description="Ưu tiên cao khi sinh câu hỏi phỏng vấn và tính điểm năng lực"
            aria-label="Kỹ năng Cốt lõi"
            key={form.key('isCore')}
            {...form.getInputProps('isCore', { type: 'checkbox' })}
          />

          <Group justify="flex-end" pt="sm">
            <Button
              variant="default"
              onClick={onClose}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              color="brand"
              loading={isPending}
            >
              Thêm ánh xạ
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  )
}
