'use client'

import {
  ActionIcon,
  Badge,
  CopyButton,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import type { SfiaQuestionBankItem } from '@/types'
import { getSfiaLevelSemanticTheme } from '../sfia-theme'

export interface SfiaQuestionCardProps {
  question: SfiaQuestionBankItem
  isNewlyCreated?: boolean
}

function getDifficultyBadge(difficulty: string) {
  switch (difficulty) {
    case 'EASY':
      return { label: 'Dễ', color: 'success' as const }
    case 'MEDIUM':
      return { label: 'Trung bình', color: 'warning' as const }
    case 'HARD':
      return { label: 'Khó', color: 'danger' as const }
    default:
      return { label: difficulty, color: 'neutral' as const }
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'TECHNICAL':
      return {
        label: 'Chuyên môn',
        color: 'brand' as const,
        variant: 'outline' as const,
      }
    case 'BEHAVIORAL':
      return {
        label: 'Hành vi',
        color: 'brand' as const,
        variant: 'light' as const,
      }
    case 'SITUATIONAL':
      return {
        label: 'Tình huống',
        color: 'success' as const,
        variant: 'outline' as const,
      }
    case 'HR':
      return {
        label: 'HR',
        color: 'warning' as const,
        variant: 'light' as const,
      }
    default:
      return {
        label: type,
        color: 'neutral' as const,
        variant: 'light' as const,
      }
  }
}

export function SfiaQuestionCard({
  question,
  isNewlyCreated = false,
}: Readonly<SfiaQuestionCardProps>) {
  const levelTheme = getSfiaLevelSemanticTheme(question.targetSfiaLevel)
  const diffBadge = getDifficultyBadge(question.difficulty)
  const typeBadge = getTypeBadge(question.type)

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      bg={isNewlyCreated ? 'var(--mantine-color-brand-light)' : undefined}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap={6} align="center" wrap="wrap">
            <Badge color="neutral" variant="outline" size="xs" ff="monospace">
              {question.id}
            </Badge>

            <Badge
              color={levelTheme.color}
              variant={levelTheme.badgeVariant}
              size="xs"
            >
              Cấp độ {question.targetSfiaLevel}
            </Badge>

            <Badge color={diffBadge.color} variant="light" size="xs">
              {diffBadge.label}
            </Badge>

            <Badge
              color={typeBadge.color}
              variant={typeBadge.variant}
              size="xs"
            >
              {typeBadge.label}
            </Badge>

            {isNewlyCreated && (
              <Badge color="brand" variant="filled" size="xs">
                Mới tạo
              </Badge>
            )}
          </Group>

          <CopyButton value={question.questionText} timeout={2000}>
            {({ copied, copy }) => (
              <ActionIcon
                variant="subtle"
                color={copied ? 'success' : 'neutral'}
                size="sm"
                onClick={() => {
                  copy()
                  notifications.show({
                    message: `Đã sao chép câu hỏi (${question.id})!`,
                    color: 'success',
                    closeButtonProps: { 'aria-label': 'Đóng thông báo' },
                  })
                }}
                aria-label="Sao chép nội dung câu hỏi"
              >
                {copied ? (
                  <IconCheck size={14} stroke={1.5} />
                ) : (
                  <IconCopy size={14} stroke={1.5} />
                )}
              </ActionIcon>
            )}
          </CopyButton>
        </Group>

        <Text size="xs" lh={1.5} fw={500}>
          {question.questionText}
        </Text>
      </Stack>
    </Paper>
  )
}
