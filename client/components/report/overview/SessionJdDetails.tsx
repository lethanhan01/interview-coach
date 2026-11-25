import {
  Badge,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import surfaces from '@/styles/surfaces.module.css'
import typography from '@/styles/typography.module.css'
import type { ParsedJobDescription } from './parse-session-jd'

export interface SessionJdDetailsProps {
  parsedJd: ParsedJobDescription
  fallbackJobTitle?: string
}

function JdMetaField({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" fw={600} tt="uppercase" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value}
      </Text>
    </Stack>
  )
}

function JdTextBlock({ label, text }: { label: string; text: string }) {
  return (
    <Stack gap={4}>
      <Text size="xs" fw={600} tt="uppercase" c="dimmed">
        {label}
      </Text>
      <Paper
        withBorder
        radius="sm"
        p="sm"
        className={`${surfaces.subtleSurface} ${typography.preLine}`}
      >
        <Text size="sm">{text}</Text>
      </Paper>
    </Stack>
  )
}

export function SessionJdDetails({
  parsedJd,
  fallbackJobTitle,
}: Readonly<SessionJdDetailsProps>) {
  return (
    <>
      <Divider my="xs" />

      <Title order={3} size="h5">
        Mô tả công việc (JD)
      </Title>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        <JdMetaField label="Công ty" value={parsedJd.companyName || '—'} />
        <JdMetaField label="Level yêu cầu" value={parsedJd.level || '—'} />
        <JdMetaField label="Chỉ tiêu tuyển" value={parsedJd.headcount || '—'} />
        <JdMetaField
          label="Vị trí JD"
          value={parsedJd.jobTitle || fallbackJobTitle || '—'}
        />
      </SimpleGrid>

      {parsedJd.techStack.length > 0 ? (
        <Stack gap={4}>
          <Text size="xs" fw={600} tt="uppercase" c="dimmed">
            Tech Stack yêu cầu
          </Text>
          <Group gap="xs" wrap="wrap">
            {parsedJd.techStack.map((tech) => (
              <Badge key={tech} variant="light" color="neutral" size="sm">
                {tech}
              </Badge>
            ))}
          </Group>
        </Stack>
      ) : null}

      {parsedJd.requirements ? (
        <JdTextBlock label="Yêu cầu công việc" text={parsedJd.requirements} />
      ) : null}

      {parsedJd.jobContent ? (
        <JdTextBlock label="Nội dung công việc" text={parsedJd.jobContent} />
      ) : null}
    </>
  )
}
