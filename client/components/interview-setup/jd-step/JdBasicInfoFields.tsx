'use client'

import { useMemo } from 'react'
import {
  Card,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
  Title,
} from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import OnetOccupationPicker from '@/components/onet/OnetOccupationPicker'
import { JD_LEVEL_OPTIONS, POSITION_OPTIONS } from '@/lib/interview-options'
import { mapJdLevelToSfia } from '@/lib/setup-helpers'
import type { JdFormData, OnetOccupation } from '@/types'

export interface JdBasicInfoFieldsProps {
  form: UseFormReturnType<JdFormData>
  onetSocCode?: string
  onetOccupationTitle?: string
  currentPosition: string
}

const LEVEL_SELECT_DATA = JD_LEVEL_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}))

export default function JdBasicInfoFields({
  form,
  onetSocCode,
  onetOccupationTitle,
  currentPosition,
}: Readonly<JdBasicInfoFieldsProps>) {
  const positionData = useMemo(() => {
    const trimmed = currentPosition.trim()
    if (!trimmed || POSITION_OPTIONS.includes(trimmed)) {
      return POSITION_OPTIONS
    }
    return [trimmed, ...POSITION_OPTIONS]
  }, [currentPosition])

  function handleSelectOnet(occ: OnetOccupation) {
    const current = form.getValues()
    const targetSfia =
      current.targetSfiaLevel ??
      (current.level ? mapJdLevelToSfia(current.level) : 3)
    const nextPosition =
      current.position.trim().length > 0 ? current.position : occ.title
    form.setValues({
      ...current,
      onetSocCode: occ.socCode,
      onetOccupationTitle: occ.title,
      position: nextPosition,
      targetSfiaLevel: targetSfia,
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
      level: nextLevel,
      targetSfiaLevel: nextLevel ? mapJdLevelToSfia(nextLevel) : undefined,
    })
  }

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="lg">
        <Stack gap="md">
          <Title order={2} size="h4">
            Thông tin công ty
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              withAsterisk
              label="Tên công ty"
              placeholder="VD: FPT Software, Shopee..."
              key={form.key('company')}
              {...form.getInputProps('company')}
            />
            <TextInput
              label="Website công ty"
              placeholder="https://company.com"
              key={form.key('website')}
              {...form.getInputProps('website')}
            />
          </SimpleGrid>
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Stack gap="md">
          <Title order={2} size="h4">
            Vị trí tuyển dụng
          </Title>

          <OnetOccupationPicker
            inputId="jd-onet-occupation"
            label="Chức danh chuẩn O*NET (AI Matching)"
            helperText="Khuyến nghị để tối ưu phỏng vấn"
            socCode={onetSocCode}
            occupationTitle={onetOccupationTitle}
            onSelect={handleSelectOnet}
            onClear={handleClearOnet}
          />

          <Select
            id="jd-position"
            withAsterisk
            searchable
            label="Vị trí"
            placeholder="Chọn vị trí..."
            data={positionData}
            key={form.key('position')}
            {...form.getInputProps('position')}
            onChange={(val) => form.setFieldValue('position', val ?? '')}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Select
              id="jd-level"
              withAsterisk
              label="Level yêu cầu"
              placeholder="Chọn level..."
              data={LEVEL_SELECT_DATA}
              key={form.key('level')}
              {...form.getInputProps('level')}
              onChange={handleLevelChange}
            />

            <TextInput
              label="Số lượng tuyển"
              placeholder="VD: 2 người"
              key={form.key('headcount')}
              {...form.getInputProps('headcount')}
            />

            <TextInput
              label="Địa điểm làm việc"
              placeholder="VD: Hà Nội / Remote"
              key={form.key('location')}
              {...form.getInputProps('location')}
            />
          </SimpleGrid>
        </Stack>
      </Card>
    </Stack>
  )
}
