'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Badge,
  Button,
  Group,
  NumberFormatter,
  Paper,
  RingProgress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconRefresh,
} from '@tabler/icons-react'
import { onetAdminQueries } from '@/queries/onet.queries'
import { sfiaAdminQueries } from '@/queries/sfia.queries'
import surfaces from '@/styles/surfaces.module.css'
import typography from '@/styles/typography.module.css'

interface KnowledgeBaseHealthCardProps {
  enabled: boolean
}

function HealthErrorBlock({
  title,
  message,
  onRetry,
}: Readonly<{ title: string; message: string; onRetry: () => void }>) {
  return (
    <Alert
      color="warning"
      variant="light"
      icon={<IconAlertTriangle size={16} stroke={1.5} />}
      title={title}
    >
      <Stack gap="xs">
        <Text size="xs">{message}</Text>
        <Group>
          <Button
            size="xs"
            variant="light"
            color="warning"
            leftSection={<IconRefresh size={14} stroke={1.5} />}
            onClick={onRetry}
          >
            Thử lại
          </Button>
        </Group>
      </Stack>
    </Alert>
  )
}

function HealthSkeleton() {
  return (
    <Stack gap="sm">
      <Skeleton height={20} width="50%" />
      <Skeleton height={88} radius="md" />
    </Stack>
  )
}

export function KnowledgeBaseHealthCard({
  enabled,
}: Readonly<KnowledgeBaseHealthCardProps>) {
  const onetQuery = useQuery({ ...onetAdminQueries.summary(), enabled })
  const sfiaQuery = useQuery({ ...sfiaAdminQueries.coverage(), enabled })

  const sfiaCoveragePercent =
    sfiaQuery.data && sfiaQuery.data.totalSkills > 0
      ? Math.round(
          (sfiaQuery.data.skillsWithQuestions / sfiaQuery.data.totalSkills) *
            100
        )
      : 0

  return (
    <Paper withBorder p="lg" radius="md">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={2}>
            <Title order={2} size="h4">
              Sức khỏe kho tri thức O*NET 29.1 & SFIA 9
            </Title>
            <Text size="xs" c="dimmed">
              Theo dõi độ phủ ánh xạ nghề nghiệp và ngân hàng câu hỏi phỏng vấn
            </Text>
          </Stack>
          <Badge color="brand" variant="light" size="sm">
            Đồng bộ dữ liệu thực
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Paper p="md" radius="md" className={surfaces.subtleSurface}>
            {onetQuery.isLoading ? (
              <HealthSkeleton />
            ) : onetQuery.error || !onetQuery.data ? (
              <HealthErrorBlock
                title="Không thể tải thống kê O*NET"
                message={
                  onetQuery.error instanceof Error
                    ? onetQuery.error.message
                    : 'Dữ liệu tổng quan O*NET tạm thời gián đoạn.'
                }
                onRetry={() => void onetQuery.refetch()}
              />
            ) : (
              <Group align="flex-start" wrap="nowrap" gap="md">
                <RingProgress
                  size={96}
                  thickness={9}
                  roundCaps
                  sections={[
                    {
                      value: onetQuery.data.overallMappingCoveragePercent,
                      color: 'brand',
                    },
                  ]}
                  label={
                    <Text
                      ta="center"
                      fw={700}
                      size="sm"
                      className={typography.tabularNums}
                    >
                      {onetQuery.data.overallMappingCoveragePercent}%
                    </Text>
                  }
                />
                <Stack gap={6} flex={1}>
                  <Text size="sm" fw={600}>
                    Độ phủ ánh xạ O*NET → SFIA
                  </Text>
                  <Text size="xs" c="dimmed" className={typography.tabularNums}>
                    <NumberFormatter
                      value={onetQuery.data.totalOccupations}
                      thousandSeparator="."
                      decimalSeparator=","
                    />{' '}
                    nghề / {onetQuery.data.totalMajorGroups} nhóm SOC (
                    {onetQuery.data.totalMappedOccupations} đã ánh xạ)
                  </Text>
                  <Group gap="xs" wrap="wrap">
                    <Badge color="brand" variant="light" size="xs">
                      Nhóm CNTT (15): {onetQuery.data.itGroupCoveragePercent}%
                    </Badge>
                    <Badge color="warning" variant="light" size="xs">
                      Hot Tech:{' '}
                      <NumberFormatter
                        value={onetQuery.data.hotTechCount}
                        thousandSeparator="."
                        decimalSeparator=","
                      />
                    </Badge>
                  </Group>
                  <Group mt={4}>
                    <Button
                      component={Link}
                      href="/admin/onet"
                      variant="light"
                      color="brand"
                      size="xs"
                      rightSection={<IconArrowRight size={14} stroke={1.5} />}
                    >
                      Mở O*NET Browser
                    </Button>
                  </Group>
                </Stack>
              </Group>
            )}
          </Paper>

          <Paper p="md" radius="md" className={surfaces.subtleSurface}>
            {sfiaQuery.isLoading ? (
              <HealthSkeleton />
            ) : sfiaQuery.error || !sfiaQuery.data ? (
              <HealthErrorBlock
                title="Không thể tải thống kê SFIA 9"
                message={
                  sfiaQuery.error instanceof Error
                    ? sfiaQuery.error.message
                    : 'Dữ liệu độ phủ SFIA 9 tạm thời gián đoạn.'
                }
                onRetry={() => void sfiaQuery.refetch()}
              />
            ) : (
              <Group align="flex-start" wrap="nowrap" gap="md">
                <RingProgress
                  size={96}
                  thickness={9}
                  roundCaps
                  sections={[{ value: sfiaCoveragePercent, color: 'success' }]}
                  label={
                    <Text
                      ta="center"
                      fw={700}
                      size="sm"
                      className={typography.tabularNums}
                    >
                      {sfiaCoveragePercent}%
                    </Text>
                  }
                />
                <Stack gap={6} flex={1}>
                  <Text size="sm" fw={600}>
                    Độ phủ câu hỏi SFIA 9
                  </Text>
                  <Text size="xs" c="dimmed" className={typography.tabularNums}>
                    {sfiaQuery.data.skillsWithQuestions}/
                    {sfiaQuery.data.totalSkills} kỹ năng có câu hỏi (
                    <NumberFormatter
                      value={sfiaQuery.data.totalQuestions}
                      thousandSeparator="."
                      decimalSeparator=","
                    />{' '}
                    câu)
                  </Text>
                  <Group gap="xs" wrap="wrap">
                    <Badge color="danger" variant="light" size="xs">
                      {sfiaQuery.data.blindSpotsCount} điểm mù (0 câu hỏi)
                    </Badge>
                    <Badge color="success" variant="light" size="xs">
                      {sfiaQuery.data.skillsWithOnet}/
                      {sfiaQuery.data.totalSkills} gắn O*NET
                    </Badge>
                  </Group>
                  <Group mt={4}>
                    <Button
                      component={Link}
                      href="/admin/sfia?tab=analytics"
                      variant="light"
                      color="danger"
                      size="xs"
                      rightSection={<IconArrowRight size={14} stroke={1.5} />}
                    >
                      Xử lý điểm mù SFIA
                    </Button>
                  </Group>
                </Stack>
              </Group>
            )}
          </Paper>
        </SimpleGrid>
      </Stack>
    </Paper>
  )
}
