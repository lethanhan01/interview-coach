'use client'

import {
  Accordion,
  Alert,
  Badge,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconShieldCheck,
  IconSparkles,
} from '@tabler/icons-react'
import type { ContextPack, SessionType } from '@/types'

export interface ScoringMethodCardProps {
  contextPackId?: ContextPack
  sessionType?: SessionType
  className?: string
}

const SESSION_LABEL_MAP: Record<SessionType, string> = {
  technical: 'Chuyên môn Kỹ thuật',
  hr: 'Phỏng vấn Hành vi & Nhân sự',
}

const SFIA_LEVELS = [
  {
    level: 'Level 1',
    title: 'Follow',
    desc: 'Làm theo hướng dẫn cơ bản, giải quyết nhiệm vụ có cấu trúc rõ ràng.',
  },
  {
    level: 'Level 2',
    title: 'Assist',
    desc: 'Hỗ trợ đồng nghiệp, ứng dụng kỹ năng cơ bản có sự kèm cặp.',
  },
  {
    level: 'Level 3',
    title: 'Apply',
    desc: 'Tự chủ thực thi, áp dụng kiến thức thực tế giải quyết vấn đề tiêu chuẩn.',
  },
  {
    level: 'Level 4',
    title: 'Enable',
    desc: 'Điều phối chuyên môn, hướng dẫn thành viên và tối ưu quy trình.',
  },
  {
    level: 'Level 5',
    title: 'Ensure / Advise',
    desc: 'Chịu trách nhiệm kiến trúc/chất lượng, tư vấn giải pháp quy mô lớn.',
  },
  {
    level: 'Level 6',
    title: 'Initiate / Influence',
    desc: 'Khởi xướng đổi mới công nghệ, định hướng chiến lược kỹ thuật.',
  },
  {
    level: 'Level 7',
    title: 'Set Strategy / Inspire',
    desc: 'Định hình tầm nhìn công nghệ dài hạn, dẫn dắt tổ chức.',
  },
]

export function ScoringMethodCard({
  contextPackId,
  sessionType,
  className,
}: Readonly<ScoringMethodCardProps>) {
  const sessionLabel =
    (sessionType ? SESSION_LABEL_MAP[sessionType] : null) ??
    'Phỏng vấn Chuẩn hóa'

  return (
    <Card withBorder radius="md" p="lg" className={className}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="sm" align="center">
            <ThemeIcon size="lg" radius="md" variant="light" color="brand">
              <IconSparkles size={20} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
            <Stack gap={2}>
              <Title order={2} size="h4">
                Phương Pháp Đánh Giá Chuẩn Hóa SFIA 9 &amp; O*NET
              </Title>
              <Text size="xs" c="dimmed">
                Cơ chế chấm điểm tất định, thẩm định nhị phân và đối chiếu cấp
                độ năng lực
              </Text>
            </Stack>
          </Group>

          <Group gap="xs">
            <Badge variant="outline" size="sm">
              {sessionLabel}
            </Badge>
            {contextPackId ? (
              <Badge variant="light" color="neutral" size="sm">
                Bối cảnh: {contextPackId}
              </Badge>
            ) : null}
          </Group>
        </Group>

        <Alert
          color="brand"
          variant="light"
          icon={<IconInfoCircle size={18} stroke={1.5} aria-hidden="true" />}
        >
          <Text size="xs" lh="relaxed">
            Hệ thống áp dụng{' '}
            <strong>Cỗ máy Đánh giá Tinh gọn (Unified Interview Engine)</strong>
            , kết hợp bộ tiêu chí nhị phân 2 chiều và khung kỹ năng toàn cầu{' '}
            <strong>SFIA Version 9</strong> cùng phân loại nghề nghiệp chuẩn hóa{' '}
            <strong>O*NET</strong>. Đảm bảo tính khách quan, minh bạch và nhất
            quán cho mọi ứng viên.
          </Text>
        </Alert>

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
                  (evidence) và đối chiếu chặt chẽ qua 2 chiều nhị phân độc lập
                  (Đạt / Không Đạt):
                </Text>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  <Card withBorder radius="sm" p="sm">
                    <Group gap="xs" mb={4}>
                      <IconCheck size={14} stroke={2} aria-hidden="true" />
                      <Text size="xs" fw={700}>
                        Chiều Cốt Lõi (Core Dimension)
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      Kiểm chứng kiến thức kỹ thuật trọng tâm, hiểu biết về
                      nguyên lý nền tảng và mức độ chính xác của giải pháp đề
                      xuất.
                    </Text>
                  </Card>

                  <Card withBorder radius="sm" p="sm">
                    <Group gap="xs" mb={4}>
                      <IconCheck size={14} stroke={2} aria-hidden="true" />
                      <Text size="xs" fw={700}>
                        Chiều Thâm Niên (Seniority Dimension)
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      Đo lường tư duy thiết kế hệ thống, khả năng cân bằng
                      trade-off, xử lý sự cố biên và năng lực giải thích bài
                      toán phức tạp.
                    </Text>
                  </Card>
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
                  Mỗi kỹ năng O*NET được gắn kết với khung kỹ năng SFIA 9 để
                  định vị năng lực thực tế:
                </Text>
                <Table withTableBorder withColumnBorders fz="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={90}>Cấp độ</Table.Th>
                      <Table.Th w={130}>Tên SFIA</Table.Th>
                      <Table.Th>Mô tả hành vi chuẩn hóa</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {SFIA_LEVELS.map((row) => (
                      <Table.Tr key={row.level}>
                        <Table.Td fw={700}>{row.level}</Table.Td>
                        <Table.Td fw={500}>{row.title}</Table.Td>
                        <Table.Td c="dimmed">{row.desc}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="item-3">
            <Accordion.Control
              icon={
                <ThemeIcon
                  size={22}
                  radius="xl"
                  variant="light"
                  color="warning"
                >
                  <IconAlertTriangle
                    size={14}
                    stroke={1.5}
                    aria-hidden="true"
                  />
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
                  <IconAlertTriangle
                    size={18}
                    stroke={1.5}
                    aria-hidden="true"
                  />
                }
              >
                <Text size="xs" lh="relaxed">
                  Khi ứng viên chọn bỏ qua hoặc hết giờ, câu hỏi được chấm tất
                  định <strong>0 điểm</strong> và định vị ở{' '}
                  <strong>SFIA Level 1</strong>. Điểm tổng hợp được tính theo
                  trọng số toán học từ các tiêu chí nhị phân đã đạt, tuyệt đối
                  không phụ thuộc vào cảm tính của mô hình LLM.
                </Text>
              </Alert>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Card>
  )
}

export default ScoringMethodCard
