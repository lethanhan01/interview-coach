'use client'

import Link from 'next/link'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Title,
  VisuallyHidden,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconArrowRight,
  IconFileText,
  IconLock,
  IconMail,
  IconShieldCheck,
  IconUser,
} from '@tabler/icons-react'
import type { UpdateUserAccountPayload, UserAccountResponse } from '@/types'
import AccountInfoGroup from '@/components/profile/sections/AccountInfoGroup'
import ChangePasswordGroup from '@/components/profile/sections/ChangePasswordGroup'
import PersonalInfoGroup from '@/components/profile/sections/PersonalInfoGroup'

export interface AccountProfileViewProps {
  variant: 'candidate' | 'admin'
  title: string
  subtitle: string
  data: UserAccountResponse | null
  loading: boolean
  error: string | null
  onRetry?: () => void
  onSavePersonalInfo: (patch: UpdateUserAccountPayload) => Promise<void>
}

export function AccountProfileView({
  variant,
  title,
  subtitle,
  data,
  loading,
  error,
  onRetry,
  onSavePersonalInfo,
}: Readonly<AccountProfileViewProps>) {
  const isAdmin = variant === 'admin'

  if (loading) {
    return (
      <Container size="md" px={0}>
        <Stack gap="lg" aria-busy="true">
          <VisuallyHidden role="status">
            Đang tải thông tin tài khoản...
          </VisuallyHidden>
          <Stack gap={6}>
            <Skeleton height={30} width={220} radius="sm" />
            <Skeleton height={16} width={340} radius="sm" />
          </Stack>
          <Skeleton height={96} radius="md" />
          <Skeleton height={38} width={280} radius="sm" />
          <Skeleton height={220} radius="md" />
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="md" px={0} py="md">
        <Alert
          color="danger"
          variant="light"
          role="alert"
          title="Không thể tải thông tin tài khoản"
          icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
        >
          <Stack gap="sm" align="flex-start">
            <Text size="sm">{error}</Text>
            {onRetry ? (
              <Button
                type="button"
                variant="light"
                color="danger"
                size="xs"
                onClick={onRetry}
              >
                Thử lại
              </Button>
            ) : null}
          </Stack>
        </Alert>
      </Container>
    )
  }

  const fullName = [data?.lastname, data?.firstname].filter(Boolean).join(' ')
  const initial = (
    data?.firstname?.[0] ||
    data?.email?.[0] ||
    (isAdmin ? 'A' : 'U')
  ).toUpperCase()

  return (
    <Container size="md" px={0}>
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={1} size="h2">
            {title}
          </Title>
          <Text size="sm" c="dimmed">
            {subtitle}
          </Text>
        </Stack>

        <Paper withBorder radius="md" p="lg">
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="md" wrap="nowrap">
              <Avatar color="brand" radius="xl" size="lg">
                {initial}
              </Avatar>
              <Stack gap={4}>
                <Group gap="xs" wrap="wrap">
                  <Title order={2} size="h4">
                    {fullName || data?.email}
                  </Title>
                  <Badge color={isAdmin ? 'brand' : 'neutral'} variant="light">
                    {isAdmin ? 'Quản trị viên' : 'Ứng viên'}
                  </Badge>
                </Group>
                <Group gap={6} wrap="nowrap">
                  <IconMail size={14} stroke={1.5} aria-hidden="true" />
                  <Text size="sm" c="dimmed">
                    {data?.email}
                  </Text>
                </Group>
              </Stack>
            </Group>

            {isAdmin ? (
              <Badge
                color="brand"
                variant="outline"
                size="lg"
                leftSection={
                  <IconShieldCheck size={14} stroke={1.5} aria-hidden="true" />
                }
              >
                Toàn quyền hệ thống
              </Badge>
            ) : (
              <Button
                component={Link}
                href="/resume"
                variant="light"
                color="brand"
                size="sm"
                leftSection={
                  <IconFileText size={16} stroke={1.5} aria-hidden="true" />
                }
                rightSection={
                  <IconArrowRight size={14} stroke={1.5} aria-hidden="true" />
                }
              >
                Xem hồ sơ CV
              </Button>
            )}
          </Group>
        </Paper>

        <Tabs defaultValue="general" variant="outline">
          <Tabs.List>
            <Tabs.Tab
              value="general"
              leftSection={
                <IconUser size={16} stroke={1.5} aria-hidden="true" />
              }
            >
              Thông tin chung
            </Tabs.Tab>
            <Tabs.Tab
              value="security"
              leftSection={
                <IconLock size={16} stroke={1.5} aria-hidden="true" />
              }
            >
              Bảo mật
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general" pt="md">
            <Stack gap="md">
              <PersonalInfoGroup
                data={{
                  firstname: data?.firstname ?? undefined,
                  lastname: data?.lastname ?? undefined,
                }}
                onSave={onSavePersonalInfo}
              />

              <AccountInfoGroup
                email={data?.email}
                role={data?.role || variant}
                status={data?.status || 'active'}
                createdAt={data?.createdAt}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="security" pt="md">
            <ChangePasswordGroup />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  )
}
