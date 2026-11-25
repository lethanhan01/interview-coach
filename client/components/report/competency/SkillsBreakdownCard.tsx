import {
  Badge,
  Box,
  Card,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconAward,
  IconCpu,
  IconSparkles,
} from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import type { SkillBreakdownItem } from '@/types'
import report from '../report.module.css'

export interface SkillsBreakdownCardProps {
  skills?: SkillBreakdownItem[]
  className?: string
}

export function SkillsBreakdownCard({
  skills = [],
  className,
}: Readonly<SkillsBreakdownCardProps>) {
  if (!skills || skills.length === 0) {
    return null
  }

  return (
    <Stack gap="md" className={className}>
      <Group gap="xs">
        <ThemeIcon size={32} radius="md" color="brand" variant="light">
          <IconAward size={18} aria-hidden="true" />
        </ThemeIcon>
        <Text size="lg" fw={700}>
          Chi Tiết Đánh Giá Từng Năng Lực (Skills Breakdown)
        </Text>
      </Group>

      <Stack gap="md">
        {skills.map((skill) => {
          const isPassed = skill.status === 'passed'

          return (
            <Card key={skill.skillCode} withBorder radius="md" p="lg">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start" wrap="wrap">
                  <Stack gap={4}>
                    <Group gap="xs" wrap="wrap">
                      <Badge
                        variant="outline"
                        size="sm"
                        ff="monospace"
                        fw={600}
                      >
                        {skill.skillCode}
                      </Badge>
                      <Text size="md" fw={700}>
                        {skill.skillName}
                      </Text>
                    </Group>

                    {skill.techContext && skill.techContext.length > 0 && (
                      <Group gap={6} wrap="wrap" mt={4}>
                        <Group gap={4}>
                          <IconCpu
                            size={14}
                            color="var(--mantine-color-brand-filled)"
                            aria-hidden="true"
                          />
                          <Text size="xs" c="dimmed">
                            O*NET Tech:
                          </Text>
                        </Group>
                        {skill.techContext.map((tech) => (
                          <Badge
                            key={tech}
                            variant="light"
                            color="neutral"
                            size="xs"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </Group>
                    )}
                  </Stack>

                  <Badge
                    variant="light"
                    color={isPassed ? 'success' : 'warning'}
                    size="md"
                  >
                    {isPassed ? 'Đạt chuẩn' : 'Cần cải thiện (Gap)'}
                  </Badge>
                </Group>

                <Paper withBorder radius="md" p="sm">
                  <Stack gap="xs">
                    <Group justify="space-between" align="center" wrap="wrap">
                      <Text size="xs" fw={500} c="dimmed">
                        Mức độ thành thạo chứng minh:
                      </Text>
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">
                          Cấp độ:{' '}
                          <Text
                            component="span"
                            fw={700}
                            c="var(--mantine-color-text)"
                          >
                            Level {skill.demonstratedLevel}
                          </Text>{' '}
                          / Level {skill.targetLevel}
                        </Text>
                        <Text size="xs" c="dimmed">
                          •
                        </Text>
                        <Text size="xs" fw={700}>
                          {skill.score}/100 điểm
                        </Text>
                      </Group>
                    </Group>

                    <Progress
                      value={skill.score}
                      color={isPassed ? 'success' : 'warning'}
                      size="md"
                      radius="xl"
                      aria-label={`Điểm kỹ năng ${skill.skillName}: ${skill.score} trên 100`}
                    />
                  </Stack>
                </Paper>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  <Box
                    className={`${surfaces.subtleSurface} ${report.feedbackBox}`}
                    mod={{ variant: 'strength' }}
                  >
                    <Group gap={6} mb={4}>
                      <IconSparkles
                        size={14}
                        color="var(--mantine-color-success-filled)"
                        aria-hidden="true"
                      />
                      <Text size="xs" fw={600} c="success">
                        Điểm Mạnh Ghi Nhận
                      </Text>
                    </Group>
                    <Text size="xs" lh="md">
                      {skill.strengths || 'Ứng viên hoàn thành cơ bản câu hỏi.'}
                    </Text>
                  </Box>

                  <Box
                    className={`${surfaces.subtleSurface} ${report.feedbackBox}`}
                    mod={{ variant: 'improvement' }}
                  >
                    <Group gap={6} mb={4}>
                      <IconAlertCircle
                        size={14}
                        color="var(--mantine-color-warning-filled)"
                        aria-hidden="true"
                      />
                      <Text size="xs" fw={600} c="warning">
                        Điểm Cần Hoàn Thiện
                      </Text>
                    </Group>
                    <Text size="xs" lh="md">
                      {skill.areasForImprovement ||
                        'Tiếp tục củng cố kiến thức chuyên sâu để đạt chuẩn cao hơn.'}
                    </Text>
                  </Box>
                </SimpleGrid>
              </Stack>
            </Card>
          )
        })}
      </Stack>
    </Stack>
  )
}

export default SkillsBreakdownCard
