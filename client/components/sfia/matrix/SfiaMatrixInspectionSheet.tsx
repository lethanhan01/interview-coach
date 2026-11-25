'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconAlertTriangle,
  IconCopy,
  IconFolderRoot,
  IconPlus,
} from '@tabler/icons-react'
import type { SfiaCategory, SfiaLevelResponsibility } from '@/types'
import { sfiaAdminQueries } from '@/queries/sfia.queries'
import { getSfiaCategorySemanticTheme } from '@/components/sfia/sfia-theme'
import { generateSfiaRubricMarkdownPrompt } from '@/components/sfia/sfia-prompt-helper'
import layout from '@/styles/layout.module.css'
import sfia from '../sfia.module.css'
import { SfiaInspectionDetails } from './SfiaInspectionDetails'

export interface SfiaMatrixInspectionSheetProps {
  isOpen: boolean
  onClose: () => void
  skillCode: string | null
  levelId: number | null
  levels?: SfiaLevelResponsibility[]
  categories?: SfiaCategory[]
  onOpenInTaxonomy: (skillCode: string, levelId: number) => void
  onCreateQuestion: (skillCode: string, levelId: number) => void
}

export function SfiaMatrixInspectionSheet({
  isOpen,
  onClose,
  skillCode,
  levelId,
  levels,
  categories,
  onOpenInTaxonomy,
  onCreateQuestion,
}: Readonly<SfiaMatrixInspectionSheetProps>) {
  const {
    data: detail = null,
    isLoading: loading,
    error: queryError,
    isFetched,
    refetch,
  } = useQuery({
    ...sfiaAdminQueries.skillDetail(skillCode ?? ''),
    enabled: isOpen && Boolean(skillCode),
  })

  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? 'Không thể tải thông tin chi tiết kỹ năng'
        : isOpen && Boolean(skillCode) && isFetched && !detail
          ? `Không tìm thấy dữ liệu kỹ năng cho mã ${skillCode}`
          : null

  const categoryTheme = getSfiaCategorySemanticTheme(detail?.categoryCode)
  const category = categories?.find((c) => c.code === detail?.categoryCode)
  const categoryLabel =
    category?.nameVi || category?.name || detail?.categoryCode

  const handleCopyPrompt = async () => {
    if (!detail || !levelId) return
    try {
      const promptMarkdown = generateSfiaRubricMarkdownPrompt(
        detail,
        levelId,
        levels,
        categories
      )
      await navigator.clipboard.writeText(promptMarkdown)
      notifications.show({
        color: 'success',
        message: 'Đã sao chép AI Rubric vào bộ nhớ tạm',
      })
    } catch {
      notifications.show({
        color: 'danger',
        message: 'Không thể sao chép AI Rubric vào bộ nhớ tạm',
      })
    }
  }

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="right"
      size="lg"
      padding={0}
      closeButtonProps={{ 'aria-label': 'Đóng bảng kiểm tra kỹ năng' }}
      classNames={{ content: layout.drawerContent, body: layout.drawerBody }}
      title={
        <Stack gap={4}>
          <Group gap={6} align="center" wrap="wrap">
            {skillCode && (
              <Badge
                color={categoryTheme.color}
                variant={categoryTheme.badgeVariant}
                size="sm"
                ff="monospace"
              >
                {skillCode}
              </Badge>
            )}
            {categoryLabel && (
              <Badge color="neutral" variant="light" size="sm">
                {categoryLabel}
              </Badge>
            )}
            {detail?.subcategoryCode && (
              <Text component="span" size="sm" ff="monospace" c="dimmed">
                / {detail.subcategoryCode}
              </Text>
            )}
          </Group>
          <Text component="span" size="lg" fw={700} lh={1.3}>
            {detail?.name || skillCode || 'Kiểm tra kỹ năng SFIA 9'}
          </Text>
        </Stack>
      }
    >
      <Box className={sfia.inspectionScrollBody}>
        {loading && (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Đang tải thông tin kỹ năng {skillCode}...
            </Text>
            <Skeleton height={48} radius="md" />
            <Skeleton height={84} radius="md" />
            <Skeleton height={112} radius="md" />
            <Skeleton height={96} radius="md" />
          </Stack>
        )}

        {error && (
          <Alert
            color="danger"
            icon={<IconAlertTriangle size={16} stroke={1.5} />}
            title="Không thể tải chi tiết kỹ năng"
          >
            <Stack gap="xs" align="flex-start">
              <Text size="sm">{error}</Text>
              <Button
                variant="default"
                size="sm"
                onClick={() => skillCode && void refetch()}
              >
                Thử lại
              </Button>
            </Stack>
          </Alert>
        )}

        {!loading && !error && detail && levelId !== null && (
          <SfiaInspectionDetails
            detail={detail}
            levelId={levelId}
            levels={levels}
          />
        )}
      </Box>

      <Box className={sfia.inspectionFooter}>
        <Group grow gap="xs" wrap="wrap">
          <Button
            variant="default"
            size="sm"
            leftSection={<IconFolderRoot size={15} stroke={1.5} />}
            disabled={!skillCode || !levelId}
            onClick={() => {
              if (skillCode && levelId) {
                onOpenInTaxonomy(skillCode, levelId)
                onClose()
              }
            }}
          >
            Mở trong Cây kỹ năng
          </Button>
          <Button
            variant="light"
            color="brand"
            size="sm"
            leftSection={<IconCopy size={15} stroke={1.5} />}
            disabled={!detail || !levelId}
            onClick={() => void handleCopyPrompt()}
          >
            Sao chép AI Rubric
          </Button>
          <Button
            variant="filled"
            color="brand"
            size="sm"
            leftSection={<IconPlus size={15} stroke={1.5} />}
            disabled={!skillCode || !levelId}
            onClick={() =>
              skillCode && levelId && onCreateQuestion(skillCode, levelId)
            }
          >
            Tạo câu hỏi
          </Button>
        </Group>
      </Box>
    </Drawer>
  )
}
