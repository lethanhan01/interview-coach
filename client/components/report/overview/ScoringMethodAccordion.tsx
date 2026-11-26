'use client'

import {
  Accordion,
  Alert,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconCheck,
  IconShieldCheck,
  IconSparkles,
} from '@tabler/icons-react'
import type { CatalogSfiaLevelOption } from '@/types'
import { SfiaLevelsTable } from './SfiaLevelsTable'

export interface ScoringMethodAccordionProps {
  sfiaLevels?: readonly CatalogSfiaLevelOption[]
  isPending: boolean
  isError: boolean
  onRetry: () => void
}

const BINARY_DIMENSIONS = [
  {
    title: 'Chiều Cốt Lõi (Core Dimension)',
    description:
      'Kiểm chứng kiến thức kỹ thuật trọng tâm, hiểu biết về nguyên lý nền tảng và mức độ chính xác của giải pháp đề xuất.',
  },
  {
    title: 'Chiều Thâm Niên (Seniority Dimension)',
    description:
      'Đo lường tư duy thiết kế hệ thống, khả năng cân bằng trade-off, xử lý sự cố biên và năng lực giải thích bài toán phức tạp.',
  },
] as const

export function ScoringMethodAccordion({
  sfiaLevels,
  isPending,
  isError,
  onRetry,
}: Readonly<ScoringMethodAccordionProps>) {
  return (
    <Accordion variant="separated" defaultValue="item-1">
      <Accordion.Item value="item-1">
        <Accordion.Control
          icon={
            <ThemeIcon size={22} radius="xl" variant="light" color="brand">
              <IconShieldCheck size={14} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
          }
        >
          <Text size="sm" fw={600}>
            1. Tiêu Chí Đánh Giá Nhị Phân 2 Chiều (Core &amp; Seniority)
          </Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="sm">
            <Text size="xs" c="dimmed">
              Mỗi câu trả lời của ứng viên được AI trích xuất bằng chứng
              (evidence) và đối chiếu chặt chẽ qua 2 chiều nhị phân độc lập (Đạt
              / Không Đạt):
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {BINARY_DIMENSIONS.map((dim) => (
                <Card key={dim.title} withBorder radius="sm" p="sm">
                  <Group gap="xs" mb={4}>
                    <IconCheck size={14} stroke={2} aria-hidden="true" />
                    <Text size="xs" fw={700}>
                      {dim.title}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {dim.description}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="item-2">
        <Accordion.Control
          icon={
            <ThemeIcon size={22} radius="xl" variant="light" color="brand">
              <IconSparkles size={14} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
          }
        >
          <Text size="sm" fw={600}>
            2. Thang Cấp Bậc Năng Lực Quốc Tế SFIA Version 9 (Level 1–7)
          </Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="sm">
            <Text size="xs" c="dimmed">
              Mỗi kỹ năng O*NET được gắn kết với khung kỹ năng SFIA 9 để định vị
              năng lực thực tế:
            </Text>
            <SfiaLevelsTable
              sfiaLevels={sfiaLevels}
              isPending={isPending}
              isError={isError}
              onRetry={onRetry}
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="item-3">
        <Accordion.Control
          icon={
            <ThemeIcon size={22} radius="xl" variant="light" color="warning">
              <IconAlertTriangle size={14} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
          }
        >
          <Text size="sm" fw={600}>
            3. Tính Điểm Tất Định 0-100% &amp; Quy Tắc Bỏ Qua (Skipped Turn)
          </Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Alert
            color="warning"
            variant="light"
            icon={
              <IconAlertTriangle size={18} stroke={1.5} aria-hidden="true" />
            }
          >
            <Text size="xs" lh="relaxed">
              Khi ứng viên chọn bỏ qua hoặc hết giờ, câu hỏi được chấm tất định{' '}
              <Text component="span" fw={700}>
                0 điểm
              </Text>{' '}
              và định vị ở{' '}
              <Text component="span" fw={700}>
                SFIA Level 1
              </Text>
              . Điểm tổng hợp được tính theo trọng số toán học từ các tiêu chí
              nhị phân đã đạt, tuyệt đối không phụ thuộc vào cảm tính của mô
              hình LLM.
            </Text>
          </Alert>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}
