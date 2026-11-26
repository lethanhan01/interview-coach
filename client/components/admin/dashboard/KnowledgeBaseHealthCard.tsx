'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Badge,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { onetAdminQueries } from '@/queries/onet.queries'
import { sfiaAdminQueries } from '@/queries/sfia.queries'
import { OnetHealthPanel } from './OnetHealthPanel'
import { SfiaHealthPanel } from './SfiaHealthPanel'

interface KnowledgeBaseHealthCardProps {
  enabled: boolean
}

export function KnowledgeBaseHealthCard({
  enabled,
}: Readonly<KnowledgeBaseHealthCardProps>) {
  const onetQuery = useQuery({ ...onetAdminQueries.summary(), enabled })
  const sfiaQuery = useQuery({ ...sfiaAdminQueries.coverage(), enabled })

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

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          <OnetHealthPanel
            data={onetQuery.data}
            isLoading={onetQuery.isLoading}
            error={onetQuery.error}
            onRetry={() => void onetQuery.refetch()}
          />
          <SfiaHealthPanel
            data={sfiaQuery.data}
            isLoading={sfiaQuery.isLoading}
            error={sfiaQuery.error}
            onRetry={() => void sfiaQuery.refetch()}
          />
        </SimpleGrid>
      </Stack>
    </Paper>
  )
}
