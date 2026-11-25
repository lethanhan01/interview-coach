import {
  Box,
  Card,
  Container,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconBrain, IconTargetArrow, IconWorld } from '@tabler/icons-react'
import landing from '../landing.module.css'

const FEATURES = [
  {
    title: 'AI Follow-up thông minh',
    description:
      'Hệ thống đặt câu hỏi tiếp theo dựa trên câu trả lời của bạn, đào sâu kỹ năng thực chiến giống phỏng vấn thật.',
    icon: IconBrain,
  },
  {
    title: 'Surgical Feedback',
    description:
      'Phản hồi highlight từng đoạn cụ thể trong câu trả lời kèm gợi ý cải thiện rõ ràng theo cấu trúc STAR.',
    icon: IconTargetArrow,
  },
  {
    title: 'Context Pack VN / Western',
    description:
      'Rubric chấm điểm phù hợp văn hóa — chọn kiểu phỏng vấn phù hợp với công ty công nghệ bạn đang ứng tuyển.',
    icon: IconWorld,
  },
] as const

export function FeaturesSection() {
  return (
    <Box component="section" className={landing.featuresSection}>
      <Container size="lg">
        <Stack gap="xl">
          <Stack align="center" gap="xs">
            <Title order={2} ta="center">
              Tại sao chọn Intervia?
            </Title>
            <Text c="dimmed" ta="center" maw={560}>
              Được thiết kế riêng cho thị trường tuyển dụng IT Việt Nam và sinh
              viên chuẩn bị phỏng vấn kỹ thuật.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            {FEATURES.map(({ title, description, icon: Icon }) => (
              <Card
                key={title}
                withBorder
                radius="md"
                p="lg"
                className={landing.featureCard}
              >
                <Stack gap="sm">
                  <ThemeIcon
                    color="brand"
                    variant="light"
                    size={44}
                    radius="md"
                  >
                    <Icon size={22} stroke={1.5} aria-hidden="true" />
                  </ThemeIcon>
                  <Title order={3} size="h4">
                    {title}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {description}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  )
}
