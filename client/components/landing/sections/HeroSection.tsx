'use client'

import Link from 'next/link'
import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  List,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconArrowRight, IconCheck, IconSparkles } from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import landing from '../landing.module.css'

const HERO_BULLETS = [
  'Bám sát Job Description thực tế với câu hỏi follow-up tự động theo câu trả lời',
  'Phân tích cấu trúc STAR chi tiết từng đoạn kèm gợi ý diễn đạt cụ thể',
  'Đối chiếu cấp độ năng lực theo chuẩn CNTT quốc tế SFIA 9 & O*NET',
] as const

export function HeroSection() {
  return (
    <Box component="section" className={landing.heroSection}>
      <Container size="lg">
        <SimpleGrid
          cols={{ base: 1, md: 2 }}
          spacing="xl"
          verticalSpacing="xl"
          className={landing.heroGrid}
        >
          <Stack gap="lg">
            <Group>
              <Badge color="brand" variant="light" size="lg">
                Dành cho sinh viên CNTT Việt Nam
              </Badge>
            </Group>

            <Title order={1} className={landing.heroTitle}>
              Luyện phỏng vấn{' '}
              <Text component="span" c="brand" inherit>
                thông minh hơn
              </Text>
            </Title>

            <Text c="dimmed" size="lg">
              Paste Job Description, trả lời bằng giọng nói hoặc văn bản, nhận
              phản hồi chi tiết từng câu theo STAR và chuẩn năng lực SFIA 9 —
              hoàn toàn miễn phí.
            </Text>

            <List
              spacing="xs"
              size="sm"
              center
              icon={
                <ThemeIcon
                  color="success"
                  variant="light"
                  size={20}
                  radius="xl"
                >
                  <IconCheck size={12} stroke={2} aria-hidden="true" />
                </ThemeIcon>
              }
            >
              {HERO_BULLETS.map((bullet) => (
                <List.Item key={bullet}>{bullet}</List.Item>
              ))}
            </List>

            <Group gap="sm" mt="xs">
              <Button
                component={Link}
                href="/register"
                size="md"
                color="brand"
                rightSection={
                  <IconArrowRight size={16} stroke={1.5} aria-hidden="true" />
                }
              >
                Bắt đầu miễn phí
              </Button>
              <Button
                component={Link}
                href="/login"
                size="md"
                variant="default"
              >
                Đăng nhập
              </Button>
            </Group>
          </Stack>

          <Paper
            withBorder
            shadow="sm"
            radius="lg"
            p="lg"
            className={surfaces.bodySurface}
          >
            <Stack gap="md">
              <Group justify="space-between" wrap="wrap" gap="xs">
                <Badge color="success" variant="dot">
                  Phiên mẫu — Backend Engineer
                </Badge>
                <Badge color="brand" variant="light">
                  SFIA Level 4 — Enable
                </Badge>
              </Group>

              <Group align="center" gap="lg" wrap="nowrap">
                <RingProgress
                  size={96}
                  thickness={9}
                  roundCaps
                  sections={[{ value: 84, color: 'success' }]}
                  label={
                    <Text ta="center" fw={700} size="sm">
                      84/100
                    </Text>
                  }
                />
                <Stack gap={4}>
                  <Text fw={600} size="sm">
                    Báo cáo năng lực STAR
                  </Text>
                  <Text size="xs" c="dimmed">
                    Luồng phân tích rõ ràng, nêu bật nguyên nhân gốc và cách
                    giảm độ trễ hệ thống production.
                  </Text>
                  <Group gap="xs" mt={4}>
                    <Badge size="xs" color="success" variant="light">
                      Situation
                    </Badge>
                    <Badge size="xs" color="success" variant="light">
                      Task
                    </Badge>
                    <Badge size="xs" color="brand" variant="light">
                      Action
                    </Badge>
                    <Badge size="xs" color="warning" variant="light">
                      Result
                    </Badge>
                  </Group>
                </Stack>
              </Group>

              <Divider />

              <Paper
                withBorder
                p="sm"
                radius="md"
                className={surfaces.subtleSurface}
              >
                <Text size="sm">
                  &ldquo;Hãy kể về một tình huống bạn phải debug một lỗi khó
                  hoặc tối ưu truy vấn chậm trên production.&rdquo;
                </Text>
              </Paper>

              <Group gap="xs" wrap="nowrap" align="flex-start">
                <ThemeIcon color="brand" variant="light" size="sm" radius="xl">
                  <IconSparkles size={14} stroke={1.5} aria-hidden="true" />
                </ThemeIcon>
                <Text size="xs" c="dimmed">
                  Gợi ý cải thiện: Bổ sung số liệu độ trễ p95 trước và sau khi
                  tối ưu chỉ mục để phần Result thuyết phục hơn.
                </Text>
              </Group>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Container>
    </Box>
  )
}
