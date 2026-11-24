'use client'

import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Chip,
  CopyButton,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import {
  IconBolt,
  IconCheck,
  IconCopy,
  IconFlame,
  IconSearch,
  IconX,
} from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import type { OnetSoftwareSkill } from '@/types'
import { OnetTechCategoryCard } from './OnetTechCategoryCard'

export interface OnetTechSkillsTabProps {
  skills: OnetSoftwareSkill[]
}

type TechFilterType = 'all' | 'hot' | 'demand'
type TechViewMode = 'category' | 'cloud'

export function OnetTechSkillsTab({ skills }: Readonly<OnetTechSkillsTabProps>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<TechFilterType>('all')
  const [viewMode, setViewMode] = useState<TechViewMode>('category')

  const hotCount = useMemo(
    () => skills.filter((s) => s.isHotTechnology).length,
    [skills]
  )
  const demandCount = useMemo(
    () => skills.filter((s) => s.inDemand).length,
    [skills]
  )

  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return skills.filter((skill) => {
      if (activeFilter === 'hot' && !skill.isHotTechnology) return false
      if (activeFilter === 'demand' && !skill.inDemand) return false
      if (!q) return true
      return (
        skill.name.toLowerCase().includes(q) ||
        skill.category.toLowerCase().includes(q)
      )
    })
  }, [skills, searchQuery, activeFilter])

  const groupedSkills = useMemo(() => {
    const map = new Map<string, OnetSoftwareSkill[]>()
    for (const skill of filteredSkills) {
      const cat = skill.category || 'Công cụ chuyên ngành'
      const list = map.get(cat) ?? []
      list.push(skill)
      map.set(cat, list)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [filteredSkills])

  return (
    <Stack gap="sm">
      {/* Control Header */}
      <Paper withBorder p="sm" radius="md">
        <Stack gap="xs">
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <Title order={2} size="h6">
                Kỹ năng Phần mềm & Công cụ (Tech Stack)
              </Title>
              <Badge color="neutral" variant="outline" size="xs">
                {skills.length} công nghệ
              </Badge>
            </Group>

            <SegmentedControl
              size="xs"
              value={viewMode}
              onChange={(val) => setViewMode(val as TechViewMode)}
              aria-label="Chế độ xem kỹ năng công nghệ"
              data={[
                { value: 'category', label: 'Theo danh mục' },
                { value: 'cloud', label: 'Đám mây thẻ' },
              ]}
            />
          </Group>

          <Group gap="xs" wrap="wrap" justify="space-between">
            <TextInput
              size="xs"
              flex={1}
              miw={200}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              placeholder="Tìm kiếm công nghệ, ngôn ngữ, công cụ..."
              aria-label="Tìm kiếm công nghệ"
              leftSection={<IconSearch size={14} stroke={1.5} />}
              rightSection={
                searchQuery ? (
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="neutral"
                    aria-label="Xóa tìm kiếm"
                    onClick={() => setSearchQuery('')}
                  >
                    <IconX size={12} stroke={1.5} />
                  </ActionIcon>
                ) : null
              }
            />

            <Chip.Group
              multiple={false}
              value={activeFilter}
              onChange={(val) => setActiveFilter((val as TechFilterType) || 'all')}
            >
              <Group gap="xs">
                <Chip value="all" size="xs" variant="outline">
                  Tất cả ({skills.length})
                </Chip>
                <Chip value="hot" size="xs" variant="outline" color="warning">
                  Nóng ({hotCount})
                </Chip>
                <Chip value="demand" size="xs" variant="outline" color="success">
                  Nhu cầu cao ({demandCount})
                </Chip>
              </Group>
            </Chip.Group>
          </Group>
        </Stack>
      </Paper>

      {/* Skills Display */}
      {filteredSkills.length === 0 ? (
        <Paper p="xl" radius="md" className={surfaces.subtleSurface}>
          <Stack align="center" gap="xs">
            <Text size="sm" fw={600}>
              Không tìm thấy kỹ năng công nghệ nào
            </Text>
            <Text size="xs" c="dimmed">
              Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.
            </Text>
            <Button
              size="xs"
              variant="light"
              onClick={() => {
                setSearchQuery('')
                setActiveFilter('all')
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </Stack>
        </Paper>
      ) : viewMode === 'category' ? (
        <Stack gap="xs">
          {groupedSkills.map(([cat, catSkills]) => (
            <OnetTechCategoryCard
              key={cat}
              category={cat}
              skills={catSkills}
            />
          ))}
        </Stack>
      ) : (
        <Paper withBorder p="sm" radius="md">
          <Group gap="xs" wrap="wrap">
            {filteredSkills.map((skill, index) => (
              <Badge
                key={`${skill.name}-${index}`}
                size="md"
                variant={skill.isHotTechnology ? 'filled' : 'light'}
                color={
                  skill.isHotTechnology
                    ? 'warning'
                    : skill.inDemand
                      ? 'success'
                      : 'neutral'
                }
                leftSection={
                  skill.isHotTechnology ? (
                    <IconFlame size={12} stroke={2} />
                  ) : skill.inDemand ? (
                    <IconBolt size={12} stroke={2} />
                  ) : undefined
                }
                rightSection={
                  <CopyButton value={skill.name} timeout={1800}>
                    {({ copied, copy }) => (
                      <ActionIcon
                        size={14}
                        variant="transparent"
                        color="inherit"
                        onClick={copy}
                        aria-label={`Sao chép ${skill.name}`}
                      >
                        {copied ? (
                          <IconCheck size={10} stroke={2} />
                        ) : (
                          <IconCopy size={10} stroke={1.5} />
                        )}
                      </ActionIcon>
                    )}
                  </CopyButton>
                }
              >
                {skill.name}
              </Badge>
            ))}
          </Group>
        </Paper>
      )}
    </Stack>
  )
}
