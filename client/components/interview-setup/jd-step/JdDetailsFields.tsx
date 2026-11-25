'use client'

import type { ReactNode } from 'react'
import { Card, Stack, Textarea, TextInput, Title } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import type { JdFormData } from '@/types'

export interface JdDetailsFieldsProps {
  form: UseFormReturnType<JdFormData>
  requirementsLength: number
  jobContentLength: number
  techStackSlot: ReactNode
}

export default function JdDetailsFields({
  form,
  requirementsLength,
  jobContentLength,
  techStackSlot,
}: Readonly<JdDetailsFieldsProps>) {
  const reqHint =
    requirementsLength > 0 && requirementsLength < 30
      ? 'Tối thiểu 30 ký tự'
      : undefined
  const jobHint =
    jobContentLength > 0 && jobContentLength < 30
      ? 'Tối thiểu 30 ký tự'
      : undefined

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="lg">
        <Stack gap="md">
          <Title order={2} size="h4">
            Nội dung &amp; Yêu cầu
          </Title>

          <Textarea
            withAsterisk
            autosize
            minRows={4}
            label="Yêu cầu"
            placeholder="Liệt kê yêu cầu về kinh nghiệm, kỹ năng, bằng cấp..."
            description={reqHint}
            key={form.key('requirements')}
            {...form.getInputProps('requirements')}
          />

          <Textarea
            withAsterisk
            autosize
            minRows={4}
            label="Nội dung công việc"
            placeholder="Mô tả các công việc, nhiệm vụ chính..."
            description={jobHint}
            key={form.key('jobContent')}
            {...form.getInputProps('jobContent')}
          />

          {techStackSlot}
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Stack gap="md">
          <Title order={2} size="h4">
            Phúc lợi &amp; Lương
          </Title>

          <TextInput
            label="Lương"
            placeholder="VD: 15-25 triệu VNĐ"
            key={form.key('salary')}
            {...form.getInputProps('salary')}
          />

          <TextInput
            id="jd-bonus"
            label="Thưởng"
            placeholder="VD: Tháng 13, Theo KPI, Hàng quý..."
            key={form.key('bonus')}
            {...form.getInputProps('bonus')}
          />

          <Textarea
            autosize
            minRows={3}
            label="Quyền lợi nhân viên"
            placeholder="VD: Bảo hiểm sức khỏe, 12 ngày phép, MacBook..."
            key={form.key('benefits')}
            {...form.getInputProps('benefits')}
          />
        </Stack>
      </Card>
    </Stack>
  )
}
