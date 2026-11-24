import {
  Badge,
  Box,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconChartBar,
  IconFileDescription,
  IconMicrophone,
} from '@tabler/icons-react'
import classes from './WorkflowSection.module.css'

const WORKFLOW_STEPS = [
  {
    step: 'Bước 01',
    title: 'Dán JD & chọn mục tiêu',
    description:
      'Nhập Job Description hoặc chọn từ thư viện sẵn có, thiết lập cấp độ SFIA và thời lượng phù hợp.',
    icon: IconFileDescription,
  },
  {
    step: 'Bước 02',
    title: 'Phỏng vấn cùng AI Follow-up',
    description:
      'Trả lời trực tiếp bằng giọng nói hoặc văn bản trong phòng mô phỏng có đồng hồ đếm ngược thực tế.',
    icon: IconMicrophone,
  },
  {
    step: 'Bước 03',
    title: 'Nhận báo cáo STAR & SFIA 9',
    description:
      'Xem điểm tổng quan, nhận xét từng đoạn trả lời và lộ trình cải thiện rõ ràng cho buổi phỏng vấn kế tiếp.',
    icon: IconChartBar,
  },
] as const

const PLATFORM_HIGHLIGHTS = [
  {
    label: 'SFIA 9 & O*NET',
    detail: 'Ánh xạ kỹ năng nghề nghiệp theo khung chuẩn quốc tế',
  },
  {
    label: 'STAR Rubric',
    detail: 'Đánh giá minh bạch theo Situation, Task, Action, Result',
  },
  {
    label: 'VN / Western',
    detail: 'Linh hoạt phong cách phỏng vấn theo văn hóa công ty mục tiêu',
  },
] as const

export function WorkflowSection() {
  return (
    <Box component="section" className={classes.section}>
      <Container size="lg">
        <Stack gap="xl">
          <Stack align="center" gap="xs">
            <Badge color="brand" variant="light">
              Quy trình 3 bước
            </Badge>
            <Title order={2} ta="center">
              Từ Job Description đến báo cáo năng lực chi tiết
            </Title>
            <Text c="dimmed" ta="center" maw={600}>
              Tập trung vào đúng vị trí bạn ứng tuyển chỉ trong vài phút chuẩn
              bị.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {WORKFLOW_STEPS.map(({ step, title, description, icon: Icon }) => (
              <Paper
                key={step}
                withBorder
                radius="md"
                p="lg"
                className={classes.stepCard}
              >
                <Stack gap="sm">
                  <Group justify="space-between">
                    <ThemeIcon
                      color="brand"
                      variant="light"
                      size="lg"
                      radius="md"
                    >
                      <Icon size={20} stroke={1.5} aria-hidden="true" />
                    </ThemeIcon>
                    <Badge color="neutral" variant="outline" size="sm">
                      {step}
                    </Badge>
                  </Group>
                  <Title order={3} size="h4">
                    {title}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {description}
                  </Text>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {PLATFORM_HIGHLIGHTS.map((item) => (
              <Paper
                key={item.label}
                withBorder
                radius="md"
                p="md"
                className={classes.highlightCard}
              >
                <Stack gap={4}>
                  <Text fw={700} size="sm" c="brand">
                    {item.label}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {item.detail}
                  </Text>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  )
}
