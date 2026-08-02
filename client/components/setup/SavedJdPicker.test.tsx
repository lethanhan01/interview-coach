import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SavedJdPicker from './SavedJdPicker'
import type { SavedJobDescription } from '@/lib/types'

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
    techStack: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux'],
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
  it('renders the "Thêm JD mới" button', () => {
    render(<SavedJdPicker items={[]} onSelect={vi.fn()} onNew={vi.fn()} />)
    expect(screen.getByText('Thêm JD mới')).toBeInTheDocument()
  })

  it('renders a list of saved JDs', () => {
    render(
      <SavedJdPicker items={MOCK_JDS} onSelect={vi.fn()} onNew={vi.fn()} />
    )
    expect(screen.getByText('FPT Software')).toBeInTheDocument()
    expect(screen.getByText('Shopee Vietnam')).toBeInTheDocument()
  })

  it('shows the correct JD count in the divider', () => {
    render(
      <SavedJdPicker items={MOCK_JDS} onSelect={vi.fn()} onNew={vi.fn()} />
    )
    expect(screen.getByText(`JD đã lưu (${MOCK_JDS.length})`)).toBeInTheDocument()
  })

  it('shows max 4 tech badges and an overflow badge', () => {
    render(
      <SavedJdPicker items={MOCK_JDS} onSelect={vi.fn()} onNew={vi.fn()} />
    )
    // Item 1 has 5 techs: shows 4 + "+1"
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('calls onNew when the "Thêm JD mới" button is clicked', () => {
    const onNew = vi.fn()
    render(<SavedJdPicker items={[]} onSelect={vi.fn()} onNew={onNew} />)
    fireEvent.click(screen.getByText('Thêm JD mới'))
    expect(onNew).toHaveBeenCalledTimes(1)
  })

  it('calls onSelect with the correct item when a JD card is clicked', () => {
    const onSelect = vi.fn()
    render(
      <SavedJdPicker items={MOCK_JDS} onSelect={onSelect} onNew={vi.fn()} />
    )
    fireEvent.click(screen.getByText('FPT Software'))
    expect(onSelect).toHaveBeenCalledWith(MOCK_JDS[0])
  })

  it('renders heading and subtitle', () => {
    render(<SavedJdPicker items={[]} onSelect={vi.fn()} onNew={vi.fn()} />)
    expect(
      screen.getByRole('heading', { name: 'Chọn Job Description' })
    ).toBeInTheDocument()
  })

  it('displays job title and position below company name', () => {
    render(
      <SavedJdPicker items={MOCK_JDS} onSelect={vi.fn()} onNew={vi.fn()} />
    )
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('Backend Developer')).toBeInTheDocument()
  })
})
