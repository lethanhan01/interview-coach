'use client'

import { useEffect, useMemo, useRef } from 'react'
import {
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconPlus } from '@tabler/icons-react'
import { queryKeys } from '@/queries/keys'
import { sfiaAdminService } from '@/services/sfia-admin.service'
import type {
  CreateSfiaQuestionPayload,
  SfiaLevelResponsibility,
  SfiaQuestionBankItem,
} from '@/types'
import {
  SFIA_QUESTION_DIFFICULTIES,
  SFIA_QUESTION_INTERVIEW_TYPES,
  buildAvailableLevelOptions,
  createInitialQuestionValues,
  createSfiaQuestionSchema,
  isDynamicSfiaQuery,
  type SfiaQuestionFormValues,
} from './sfia-question.schema'
import { SfiaQuestionCharCounter } from './SfiaQuestionCharCounter'

export interface SfiaCreateQuestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skillCode: string
  skillName: string
  minLevel: number
  maxLevel: number
  defaultLevel: number
  levels?: SfiaLevelResponsibility[]
  onQuestionCreated: (newQuestion: SfiaQuestionBankItem) => void
}

export function SfiaCreateQuestionModal({
  open,
  onOpenChange,
  skillCode,
  skillName,
  minLevel,
  maxLevel,
  defaultLevel,
  levels,
  onQuestionCreated,
}: Readonly<SfiaCreateQuestionModalProps>) {
  const queryClient = useQueryClient()

  const validate = useMemo(
    () =>
      schemaResolver(createSfiaQuestionSchema(minLevel, maxLevel), {
        sync: true,
      }),
    [minLevel, maxLevel]
  )

  const form = useForm<SfiaQuestionFormValues>({
    mode: 'uncontrolled',
    initialValues: createInitialQuestionValues(
      minLevel,
      maxLevel,
      defaultLevel
    ),
    validate,
  })

  const formRef = useRef(form)
  useEffect(() => {
    formRef.current = form
  })

  useEffect(() => {
    if (open) {
      formRef.current.setValues(
        createInitialQuestionValues(minLevel, maxLevel, defaultLevel)
      )
      formRef.current.clearErrors()
    }
  }, [open, defaultLevel, minLevel, maxLevel])

  const createQuestionMutation = useMutation({
    mutationFn: (payload: CreateSfiaQuestionPayload) =>
      sfiaAdminService.createQuestion(skillCode, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sfiaAdmin.all,
        predicate: isDynamicSfiaQuery,
      })
    },
  })

  const availableLevels = useMemo(
    () => buildAvailableLevelOptions(minLevel, maxLevel, levels),
    [minLevel, maxLevel, levels]
  )

  const handleSubmit = async (values: SfiaQuestionFormValues) => {
    try {
      const created = await createQuestionMutation.mutateAsync({
        questionText: values.questionText.trim(),
        type: values.type,
        difficulty: values.difficulty,
        targetSfiaLevel: Number(values.targetSfiaLevel),
      })

      notifications.show({
        message: 'Thêm câu hỏi phỏng vấn thành công!',
        color: 'success',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
      onQuestionCreated(created)
      onOpenChange(false)
    } catch (err) {
      form.setErrors({
        questionText:
          err instanceof Error
            ? err.message
            : 'Không thể tạo câu hỏi phỏng vấn. Vui lòng thử lại.',
      })
    }
  }

  const isSubmitting = createQuestionMutation.isPending

  return (
    <Modal
      opened={open}
      onClose={() => !isSubmitting && onOpenChange(false)}
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
      withCloseButton={!isSubmitting}
      size="md"
      title={
        <Group gap="xs" align="center">
          <IconPlus size={16} stroke={1.5} />
          <Text fw={700} size="md">
            Tạo Câu Hỏi Phỏng Vấn Mới
          </Text>
        </Group>
      }
      closeButtonProps={{ 'aria-label': 'Đóng cửa sổ thêm câu hỏi' }}
    >
      <Box component="form" onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack gap="xs">
          <Paper withBorder p="xs" radius="sm">
            <Group justify="space-between" align="center">
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Kỹ năng SFIA 9
                </Text>
                <Text fw={700} size="sm" ff="monospace">
                  {skillCode} — {skillName}
                </Text>
              </Stack>
              <Badge color="brand" variant="light" size="sm">
                L{minLevel} ➔ L{maxLevel}
              </Badge>
            </Group>
          </Paper>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            <Select
              label="Cấp độ SFIA mục tiêu"
              placeholder="Chọn cấp độ"
              data={availableLevels}
              allowDeselect={false}
              key={form.key('targetSfiaLevel')}
              {...form.getInputProps('targetSfiaLevel')}
              required
            />
            <Select
              label="Loại phỏng vấn"
              placeholder="Chọn loại"
              data={SFIA_QUESTION_INTERVIEW_TYPES}
              key={form.key('type')}
              {...form.getInputProps('type')}
              required
            />
          </SimpleGrid>

          <Select
            label="Độ khó"
            placeholder="Chọn độ khó"
            data={SFIA_QUESTION_DIFFICULTIES}
            key={form.key('difficulty')}
            {...form.getInputProps('difficulty')}
            required
          />

          <Stack gap={4}>
            <Textarea
              label="Nội dung câu hỏi phỏng vấn"
              placeholder="Nhập nội dung câu hỏi phỏng vấn chi tiết (từ 15 đến 500 ký tự)..."
              minRows={4}
              maxRows={8}
              autosize
              key={form.key('questionText')}
              {...form.getInputProps('questionText')}
              required
            />
            <SfiaQuestionCharCounter form={form} />
          </Stack>

          <Group justify="flex-end" gap="xs" mt="xs">
            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              color="brand"
              loading={isSubmitting}
              leftSection={<IconPlus size={15} stroke={1.5} />}
            >
              Tạo câu hỏi
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  )
}
