'use client'

import { useEffect, useMemo, useRef } from 'react'
import {
  Alert,
  Autocomplete,
  Button,
  Card,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import type { UseFormReturnType } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import OnetOccupationPicker from '@/components/onet/OnetOccupationPicker'
import { mapJdLevelToSfia } from '@/lib/interview-option-helpers'
import { catalogQueries } from '@/queries/catalog.queries'
import { onetQueries } from '@/queries/onet.queries'
import type { JdFormData, OnetOccupation } from '@/types'

export interface JdBasicInfoFieldsProps {
  form: UseFormReturnType<JdFormData>
  onetSocCode?: string
  onetOccupationTitle?: string
  currentPosition: string
}

export default function JdBasicInfoFields({
  form,
  onetSocCode,
  onetOccupationTitle,
  currentPosition,
}: Readonly<JdBasicInfoFieldsProps>) {
  const formRef = useRef(form)
  useEffect(() => {
    formRef.current = form
  })

  const catalogQuery = useQuery(catalogQueries.interviewOptions())
  const jdLevels = useMemo(
    () => catalogQuery.data?.jdLevels ?? [],
    [catalogQuery.data]
  )
  const levelSelectData = useMemo(
    () => jdLevels.map((item) => ({ value: item.value, label: item.label })),
    [jdLevels]
  )

  const [debouncedPosition] = useDebouncedValue(currentPosition, 250)
  const positionQuery = useQuery(
    onetQueries.search(debouncedPosition.trim() || undefined, 15)
  )

  const positionData = useMemo(() => {
    const titles = (positionQuery.data ?? []).map((occ) => occ.title)
    return Array.from(new Set(titles))
  }, [positionQuery.data])

  useEffect(() => {
    if (!catalogQuery.data) return
    const current = formRef.current.getValues()
    if (current.targetSfiaLevel !== undefined || !current.level) return
    const mapped = mapJdLevelToSfia(current.level, catalogQuery.data.jdLevels)
    if (mapped !== undefined) {
      formRef.current.setFieldValue('targetSfiaLevel', mapped)
    }
  }, [catalogQuery.data])

  function handleSelectOnet(occ: OnetOccupation) {
    const current = form.getValues()
    const targetSfia =
      current.targetSfiaLevel ??
      (current.level ? (mapJdLevelToSfia(current.level, jdLevels) ?? 3) : 3)
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
      targetSfiaLevel: nextLevel
        ? mapJdLevelToSfia(nextLevel, jdLevels)
        : undefined,
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

          <Autocomplete
            id="jd-position"
            withAsterisk
            label="Vị trí"
            placeholder="Nhập hoặc chọn vị trí..."
            data={positionData}
            key={form.key('position')}
            {...form.getInputProps('position')}
            onChange={(val) => form.setFieldValue('position', val)}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {catalogQuery.isPending ? (
              <Stack gap={6} aria-busy="true">
                <Text size="sm" fw={500}>
                  Level yêu cầu
                </Text>
                <Skeleton height={36} radius="sm" />
              </Stack>
            ) : catalogQuery.isError ? (
              <Alert
                color="danger"
                variant="light"
                role="alert"
                title="Không thể tải danh mục cấu hình"
                icon={
                  <IconAlertCircle size={16} stroke={1.5} aria-hidden="true" />
                }
              >
                <Button
                  type="button"
                  variant="light"
                  color="danger"
                  size="xs"
                  mt="xs"
                  onClick={() => void catalogQuery.refetch()}
                >
                  Thử lại
                </Button>
              </Alert>
            ) : (
              <Select
                id="jd-level"
                withAsterisk
                label="Level yêu cầu"
                placeholder="Chọn level..."
                data={levelSelectData}
                key={form.key('level')}
                {...form.getInputProps('level')}
                onChange={handleLevelChange}
              />
            )}

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
