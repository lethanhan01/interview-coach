import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconCheck,
  IconCircleX,
  IconInfoCircle,
  IconSparkles,
} from '@tabler/icons-react'
import type { SemanticColor } from '@/theme'
import surfaces from '@/styles/surfaces.module.css'

const SEMANTIC_ROLES: ReadonlyArray<{
  role: SemanticColor
  title: string
  usage: string
  icon: typeof IconSparkles
}> = [
  {
    role: 'brand',
    title: 'Brand (Chính)',
    usage:
      'CTA chính, mục đang chọn, biểu đồ series chính, liên kết trọng tâm.',
    icon: IconSparkles,
  },
  {
    role: 'success',
    title: 'Success (Thành công)',
    usage: 'Hoàn thành, điểm cao, kỹ năng Core, trạng thái hoạt động.',
    icon: IconCheck,
  },
  {
    role: 'warning',
    title: 'Warning (Cảnh báo)',
    usage: 'Chú ý, độ phủ mỏng, sắp hết giờ, trạng thái chờ xử lý.',
    icon: IconAlertTriangle,
  },
  {
    role: 'danger',
    title: 'Danger (Nguy hiểm)',
    usage: 'Lỗi hệ thống, thao tác xóa phá hủy, điểm mù, tài khoản bị khóa.',
    icon: IconCircleX,
  },
  {
    role: 'neutral',
    title: 'Neutral (Trung tính)',
    usage: 'Metadata, kỹ năng bổ trợ, bản nháp, thành phần phụ.',
    icon: IconInfoCircle,
  },
]

const SCALE_TOKENS = ['xs', 'sm', 'md', 'lg', 'xl'] as const

function SemanticColorsShowcase() {
  return (
    <Stack gap="lg" p="md">
      <Stack gap="xs">
        <Title order={2}>5 Vai Trò Màu Ngữ Nghĩa (Zero-Hex)</Title>
        <Text size="sm" c="dimmed">
          Toàn bộ giao diện chỉ sử dụng 5 màu ngữ nghĩa trong theme.ts kết hợp
          c=&quot;dimmed&quot; cho văn bản phụ và bề mặt lồng nhau
          .subtleSurface.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {SEMANTIC_ROLES.map(({ role, title, usage, icon: Icon }) => (
          <Paper key={role} withBorder radius="md" p="md">
            <Stack gap="sm">
              <Group justify="space-between" wrap="nowrap">
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon color={role} variant="light" radius="md" size="md">
                    <Icon size={16} stroke={1.5} aria-hidden="true" />
                  </ThemeIcon>
                  <Title order={4}>{title}</Title>
                </Group>
                <Badge color={role} variant="light">
                  {role}
                </Badge>
              </Group>

              <Text size="xs" c="dimmed">
                {usage}
              </Text>

              <Group gap="xs">
                <Badge color={role} variant="filled">
                  filled
                </Badge>
                <Badge color={role} variant="light">
                  light
                </Badge>
                <Badge color={role} variant="outline">
                  outline
                </Badge>
                <Badge color={role} variant="dot">
                  dot
                </Badge>
              </Group>

              <Group gap="xs">
                <Button color={role} size="xs" variant="filled">
                  Chính
                </Button>
                <Button color={role} size="xs" variant="light">
                  Phụ
                </Button>
                <Button color={role} size="xs" variant="outline">
                  Viền
                </Button>
              </Group>
            </Stack>
          </Paper>
        ))}

        <Paper withBorder radius="md" p="md" className={surfaces.subtleSurface}>
          <Stack gap="sm">
            <Title order={4}>Bề mặt phụ & Văn bản mờ</Title>
            <Text size="sm">Văn bản chính (--mantine-color-text)</Text>
            <Text size="sm" c="dimmed">
              Văn bản phụ (c=&quot;dimmed&quot; / --mantine-color-dimmed)
            </Text>
            <Divider />
            <Text size="xs" c="dimmed" ff="monospace">
              surfaces.subtleSurface (light-dark gray-0 / dark-6)
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  )
}

function TypographyScaleShowcase() {
  return (
    <Stack gap="md" p="md">
      <Stack gap="xs">
        <Title order={2}>Thang Đo Kiểu Chữ (Typography Scale)</Title>
        <Text size="sm" c="dimmed">
          Sử dụng Title theo thứ tự phân cấp ngữ nghĩa H1–H6 và Text theo thang
          kích thước xl–xs.
        </Text>
      </Stack>

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Title order={1}>Heading 1 — Tiêu đề trang chính</Title>
          <Title order={2}>Heading 2 — Tiêu đề phân vùng</Title>
          <Title order={3}>Heading 3 — Tiêu đề khối nội dung</Title>
          <Title order={4}>Heading 4 — Tiêu đề thẻ dữ liệu</Title>
          <Title order={5}>Heading 5 — Tiêu đề nhóm nhỏ</Title>
          <Title order={6}>Heading 6 — Nhãn mục phụ</Title>
          <Divider my="xs" />
          {[...SCALE_TOKENS].reverse().map((size) => (
            <Group key={size} justify="space-between" wrap="nowrap">
              <Text size={size}>
                Văn bản cỡ {size} — InterviewCoach Mantine v9 Zero-Hex
              </Text>
              <Badge color="neutral" variant="outline">
                size=&quot;{size}&quot;
              </Badge>
            </Group>
          ))}
          <Text size="sm" ff="monospace" c="dimmed">
            Monospace — 15-1252.00 · PROG · L4 · GET
            /api/v1/catalog/interview-options
          </Text>
        </Stack>
      </Paper>
    </Stack>
  )
}

function SpacingAndRadiusShowcase() {
  return (
    <Stack gap="lg" p="md">
      <Stack gap="xs">
        <Title order={2}>Khoảng Cách & Bo Góc (Spacing & Radius)</Title>
        <Text size="sm" c="dimmed">
          Mọi padding, gap và border-radius dùng thang đo chuẩn xs–xl thay vì
          giá trị px cứng.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md">
        {SCALE_TOKENS.map((token) => (
          <Paper
            key={token}
            withBorder
            radius={token}
            p={token}
            className={surfaces.subtleSurface}
          >
            <Stack gap="xs">
              <Badge color="brand" variant="light">
                {token}
              </Badge>
              <Text size="xs" c="dimmed">
                p=&quot;{token}&quot; · radius=&quot;{token}&quot;
              </Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  )
}

const meta: Meta = {
  title: 'Foundations/Mantine Tokens',
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj

export const SemanticColors: Story = {
  render: () => <SemanticColorsShowcase />,
}

export const TypographyScale: Story = {
  render: () => <TypographyScaleShowcase />,
}

export const SpacingAndRadius: Story = {
  render: () => <SpacingAndRadiusShowcase />,
}
