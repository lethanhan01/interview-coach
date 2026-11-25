'use client'

import { useMemo } from 'react'
import { ActionIcon, Badge, Button, Group, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconChevronRight, IconFolderRoot } from '@tabler/icons-react'
import { AdminMobileSidebarDrawer } from '@/components/admin/shared/AdminMobileSidebarDrawer'
import type {
  SfiaCategory,
  SfiaLevelResponsibility,
  SfiaSkillSummary,
  SfiaSubcategory,
} from '@/types'
import { getSfiaCategorySemanticTheme } from '../sfia-theme'
import { SfiaSidebarTree } from './SfiaSidebarTree'

export interface SfiaMobileDrawerProps {
  categories: SfiaCategory[]
  subcategories: SfiaSubcategory[]
  skills: SfiaSkillSummary[]
  selectedSkill: string
  selectedLevel: number
  onSelectSkill: (skillCode: string, targetLevel?: number) => void
  levels?: SfiaLevelResponsibility[]
  className?: string
}

export function SfiaMobileDrawer({
  categories,
  subcategories,
  skills,
  selectedSkill,
  selectedLevel,
  onSelectSkill,
  levels,
  className,
}: Readonly<SfiaMobileDrawerProps>) {
  const [opened, { open, close }] = useDisclosure(false)

  // Find info of currently selected skill
  const currentSkill = useMemo(() => {
    return skills.find((s) => s.code === selectedSkill) ?? skills[0]
  }, [skills, selectedSkill])

  const theme = useMemo(() => {
    return getSfiaCategorySemanticTheme(
      currentSkill?.categoryCode ?? 'DEV_IMPL'
    )
  }, [currentSkill])

  const handleSelectSkill = (code: string, targetLevel?: number) => {
    onSelectSkill(code, targetLevel)
    close()
  }

  return (
    <AdminMobileSidebarDrawer
      opened={opened}
      onClose={close}
      drawerTitle="Cây Kỹ Năng SFIA 9"
      closeAriaLabel="Đóng cây kỹ năng SFIA 9"
      drawerSize="md"
      drawerPadding="xs"
      className={className}
      triggerBar={
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="xs" align="center" wrap="nowrap" miw={0}>
            <Button
              variant="outline"
              size="sm"
              color="brand"
              leftSection={<IconFolderRoot size={15} stroke={1.5} />}
              onClick={open}
              aria-label="Mở cây kỹ năng SFIA 9"
            >
              Cây kỹ năng
            </Button>

            {currentSkill && (
              <Group gap={6} align="center" wrap="nowrap" miw={0}>
                <Badge color={theme.color} variant="light" size="sm">
                  {currentSkill.code}
                </Badge>
                <Text size="sm" fw={500} truncate maw={{ base: 140, sm: 220 }}>
                  {currentSkill.name}
                </Text>
                <Badge color="neutral" variant="outline" size="sm">
                  L{selectedLevel}
                </Badge>
              </Group>
            )}
          </Group>

          <ActionIcon
            variant="subtle"
            color="neutral"
            onClick={open}
            aria-label="Mở chi tiết cây kỹ năng SFIA 9"
          >
            <IconChevronRight size={16} stroke={1.5} />
          </ActionIcon>
        </Group>
      }
    >
      <SfiaSidebarTree
        categories={categories}
        subcategories={subcategories}
        skills={skills}
        selectedSkill={selectedSkill}
        selectedLevel={selectedLevel}
        onSelectSkill={handleSelectSkill}
        levels={levels}
      />
    </AdminMobileSidebarDrawer>
  )
}
