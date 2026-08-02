import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React, { useState } from 'react'
import {
  PageContainer,
  PageHeader,
  PageSection,
  AsyncBoundary,
  DataTable,
  Toolbar,
  FilterBar,
  SearchInput,
  Pagination,
  ConfirmDialog,
  ColumnDef,
} from '@/components/patterns'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Plus, Download, Edit, Trash, Settings } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'

const meta: Meta = {
  title: 'Patterns/Page',
  parameters: {
    layout: 'fullscreen',
  },
}
export default meta

type Story = StoryObj

// --- MOCK DATA ---
interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    email: 'a@example.com',
    role: 'Admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'Trần Thị B',
    email: 'b@example.com',
    role: 'User',
    status: 'active',
  },
  {
    id: '3',
    name: 'Lê Văn C',
    email: 'c@example.com',
    role: 'User',
    status: 'inactive',
  },
  {
    id: '4',
    name: 'Phạm Thị D',
    email: 'd@example.com',
    role: 'Manager',
    status: 'active',
  },
  {
    id: '5',
    name: 'Hoàng Văn E',
    email: 'e@example.com',
    role: 'User',
    status: 'inactive',
  },
]

interface Meeting {
  id: string
  title: string
  date: string
  participants: number
}

const mockMeetings: Meeting[] = [
  { id: '1', title: 'Phỏng vấn Frontend', date: '2026-08-03', participants: 3 },
  { id: '2', title: 'Họp team tuần', date: '2026-08-04', participants: 8 },
  { id: '3', title: 'Phỏng vấn Backend', date: '2026-08-05', participants: 2 },
]

// --- STORIES ---

export const UserListPage: Story = {
  render: () => {
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    const columns: ColumnDef<User>[] = [
      {
        key: 'name',
        title: 'Tên người dùng',
        render: (u) => <div className="text-ink font-medium">{u.name}</div>,
      },
      { key: 'email', title: 'Email', className: 'hidden md:flex' },
      { key: 'role', title: 'Vai trò' },
      {
        key: 'status',
        title: 'Trạng thái',
        render: (u) => (
          <Badge variant={u.status === 'active' ? 'default' : 'warning'}>
            {u.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        title: '',
        width: 'w-[100px]',
        render: (u) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-ink-muted h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-danger h-8 w-8"
              onClick={() => {
                setSelectedUser(u)
                setConfirmOpen(true)
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ]

    return (
      <PageContainer>
        <PageHeader
          title="Quản lý người dùng"
          description="Danh sách tất cả người dùng trong hệ thống"
          actions={
            <>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Xuất CSV
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Thêm mới
              </Button>
            </>
          }
        />

        <PageSection>
          <Toolbar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo tên hoặc email..."
              className="w-full md:w-80"
            />
            <FilterBar>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm khóa</SelectItem>
                </SelectContent>
              </Select>
            </FilterBar>
          </Toolbar>

          <AsyncBoundary isLoading={false} isError={false}>
            <DataTable
              columns={columns}
              data={mockUsers}
              keyExtractor={(u) => u.id}
            />
            <Pagination
              currentPage={page}
              totalPages={5}
              onPageChange={setPage}
            />
          </AsyncBoundary>
        </PageSection>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Xác nhận xóa"
          description={
            <span>
              Bạn có chắc muốn xóa người dùng{' '}
              <strong>{selectedUser?.name}</strong> không? Hành động này không
              thể hoàn tác.
            </span>
          }
          confirmText="Xóa"
          variant="destructive"
          onConfirm={() => console.log('Deleted', selectedUser?.id)}
        />
      </PageContainer>
    )
  },
}

export const MeetingListPage: Story = {
  render: () => {
    const columns: ColumnDef<Meeting>[] = [
      {
        key: 'title',
        title: 'Tên cuộc họp',
        render: (m) => <div className="font-semibold">{m.title}</div>,
      },
      { key: 'date', title: 'Ngày diễn ra' },
      { key: 'participants', title: 'Số người tham gia' },
      {
        key: 'actions',
        title: '',
        render: () => (
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" /> Cài đặt
          </Button>
        ),
      },
    ]

    return (
      <PageContainer maxWidth="lg">
        <PageHeader
          title="Lịch phỏng vấn"
          description="Quản lý các buổi phỏng vấn sắp tới"
        />
        <PageSection>
          <DataTable
            columns={columns}
            data={mockMeetings}
            keyExtractor={(m) => m.id}
          />
        </PageSection>
      </PageContainer>
    )
  },
}

export const EmptyPage: Story = {
  render: () => (
    <PageContainer>
      <PageHeader title="Lịch sử phỏng vấn" />
      <PageSection>
        <AsyncBoundary
          isLoading={false}
          isError={false}
          isEmpty={true}
          emptyTitle="Chưa có dữ liệu phỏng vấn"
          emptyDescription="Bạn chưa thực hiện bất kỳ buổi phỏng vấn nào. Hãy bắt đầu tạo một lịch phỏng vấn mới."
          emptyAction={{
            label: 'Tạo phỏng vấn ngay',
            onClick: () => alert('Tạo'),
          }}
        >
          {null}
        </AsyncBoundary>
      </PageSection>
    </PageContainer>
  ),
}

export const ErrorPage: Story = {
  render: () => (
    <PageContainer>
      <PageHeader title="Báo cáo phân tích" />
      <PageSection>
        <AsyncBoundary
          isLoading={false}
          isError={true}
          error={new Error('Không thể kết nối đến máy chủ phân tích dữ liệu.')}
          onRetry={() => alert('Đang thử kết nối lại...')}
        >
          {null}
        </AsyncBoundary>
      </PageSection>
    </PageContainer>
  ),
}

export const LoadingPage: Story = {
  render: () => (
    <PageContainer>
      <PageHeader title="Trang tổng quan" />
      <PageSection>
        <AsyncBoundary
          isLoading={true}
          isError={false}
          loadingText="Đang tải dữ liệu tổng quan..."
        >
          {null}
        </AsyncBoundary>
      </PageSection>
    </PageContainer>
  ),
}

export const MobilePage: Story = {
  ...UserListPage,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
