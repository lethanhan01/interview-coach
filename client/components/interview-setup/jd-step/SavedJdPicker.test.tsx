import { createTestQueryClient, render, screen, userEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { seedCatalogQuery } from '@/test-utils/fixtures/catalog.fixture'
import type { SavedJobDescription } from '@/types'
import SavedJdPicker from './SavedJdPicker'

const MOCK_JDS: SavedJobDescription[] = [
  {
    id: '1',
    userId: 'user-1',
    companyName: 'FPT Software',
    companyWebsite: 'https://fpt-software.com',
    jobTitle: 'Frontend Developer',
    level: 'junior',
    headcount: '2',
    location: 'Hà Nội',
    requirements: 'Tốt nghiệp CNTT, thành thạo React, TypeScript.',
    jobContent: 'Phát triển UI cho các sản phẩm nội bộ.',
    techStack: ['React', 'TypeScript', 'Next.js', 'Mantine', 'Redux'],
    benefits: null,
    salary: '15-22 triệu',
    bonus: null,
    lastUsedAt: '2026-07-30T00:00:00.000Z',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
  },
  {
    id: '2',
    userId: 'user-1',
    companyName: 'Shopee Vietnam',
    companyWebsite: null,
    jobTitle: 'Backend Developer',
    level: 'senior',
    headcount: null,
    location: 'TP. Hồ Chí Minh',
    requirements: 'Tối thiểu 3 năm kinh nghiệm backend.',
    jobContent: 'Thiết kế API cho hệ thống thương mại điện tử.',
    techStack: ['Node.js', 'NestJS', 'PostgreSQL'],
    benefits: null,
    salary: null,
    bonus: null,
    lastUsedAt: null,
    createdAt: '2026-07-07T00:00:00.000Z',
    updatedAt: '2026-07-07T00:00:00.000Z',
  },
]

describe('SavedJdPicker', () => {
  it('renders heading, new JD action, divider count, and saved JD cards', async () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)
    const { container } = render(
      <SavedJdPicker items={MOCK_JDS} onSelect={vi.fn()} onNew={vi.fn()} />,
      { queryClient }
    )

    expect(
      screen.getByRole('heading', { name: 'Chọn Job Description' })
    ).toBeInTheDocument()
    expect(screen.getByText('Thêm JD mới')).toBeInTheDocument()
    expect(screen.getByText('JD đã lưu (2)')).toBeInTheDocument()
    expect(screen.getByText('FPT Software')).toBeInTheDocument()
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('Shopee Vietnam')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('calls onNew and onSelect on semantic button clicks', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)
    const onNew = vi.fn()
    const onSelect = vi.fn()

    render(
      <SavedJdPicker items={MOCK_JDS} onSelect={onSelect} onNew={onNew} />,
      { queryClient }
    )

    await user.click(screen.getByRole('button', { name: /Thêm JD mới/i }))
    expect(onNew).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /FPT Software/i }))
    expect(onSelect).toHaveBeenCalledWith(MOCK_JDS[0])
  })
})
