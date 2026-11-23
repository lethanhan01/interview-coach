# Catalog 7 Nhóm Giao Diện Mẫu: Mantine UI v9 (`ui.mantine.dev`) + TanStack Query v5 (`client/`)

Tài liệu này cung cấp **7 nhóm Full-Stack UI Templates** được chuyển đổi theo quy trình 4 bước Zero-Hex bắt buộc từ [`https://ui.mantine.dev/`](https://ui.mantine.dev/) và [`https://mantine.dev/`](https://mantine.dev/), kết nối sẵn với **TanStack Query v5 (`useQuery`, `useMutation`, `queryKeys`, `keepPreviousData`)** và **`@mantine/form` (`mode: 'uncontrolled'`) + Zod v4**.

> **Mục đích sử dụng:** Dùng làm bản thiết kế chuẩn (Reference Blueprints) khi xây dựng tính năng mới hoặc nâng cấp giao diện các màn hình trong `client/app/` và `client/components/`.

---

## MỤC LỤC

1. [Nhóm 1 — Workspace AppShell, Navbar & UserMenu (`AppShell` + `queryClient.clear()`)](#1-nhóm-1-workspace-appshell-navbar-usermenu-appshell-queryclientclear)
2. [Nhóm 2 — Authentication & Password Strength (`@mantine/form` + `useMutation`)](#2-nhóm-2-authentication-password-strength-mantineform-usemutation)
3. [Nhóm 3 — Candidate Dashboard, StatsGrid & SessionCard (`useQuery` + `Skeleton`)](#3-nhóm-3-candidate-dashboard-statsgrid-sessioncard-usequery-skeleton)
4. [Nhóm 4 — Multi-Step Interview Setup Wizard (`Stepper` + `Dropzone` + O\*NET Search)](#4-nhóm-4-multi-step-interview-setup-wizard-stepper-dropzone-onet-search)
5. [Nhóm 5 — Live Interview Split-View & STAR Competency Report (`RingProgress` + `Accordion`)](#5-nhóm-5-live-interview-split-view-star-competency-report-ringprogress-accordion)
6. [Nhóm 6 — Admin Master-Detail & Server-Paginated Table (`Table.ScrollContainer` + `Drawer`)](#6-nhóm-6-admin-master-detail-server-paginated-table-tablescrollcontainer-drawer)
7. [Nhóm 7 — Public Hero Landing & System Status / Offline Banner (`useNetwork`)](#7-nhóm-7-public-hero-landing-system-status-offline-banner-usenetwork)

---

## 1. Nhóm 1 — Workspace AppShell, Navbar & UserMenu (`AppShell` + `queryClient.clear()`)

Tham chiếu [`ui.mantine.dev/category/navbars/`](https://ui.mantine.dev/category/navbars/) và [`mantine.dev/core/app-shell/`](https://mantine.dev/core/app-shell/). Tích hợp điều hướng `<NavLink component={Link}>`, chuyển đổi chế độ sáng/tối, và hủy sạch bộ nhớ đệm `queryClient.clear()` khi đăng xuất (`SEC-010`).

```tsx
'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ActionIcon,
  AppShell,
  Avatar,
  Burger,
  Group,
  Menu,
  NavLink,
  Stack,
  Text,
  Title,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBriefcase,
  IconFileText,
  IconLogout,
  IconMessages,
  IconMoon,
  IconSun,
  IconUser,
} from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

const CANDIDATE_NAV_ITEMS = [
  {
    href: '/sessions',
    label: 'Phiên phỏng vấn',
    icon: IconMessages,
  },
  {
    href: '/setup',
    label: 'Thiết lập phỏng vấn',
    icon: IconBriefcase,
  },
  {
    href: '/jd-library',
    label: 'Thư viện JD',
    icon: IconFileText,
  },
  {
    href: '/profile',
    label: 'Hồ sơ cá nhân',
    icon: IconUser,
  },
] as const

export interface WorkspaceShellProps {
  userName: string
  userEmail: string
  onLoggedOut: () => void
  children: ReactNode
}

export function CandidateWorkspaceShell({
  userName,
  userEmail,
  onLoggedOut,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname()
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure(false)
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const queryClient = useQueryClient()

  const logoutMutation = useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSettled: () => {
      queryClient.clear()
      onLoggedOut()
    },
  })

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
              aria-label="Mở menu điều hướng"
            />
            <Title order={1} size="h4">
              InterviewCoach
            </Title>
          </Group>

          <Group gap="sm">
            <ActionIcon
              variant="default"
              size="lg"
              onClick={toggleColorScheme}
              aria-label="Chuyển đổi giao diện sáng tối"
            >
              {colorScheme === 'dark' ? (
                <IconSun size={18} stroke={1.5} aria-hidden="true" />
              ) : (
                <IconMoon size={18} stroke={1.5} aria-hidden="true" />
              )}
            </ActionIcon>

            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <UnstyledButton aria-label="Mở menu tài khoản">
                  <Group gap="xs">
                    <Avatar color="brand" radius="xl" name={userName} />
                    <Stack gap={0} visibleFrom="xs">
                      <Text size="sm" fw={600}>
                        {userName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {userEmail}
                      </Text>
                    </Stack>
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Tài khoản ứng viên</Menu.Label>
                <Menu.Item
                  component={Link}
                  href="/profile"
                  leftSection={
                    <IconUser size={16} stroke={1.5} aria-hidden="true" />
                  }
                >
                  Hồ sơ cá nhân
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="danger"
                  leftSection={
                    <IconLogout size={16} stroke={1.5} aria-hidden="true" />
                  }
                  onClick={() => logoutMutation.mutate()}
                >
                  Đăng xuất
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack gap="xs">
          {CANDIDATE_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <NavLink
                key={item.href}
                component={Link}
                href={item.href}
                label={item.label}
                active={isActive}
                color="brand"
                onClick={closeMobile}
                leftSection={<Icon size={18} stroke={1.5} aria-hidden="true" />}
              />
            )
          })}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}
```

---

## 2. Nhóm 2 — Authentication & Password Strength (`@mantine/form` + `useMutation`)

Tham chiếu [`ui.mantine.dev/category/authentication/`](https://ui.mantine.dev/category/authentication/) và [`ui.mantine.dev/category/inputs/`](https://ui.mantine.dev/category/inputs/). Kết hợp `@mantine/form` (`uncontrolled`) + Zod v4, thanh đo độ mạnh mật khẩu `<Progress>`, và `useMutation` tự động gán lỗi server vào `form.setErrors`.

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Alert,
  Anchor,
  Box,
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  Progress,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient, ApiClientError } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'

const registerFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Họ và tên cần tối thiểu 2 ký tự'),
  email: z.string().trim().email('Địa chỉ email không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .regex(/[A-Z]/, 'Cần ít nhất 1 chữ cái viết hoa')
    .regex(/[0-9]/, 'Cần ít nhất 1 chữ số'),
})

type RegisterFormValues = z.infer<typeof registerFormSchema>

function calculatePasswordStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score += 34
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 33
  if (/[0-9]/.test(password)) score += 33
  return score
}

export function AuthenticationRegisterCard({
  onRegistered,
}: {
  onRegistered: () => void
}) {
  const queryClient = useQueryClient()
  const [passwordStrength, setPasswordStrength] = useState(0)

  const form = useForm<RegisterFormValues>({
    mode: 'uncontrolled',
    initialValues: {
      fullName: '',
      email: '',
      password: '',
    },
    validate: schemaResolver(registerFormSchema, { sync: true }),
  })

  form.watch('password', ({ value }) => {
    setPasswordStrength(calculatePasswordStrength(value))
  })

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterFormValues) =>
      apiClient.post('/auth/register', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      onRegistered()
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.details) {
        const mapped: Record<string, string> = {}
        for (const [key, messages] of Object.entries(err.details)) {
          if (messages.length > 0) mapped[key] = messages[0]
        }
        form.setErrors(mapped)
      }
    },
  })

  const strengthColor =
    passwordStrength === 100
      ? 'success'
      : passwordStrength >= 60
        ? 'warning'
        : 'danger'

  return (
    <Container size={440} py="xl">
      <Stack gap="md">
        <Stack gap={4} align="center">
          <Title order={1} size="h2" ta="center">
            Tạo tài khoản InterviewCoach
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Đã có tài khoản?{' '}
            <Anchor component={Link} href="/login" size="sm" c="brand">
              Đăng nhập ngay
            </Anchor>
          </Text>
        </Stack>

        <Paper withBorder shadow="sm" p="xl" radius="md">
          <Box
            component="form"
            onSubmit={form.onSubmit((values) =>
              registerMutation.mutate(values)
            )}
            noValidate
          >
            <Stack gap="md">
              {registerMutation.isError ? (
                <Alert
                  color="danger"
                  variant="light"
                  title="Đăng ký không thành công"
                  icon={
                    <IconAlertCircle
                      size={18}
                      stroke={1.5}
                      aria-hidden="true"
                    />
                  }
                >
                  {registerMutation.error instanceof Error
                    ? registerMutation.error.message
                    : 'Vui lòng kiểm tra lại thông tin đăng ký.'}
                </Alert>
              ) : null}

              <TextInput
                withAsterisk
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                key={form.key('fullName')}
                {...form.getInputProps('fullName')}
              />

              <TextInput
                withAsterisk
                type="email"
                label="Email công việc"
                placeholder="ungvien@example.com"
                key={form.key('email')}
                {...form.getInputProps('email')}
              />

              <Stack gap="xs">
                <PasswordInput
                  withAsterisk
                  label="Mật khẩu"
                  placeholder="Tối thiểu 8 ký tự, gồm chữ hoa và số"
                  key={form.key('password')}
                  {...form.getInputProps('password')}
                />
                <Progress
                  value={passwordStrength}
                  color={strengthColor}
                  size="sm"
                  radius="xl"
                  aria-label="Độ mạnh mật khẩu"
                />
                <Group gap={6}>
                  <IconCheck size={14} stroke={1.5} aria-hidden="true" />
                  <Text size="xs" c="dimmed">
                    Kết hợp chữ hoa, chữ thường và chữ số để bảo mật tối đa.
                  </Text>
                </Group>
              </Stack>

              <Button
                type="submit"
                color="brand"
                fullWidth
                mt="xs"
                loading={registerMutation.isPending}
              >
                Đăng ký tài khoản
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Stack>
    </Container>
  )
}
```

---

## 3. Nhóm 3 — Candidate Dashboard, StatsGrid & SessionCard (`useQuery` + `Skeleton`)

Tham chiếu [`ui.mantine.dev/category/stats/`](https://ui.mantine.dev/category/stats/) và [`ui.mantine.dev/category/cards/`](https://ui.mantine.dev/category/cards/). Sử dụng `<UnstyledButton mod={{ active }}>` bọc `<Paper withBorder>` cho thẻ phiên phỏng vấn, kết hợp `useQuery` (`queryKeys.sessions.list()`) và bộ lọc `<SegmentedControl>`.

```tsx
'use client'

import { useState } from 'react'
import {
  Badge,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'
import classes from './CandidateSessionsDashboard.module.css'

export interface CandidateSessionDto {
  id: string
  roleTitle: string
  companyName: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  overallScore: number | null
}

export function CandidateSessionsDashboard({
  selectedId,
  onSelectSession,
}: {
  selectedId: string | null
  onSelectSession: (id: string) => void
}) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [keyword, setKeyword] = useState('')

  const { data: sessions = [], isPending } = useQuery({
    queryKey: queryKeys.sessions.list(),
    queryFn: async () => {
      const res = await apiClient.get<{ sessions: CandidateSessionDto[] }>(
        '/sessions'
      )
      return res.sessions ?? []
    },
  })

  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length
  const activeCount = sessions.filter((s) => s.status === 'IN_PROGRESS').length

  const filteredSessions = sessions.filter((session) => {
    const matchesStatus =
      statusFilter === 'ALL' || session.status === statusFilter
    const matchesKeyword =
      !keyword.trim() ||
      session.roleTitle.toLowerCase().includes(keyword.trim().toLowerCase()) ||
      session.companyName.toLowerCase().includes(keyword.trim().toLowerCase())
    return matchesStatus && matchesKeyword
  })

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Paper withBorder p="md" radius="md">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Tổng số phiên
          </Text>
          <Title order={2} size="h2" mt="xs">
            {sessions.length}
          </Title>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Đang diễn ra
          </Text>
          <Title order={2} size="h2" mt="xs">
            {activeCount}
          </Title>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Đã hoàn thành
          </Text>
          <Title order={2} size="h2" mt="xs">
            {completedCount}
          </Title>
        </Paper>
      </SimpleGrid>

      <Group justify="space-between" wrap="wrap" gap="sm">
        <TextInput
          placeholder="Tìm theo vị trí hoặc công ty..."
          value={keyword}
          onChange={(e) => setKeyword(e.currentTarget.value)}
          leftSection={<IconSearch size={16} stroke={1.5} aria-hidden="true" />}
        />
        <SegmentedControl
          value={statusFilter}
          onChange={setStatusFilter}
          data={[
            { label: 'Tất cả', value: 'ALL' },
            { label: 'Đang mở', value: 'IN_PROGRESS' },
            { label: 'Hoàn tất', value: 'COMPLETED' },
          ]}
        />
      </Group>

      {isPending ? (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Skeleton height={110} radius="md" />
          <Skeleton height={110} radius="md" />
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {filteredSessions.map((session) => (
            <UnstyledButton
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={classes.cardTrigger}
              mod={{ active: selectedId === session.id }}
              w="100%"
            >
              <Paper withBorder p="md" radius="md" className={classes.cardBody}>
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4}>
                    <Title order={3} size="h5">
                      {session.roleTitle}
                    </Title>
                    <Text size="sm" c="dimmed">
                      {session.companyName}
                    </Text>
                  </Stack>
                  <Badge
                    color={
                      session.status === 'COMPLETED'
                        ? 'success'
                        : session.status === 'IN_PROGRESS'
                          ? 'brand'
                          : 'neutral'
                    }
                    variant="light"
                  >
                    {session.status}
                  </Badge>
                </Group>
              </Paper>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  )
}
```

```css
/* CandidateSessionsDashboard.module.css */
.cardTrigger {
  display: block;
  text-align: start;
  border-radius: var(--mantine-radius-md);

  &:focus-visible {
    outline: rem(2px) solid var(--mantine-primary-color-filled);
    outline-offset: rem(2px);
  }
}

.cardBody {
  background-color: light-dark(
    var(--mantine-color-gray-0),
    var(--mantine-color-dark-6)
  );
  transition: border-color 150ms ease;

  @mixin hover {
    background-color: var(--mantine-color-default-hover);
  }

  .cardTrigger[data-active] & {
    background-color: var(--mantine-primary-color-light);
    border-color: var(--mantine-primary-color-filled);
  }
}
```

---

## 4. Nhóm 4 — Multi-Step Interview Setup Wizard (`Stepper` + `Dropzone` + O\*NET Search)

Tham chiếu [`mantine.dev/core/stepper/`](https://mantine.dev/core/stepper/) và [`mantine.dev/x/dropzone/`](https://mantine.dev/x/dropzone/). Đặt `pointer-events: none` cho nội dung bên trong `<Dropzone>` thông qua class `.dropzoneInner` trong CSS Module (tuân thủ `SEM-TOKEN-003` cấm `style={{}}`).

```tsx
'use client'

import { useState } from 'react'
import {
  Button,
  Group,
  Loader,
  Paper,
  Radio,
  Select,
  Stack,
  Stepper,
  Text,
  Title,
} from '@mantine/core'
import { Dropzone, PDF_MIME_TYPE } from '@mantine/dropzone'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconFileCheck, IconUpload, IconX } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'
import classes from './InterviewSetupWizard.module.css'

interface OnetOption {
  socCode: string
  title: string
}

export function InterviewSetupWizard({
  onSessionCreated,
}: {
  onSessionCreated: (sessionId: string) => void
}) {
  const queryClient = useQueryClient()
  const [activeStep, setActiveStep] = useState(0)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [socCode, setSocCode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch] = useDebouncedValue(searchQuery.trim(), 300)
  const [interviewMode, setInterviewMode] = useState<'TECHNICAL' | 'HR'>(
    'TECHNICAL'
  )

  const { data: onetList = [], isFetching: isSearchingOnet } = useQuery({
    queryKey: queryKeys.onet.search(debouncedSearch, 15),
    queryFn: ({ signal }) =>
      apiClient.get<OnetOption[]>(
        `/onet/occupations?q=${encodeURIComponent(debouncedSearch)}&limit=15`,
        { signal }
      ),
    staleTime: 60_000,
  })

  const createSessionMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ id: string }>('/sessions', {
        socCode,
        sessionType: interviewMode,
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.list(),
      })
      notifications.show({
        color: 'success',
        title: 'Khởi tạo phiên phỏng vấn thành công',
        message: 'Hệ thống đang chuẩn bị bộ câu hỏi thích ứng.',
      })
      onSessionCreated(created.id)
    },
  })

  return (
    <Paper withBorder p="xl" radius="md">
      <Stack gap="xl">
        <Title order={2} size="h3">
          Thiết lập phiên phỏng vấn mới
        </Title>

        <Stepper active={activeStep} onStepClick={setActiveStep} color="brand">
          <Stepper.Step label="Bước 1" description="Tải lên CV / JD">
            <Stack gap="md" mt="md">
              <Dropzone
                onDrop={(files) => {
                  if (files[0]) setSelectedFileName(files[0].name)
                }}
                maxSize={5 * 1024 * 1024}
                accept={PDF_MIME_TYPE}
              >
                <Group
                  justify="center"
                  gap="md"
                  mih={140}
                  className={classes.dropzoneInner}
                >
                  <Dropzone.Accept>
                    <IconUpload size={36} stroke={1.5} aria-hidden="true" />
                  </Dropzone.Accept>
                  <Dropzone.Reject>
                    <IconX size={36} stroke={1.5} aria-hidden="true" />
                  </Dropzone.Reject>
                  <Dropzone.Idle>
                    <IconFileCheck size={36} stroke={1.5} aria-hidden="true" />
                  </Dropzone.Idle>
                  <Stack gap={4}>
                    <Text size="md" fw={600}>
                      Kéo thả tệp CV PDF vào đây hoặc nhấn để chọn tệp
                    </Text>
                    <Text size="xs" c="dimmed">
                      Hỗ trợ định dạng PDF tối đa 5MB
                    </Text>
                  </Stack>
                </Group>
              </Dropzone>
              {selectedFileName ? (
                <Text size="sm" c="brand" fw={500}>
                  Đã chọn tệp: {selectedFileName}
                </Text>
              ) : null}
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Bước 2" description="Chọn nghề O*NET">
            <Stack gap="md" mt="md">
              <Select
                searchable
                label="Ngành nghề mục tiêu (O*NET-SOC)"
                placeholder="Tìm kiếm vị trí công việc..."
                value={socCode}
                onChange={setSocCode}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                data={onetList.map((o) => ({
                  value: o.socCode,
                  label: `${o.title} (${o.socCode})`,
                }))}
                rightSection={isSearchingOnet ? <Loader size="xs" /> : null}
              />
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Bước 3" description="Chế độ phỏng vấn">
            <Stack gap="md" mt="md">
              <Radio.Group
                value={interviewMode}
                onChange={(val) =>
                  setInterviewMode(val === 'HR' ? 'HR' : 'TECHNICAL')
                }
                name="interviewMode"
                label="Chọn trọng tâm đánh giá năng lực"
              >
                <Stack gap="sm" mt="xs">
                  <Radio
                    value="TECHNICAL"
                    label="Phỏng vấn Kỹ thuật chuyên sâu (SFIA 9 & O*NET Tech)"
                  />
                  <Radio
                    value="HR"
                    label="Phỏng vấn Hành vi theo mô hình STAR"
                  />
                </Stack>
              </Radio.Group>
            </Stack>
          </Stepper.Step>
        </Stepper>

        <Group justify="space-between">
          <Button
            variant="default"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
          >
            Quay lại
          </Button>

          {activeStep < 2 ? (
            <Button
              color="brand"
              onClick={() => setActiveStep((s) => Math.min(2, s + 1))}
            >
              Tiếp tục
            </Button>
          ) : (
            <Button
              color="brand"
              disabled={!socCode}
              loading={createSessionMutation.isPending}
              onClick={() => createSessionMutation.mutate()}
            >
              Bắt đầu phỏng vấn
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  )
}
```

```css
/* InterviewSetupWizard.module.css */
.dropzoneInner {
  pointer-events: none;
}
```

---

## 5. Nhóm 5 — Live Interview Split-View & STAR Competency Report (`RingProgress` + `Accordion`)

Tham chiếu [`ui.mantine.dev/category/stats/`](https://ui.mantine.dev/category/stats/) (`StatsRing`) và [`mantine.dev/core/accordion/`](https://mantine.dev/core/accordion/). Hiển thị báo cáo STAR với `<Grid>`, `<RingProgress>`, `<Timeline>`, và `<Accordion>` kết nối `queryKeys.sessions.report(sessionId)`.

```tsx
'use client'

import {
  Accordion,
  Badge,
  Center,
  Grid,
  Group,
  Paper,
  RingProgress,
  Skeleton,
  Stack,
  Text,
  Timeline,
  Title,
} from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'

export interface StarTurnEvaluation {
  turnIndex: number
  questionPrompt: string
  scorePercent: number
  situationFeedback: string
  actionFeedback: string
  resultFeedback: string
}

export interface SessionReportDto {
  sessionId: string
  overallScore: number
  readinessLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  turns: StarTurnEvaluation[]
}

export function StarCompetencyReportView({ sessionId }: { sessionId: string }) {
  const { data: report, isPending } = useQuery({
    queryKey: queryKeys.sessions.report(sessionId),
    queryFn: () =>
      apiClient.get<SessionReportDto>(
        `/sessions/${encodeURIComponent(sessionId)}/report`
      ),
  })

  if (isPending || !report) {
    return (
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Skeleton height={240} radius="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Skeleton height={240} radius="md" />
        </Grid.Col>
      </Grid>
    )
  }

  const ringColor =
    report.overallScore >= 80
      ? 'success'
      : report.overallScore >= 60
        ? 'warning'
        : 'danger'

  return (
    <Grid gutter="lg">
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper withBorder p="lg" radius="md">
          <Stack align="center" gap="md">
            <Title order={2} size="h4">
              Điểm Năng Lực Tổng Hợp
            </Title>
            <RingProgress
              size={160}
              thickness={14}
              roundCaps
              sections={[{ value: report.overallScore, color: ringColor }]}
              label={
                <Center>
                  <Text fw={700} size="xl">
                    {report.overallScore}%
                  </Text>
                </Center>
              }
            />
            <Badge color={ringColor} size="lg" variant="light">
              Mức độ sẵn sàng: {report.readinessLevel}
            </Badge>

            <Timeline
              active={report.turns.length}
              bulletSize={20}
              lineWidth={2}
            >
              {report.turns.map((turn) => (
                <Timeline.Item
                  key={turn.turnIndex}
                  title={`Câu hỏi #${turn.turnIndex}`}
                >
                  <Text size="xs" c="dimmed">
                    Điểm đạt: {turn.scorePercent}%
                  </Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Stack>
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 8 }}>
        <Paper withBorder p="lg" radius="md">
          <Stack gap="md">
            <Title order={2} size="h4">
              Phân Tích Chi Tiết Theo Khung STAR
            </Title>
            <Accordion variant="separated" radius="md">
              {report.turns.map((turn) => (
                <Accordion.Item
                  key={turn.turnIndex}
                  value={`turn-${turn.turnIndex}`}
                >
                  <Accordion.Control>
                    <Group justify="space-between" pr="sm">
                      <Text fw={600} size="sm">
                        Câu {turn.turnIndex}: {turn.questionPrompt}
                      </Text>
                      <Badge
                        color={
                          turn.scorePercent >= 80
                            ? 'success'
                            : turn.scorePercent >= 60
                              ? 'warning'
                              : 'danger'
                        }
                        variant="light"
                      >
                        {turn.scorePercent}%
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      <Text size="sm">
                        Bối cảnh (Situation & Task): {turn.situationFeedback}
                      </Text>
                      <Text size="sm">
                        Hành động (Action): {turn.actionFeedback}
                      </Text>
                      <Text size="sm">
                        Kết quả (Result): {turn.resultFeedback}
                      </Text>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Stack>
        </Paper>
      </Grid.Col>
    </Grid>
  )
}
```

---

## 6. Nhóm 6 — Admin Master-Detail & Server-Paginated Table (`Table.ScrollContainer` + `Drawer`)

Tham chiếu [`ui.mantine.dev/category/tables/`](https://ui.mantine.dev/category/tables/). Bọc bảng dữ liệu trong `<Table.ScrollContainer minWidth={720}>` (`MOB-005`), dùng `placeholderData: keepPreviousData` từ `@tanstack/react-query` để chuyển trang mượt không giật layout, và mở `<Drawer>` tra cứu chi tiết kỹ năng SFIA.

```tsx
'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  Drawer,
  Group,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconSearch } from '@tabler/icons-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'

export interface SfiaSkillSummaryRow {
  code: string
  name: string
  categoryName: string
  minLevel: number
  maxLevel: number
}

export interface PaginatedSfiaSkillsResponse {
  items: SfiaSkillSummaryRow[]
  totalPages: number
}

export function AdminSfiaSkillsMasterDetail() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300)
  const [inspectedSkill, setInspectedSkill] =
    useState<SfiaSkillSummaryRow | null>(null)

  const filters = { page, limit: 15, search: debouncedSearch }

  const { data, isPending } = useQuery({
    queryKey: queryKeys.sfiaAdmin.skills(filters),
    queryFn: ({ signal }) => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: '15',
        search: debouncedSearch,
      })
      return apiClient.get<PaginatedSfiaSkillsResponse>(
        `/admin/sfia/skills?${qs.toString()}`,
        { signal }
      )
    },
    placeholderData: keepPreviousData,
  })

  return (
    <Paper withBorder p="lg" radius="md">
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap">
          <Title order={2} size="h4">
            Danh Mục Kỹ Năng SFIA 9
          </Title>
          <TextInput
            placeholder="Tìm mã hoặc tên kỹ năng..."
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value)
              setPage(1)
            }}
            leftSection={
              <IconSearch size={16} stroke={1.5} aria-hidden="true" />
            }
          />
        </Group>

        {isPending ? (
          <Skeleton height={280} radius="md" />
        ) : (
          <Table.ScrollContainer minWidth={720}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Mã SFIA</Table.Th>
                  <Table.Th>Tên kỹ năng</Table.Th>
                  <Table.Th>Nhóm chuyên môn</Table.Th>
                  <Table.Th>Dải cấp độ</Table.Th>
                  <Table.Th>Thao tác</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(data?.items ?? []).map((skill) => (
                  <Table.Tr key={skill.code}>
                    <Table.Td>
                      <Badge color="brand" variant="light">
                        {skill.code}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600}>
                        {skill.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {skill.categoryName}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="neutral" variant="outline">
                        Level {skill.minLevel} - {skill.maxLevel}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="light"
                        color="brand"
                        onClick={() => setInspectedSkill(skill)}
                      >
                        Chi tiết
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}

        <Group justify="flex-end">
          <Pagination
            total={data?.totalPages ?? 1}
            value={page}
            onChange={setPage}
            color="brand"
          />
        </Group>
      </Stack>

      <Drawer
        opened={inspectedSkill !== null}
        onClose={() => setInspectedSkill(null)}
        title={
          inspectedSkill
            ? `${inspectedSkill.code} — ${inspectedSkill.name}`
            : 'Chi tiết kỹ năng SFIA'
        }
        position="right"
        size="md"
      >
        {inspectedSkill ? (
          <Stack gap="sm">
            <Badge color="brand" variant="light" size="lg">
              {inspectedSkill.categoryName}
            </Badge>
            <Text size="sm">
              Dải cấp độ trách nhiệm: Level {inspectedSkill.minLevel} đến Level{' '}
              {inspectedSkill.maxLevel}.
            </Text>
          </Stack>
        ) : null}
      </Drawer>
    </Paper>
  )
}
```

---

## 7. Nhóm 7 — Public Hero Landing & System Status / Offline Banner (`useNetwork`)

Tham chiếu [`ui.mantine.dev/category/hero/`](https://ui.mantine.dev/category/hero/) và [`mantine.dev/hooks/use-network/`](https://mantine.dev/hooks/use-network/). Kết hợp Hero Section, Features Grid và cảnh báo ngoại tuyến tự động kích hoạt `queryClient.invalidateQueries()` khi có mạng trở lại.

```tsx
'use client'

import Link from 'next/link'
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { useNetwork } from '@mantine/hooks'
import {
  IconBrain,
  IconChartBar,
  IconMicrophone,
  IconRefresh,
  IconWifiOff,
} from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'

const CORE_FEATURES = [
  {
    title: 'Chuẩn năng lực SFIA 9 & O*NET',
    description:
      'Khớp chính xác yêu cầu kỹ năng theo khung năng lực CNTT quốc tế SFIA 9 và danh mục nghề O*NET.',
    icon: IconBrain,
  },
  {
    title: 'Phỏng vấn giọng nói & văn bản',
    description:
      'Luyện tập trả lời trực tiếp với phản hồi tức thì và bộ đếm thời gian thực tế.',
    icon: IconMicrophone,
  },
  {
    title: 'Báo cáo STAR định lượng',
    description:
      'Đánh giá chi tiết từng lượt trả lời theo cấu trúc Situation - Task - Action - Result.',
    icon: IconChartBar,
  },
] as const

export function PublicLandingHeroWithOfflineGuard() {
  const network = useNetwork()
  const queryClient = useQueryClient()

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {!network.online ? (
          <Alert
            color="warning"
            variant="light"
            role="alert"
            title="Mất kết nối Internet"
            icon={<IconWifiOff size={18} stroke={1.5} aria-hidden="true" />}
          >
            <Group justify="space-between" align="center">
              <Text size="sm">
                Ứng dụng đang ở chế độ ngoại tuyến. Dữ liệu trong bộ nhớ đệm
                TanStack Query vẫn được giữ an toàn.
              </Text>
              <Button
                size="xs"
                color="brand"
                variant="light"
                leftSection={
                  <IconRefresh size={14} stroke={1.5} aria-hidden="true" />
                }
                onClick={() => {
                  void queryClient.invalidateQueries()
                }}
              >
                Đồng bộ lại
              </Button>
            </Group>
          </Alert>
        ) : null}

        <Stack align="center" gap="md" py="xl">
          <Badge color="brand" variant="light" size="lg">
            Nền Tảng Luyện Phỏng Vấn AI Chuẩn SFIA 9 & STAR
          </Badge>
          <Title order={1} ta="center">
            Chinh Phục Mọi Kỳ Phỏng Vấn Kỹ Thuật & Hành Vi
          </Title>
          <Text c="dimmed" size="lg" ta="center" maw={680}>
            Mô phỏng phỏng vấn sát thực tế theo JD mục tiêu, phân tích sâu bằng
            chứng năng lực và lộ trình cải thiện rõ ràng sau từng phiên.
          </Text>
          <Group gap="md" mt="xs">
            <Button component={Link} href="/setup" size="md" color="brand">
              Bắt đầu luyện tập
            </Button>
            <Button
              component={Link}
              href="/sessions"
              size="md"
              variant="default"
            >
              Xem lịch sử phiên
            </Button>
          </Group>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          {CORE_FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <Paper key={feature.title} withBorder p="lg" radius="md">
                <Stack gap="sm">
                  <ThemeIcon
                    color="brand"
                    variant="light"
                    size="lg"
                    radius="md"
                  >
                    <Icon size={20} stroke={1.5} aria-hidden="true" />
                  </ThemeIcon>
                  <Title order={2} size="h4">
                    {feature.title}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {feature.description}
                  </Text>
                </Stack>
              </Paper>
            )
          })}
        </SimpleGrid>
      </Stack>
    </Container>
  )
}
```
