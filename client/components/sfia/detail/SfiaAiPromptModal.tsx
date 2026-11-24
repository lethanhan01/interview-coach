'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Code,
  CopyButton,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Tabs,
  Text,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconCheck,
  IconCopy,
  IconFileCode,
  IconFileText,
  IconInfoCircle,
} from '@tabler/icons-react'
import type { SfiaSkillDetail } from '@/types'
import {
  generateSfiaRubricJsonSchema,
  generateSfiaRubricMarkdownPrompt,
} from '@/components/sfia/sfia-prompt-helper'

export interface SfiaAiPromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skillDetail: SfiaSkillDetail
  selectedLevel: number
}

export function SfiaAiPromptModal({
  open,
  onOpenChange,
  skillDetail,
  selectedLevel,
}: Readonly<SfiaAiPromptModalProps>) {
  const [activeTab, setActiveTab] = useState<string | null>('markdown')

  const markdownContent = useMemo(
    () => generateSfiaRubricMarkdownPrompt(skillDetail, selectedLevel),
    [skillDetail, selectedLevel]
  )

  const jsonContent = useMemo(
    () => generateSfiaRubricJsonSchema(skillDetail, selectedLevel),
    [skillDetail, selectedLevel]
  )

  const isMarkdownTab = activeTab === 'markdown'
  const activeCopyValue = isMarkdownTab ? markdownContent : jsonContent

  return (
    <Modal
      opened={open}
      onClose={() => onOpenChange(false)}
      size="lg"
      title={
        <Group gap="xs" align="center">
          <Text fw={700} size="sm">
            Mẫu Prompt AI Rubric Đánh Giá Phỏng Vấn
          </Text>
          <Badge color="brand" variant="light" size="xs">
            {skillDetail.code} — Cấp độ {selectedLevel}
          </Badge>
        </Group>
      }
      closeButtonProps={{ 'aria-label': 'Đóng cửa sổ AI Rubric' }}
    >
      <Stack gap="sm">
        <Alert color="brand" icon={<IconInfoCircle size={16} />} radius="sm">
          <Text size="xs">
            Prompt này nhúng trực tiếp tinh hoa và tiêu chí hành vi SFIA 9 Cấp
            độ {selectedLevel} để AI Evaluator đánh giá khách quan và chính xác.
          </Text>
        </Alert>

        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          variant="outline"
          radius="sm"
        >
          <Group justify="space-between" align="center" mb="xs">
            <Tabs.List>
              <Tabs.Tab
                value="markdown"
                leftSection={<IconFileText size={14} stroke={1.5} />}
              >
                Markdown System Prompt
              </Tabs.Tab>
              <Tabs.Tab
                value="json"
                leftSection={<IconFileCode size={14} stroke={1.5} />}
              >
                JSON Schema Rubric
              </Tabs.Tab>
            </Tabs.List>

            <CopyButton
              key={activeTab ?? 'markdown'}
              value={activeCopyValue}
              timeout={2000}
            >
              {({ copied, copy }) => (
                <Button
                  variant="light"
                  color="brand"
                  size="xs"
                  onClick={() => {
                    copy()
                    notifications.show({
                      message: isMarkdownTab
                        ? `Đã sao chép System Prompt cho ${skillDetail.code} (Cấp độ ${selectedLevel})!`
                        : 'Đã sao chép JSON Schema Rubric!',
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
                  {copied
                    ? 'Đã sao chép'
                    : isMarkdownTab
                      ? 'Sao chép Prompt'
                      : 'Sao chép JSON'}
                </Button>
              )}
            </CopyButton>
          </Group>

          <Tabs.Panel value="markdown">
            <ScrollArea h={320} type="auto">
              <Code block>{markdownContent}</Code>
            </ScrollArea>
          </Tabs.Panel>

          <Tabs.Panel value="json">
            <ScrollArea h={320} type="auto">
              <Code block>{jsonContent}</Code>
            </ScrollArea>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Modal>
  )
}
