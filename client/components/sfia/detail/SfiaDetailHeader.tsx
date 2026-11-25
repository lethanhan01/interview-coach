'use client'

import {
  Badge,
  Button,
  Center,
  CopyButton,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconCheck,
  IconCopy,
  IconGridDots,
  IconRobot,
} from '@tabler/icons-react'
import type { SfiaCategory, SfiaSkillDetail, SfiaSubcategory } from '@/types'
import { countUniqueOnetOccupations } from '../sfia-onet-mapping.utils'
import { getSfiaCategorySemanticTheme } from '../sfia-theme'

export interface SfiaDetailHeaderProps {
  skillDetail: SfiaSkillDetail
  categories: SfiaCategory[]
  subcategories: SfiaSubcategory[]
  selectedLevel: number
  onOpenAiModal: () => void
  onNavigateToMatrix?: () => void
}

export function SfiaDetailHeader({
  skillDetail,
  categories,
  subcategories,
  selectedLevel,
  onOpenAiModal,
  onNavigateToMatrix,
}: Readonly<SfiaDetailHeaderProps>) {
  const currentCat = categories.find((c) => c.code === skillDetail.categoryCode)
  const currentSub = subcategories.find(
    (s) => s.code === skillDetail.subcategoryCode
  )
  const theme = getSfiaCategorySemanticTheme(skillDetail.categoryCode)

  const questionCount =
    skillDetail.questionBankItems?.length ?? skillDetail.questionCount ?? 0
  const mappingCount = skillDetail.onetMappings?.length ?? 0
  const uniqueOccupationCount = skillDetail.onetMappings
    ? countUniqueOnetOccupations(skillDetail.onetMappings)
    : (skillDetail.onetCount ?? 0)

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
        <Group gap="sm" align="flex-start" wrap="nowrap" miw={0}>
          <Paper
            withBorder
            p="xs"
            radius="md"
            bg="var(--mantine-color-body)"
            w={48}
            h={48}
          >
            <Center h="100%">
              <Text fw={700} ff="monospace" size="sm" c={theme.color}>
                {skillDetail.code}
              </Text>
            </Center>
          </Paper>

          <Stack gap={2} miw={0}>
            <Group gap="xs" align="center" wrap="wrap">
              <Title order={2} fz="md" fw={700}>
                {skillDetail.name}
              </Title>
              <Badge color={theme.color} variant="light" size="xs">
                Cấp độ {skillDetail.minLevel} ➔ {skillDetail.maxLevel}
              </Badge>
            </Group>

            <Group gap={6} align="center" wrap="wrap">
              <Text size="xs" fw={500}>
                {currentCat?.nameVi ||
                  currentCat?.name ||
                  skillDetail.categoryCode}
              </Text>
              <Text size="xs" c="dimmed">
                ›
              </Text>
              <Text size="xs" c="dimmed">
                {currentSub?.nameVi ||
                  currentSub?.name ||
                  skillDetail.subcategoryCode}
              </Text>
              <Text size="xs" c="dimmed">
                ›
              </Text>
              <Text size="xs" ff="monospace" fw={600}>
                {skillDetail.code}
              </Text>
            </Group>
          </Stack>
        </Group>

        <Group gap="xs" wrap="wrap">
          <CopyButton value={skillDetail.code} timeout={2000}>
            {({ copied, copy }) => (
              <Button
                variant="default"
                size="xs"
                onClick={() => {
                  copy()
                  notifications.show({
                    message: `Đã sao chép mã kỹ năng: ${skillDetail.code}`,
                    color: 'success',
                  })
                }}
                leftSection={
                  copied ? (
                    <IconCheck size={14} stroke={1.5} />
                  ) : (
                    <IconCopy size={14} stroke={1.5} />
                  )
                }
              >
                {copied ? 'Đã sao chép' : 'Sao chép mã'}
              </Button>
            )}
          </CopyButton>

          <Button
            variant="light"
            color="brand"
            size="xs"
            onClick={onOpenAiModal}
            leftSection={<IconRobot size={14} stroke={1.5} />}
          >
            Gợi ý AI Rubric
          </Button>

          {onNavigateToMatrix && (
            <Button
              variant="default"
              size="xs"
              onClick={onNavigateToMatrix}
              leftSection={<IconGridDots size={14} stroke={1.5} />}
            >
              Ma trận 2D
            </Button>
          )}
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
        <Paper withBorder p="xs" radius="sm">
          <Text size="xs" c="dimmed">
            Dải cấp độ chuẩn
          </Text>
          <Text fw={700} size="sm" ff="monospace">
            L{skillDetail.minLevel} – L{skillDetail.maxLevel} (
            {skillDetail.maxLevel - skillDetail.minLevel + 1} cấp)
          </Text>
        </Paper>

        <Paper withBorder p="xs" radius="sm">
          <Text size="xs" c="dimmed">
            Câu hỏi phỏng vấn
          </Text>
          <Text fw={700} size="sm">
            {questionCount} câu hỏi
          </Text>
        </Paper>

        <Paper withBorder p="xs" radius="sm">
          <Text size="xs" c="dimmed">
            Ánh xạ O*NET
          </Text>
          <Text fw={700} size="sm">
            {uniqueOccupationCount} nghề nghiệp
            {mappingCount > uniqueOccupationCount && (
              <Text span size="xs" c="dimmed" fw={400}>
                {' '}
                ({mappingCount} ánh xạ)
              </Text>
            )}
          </Text>
        </Paper>

        <Paper withBorder p="xs" radius="sm">
          <Text size="xs" c="dimmed">
            Cấp độ đang xem
          </Text>
          <Text fw={700} size="sm" c="brand">
            Cấp độ {selectedLevel}
          </Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  )
}
