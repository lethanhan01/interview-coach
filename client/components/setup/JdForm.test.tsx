import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import JdForm from './JdForm'
import { EMPTY_JD } from '@/lib/setup-types'
import type { JdFormData } from '@/lib/setup-types'

describe('JdForm', () => {
  it('renders all section headings', () => {
    render(<JdForm value={EMPTY_JD} onChange={vi.fn()} />)
    expect(screen.getByText('Thông tin công ty')).toBeInTheDocument()
    expect(screen.getByText('Vị trí tuyển dụng')).toBeInTheDocument()
    expect(screen.getByText('Nội dung & Yêu cầu')).toBeInTheDocument()
    expect(screen.getByText('Phúc lợi & Lương')).toBeInTheDocument()
  })

  it('renders company name input and calls onChange', () => {
    const onChange = vi.fn()
    render(<JdForm value={EMPTY_JD} onChange={onChange} />)
    const companyInput = screen.getByPlaceholderText('VD: FPT Software, Shopee...')
    fireEvent.change(companyInput, { target: { value: 'Shopee' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ company: 'Shopee' })
    )
  })

  it('renders website input and calls onChange', () => {
    const onChange = vi.fn()
    render(<JdForm value={EMPTY_JD} onChange={onChange} />)
    const websiteInput = screen.getByPlaceholderText('https://company.com')
    fireEvent.change(websiteInput, { target: { value: 'https://shopee.vn' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ website: 'https://shopee.vn' })
    )
  })

  it('renders requirements textarea and calls onChange', () => {
    const onChange = vi.fn()
    render(<JdForm value={EMPTY_JD} onChange={onChange} />)
    const reqTextarea = screen.getByPlaceholderText(
      'Liệt kê yêu cầu về kinh nghiệm, kỹ năng, bằng cấp...'
    )
    fireEvent.change(reqTextarea, { target: { value: 'Yêu cầu mới' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ requirements: 'Yêu cầu mới' })
    )
  })

  it('shows hint when requirements text is > 0 but < 30 chars', () => {
    const shortValue: JdFormData = { ...EMPTY_JD, requirements: 'Ngắn' }
    render(<JdForm value={shortValue} onChange={vi.fn()} />)
    expect(screen.getByText('Tối thiểu 30 ký tự')).toBeInTheDocument()
  })

  it('does not show hint when requirements is empty', () => {
    render(<JdForm value={EMPTY_JD} onChange={vi.fn()} />)
    expect(screen.queryByText('Tối thiểu 30 ký tự')).not.toBeInTheDocument()
  })

  it('does not show hint when requirements is >= 30 chars', () => {
    const longValue: JdFormData = {
      ...EMPTY_JD,
      requirements: 'Đây là một yêu cầu đủ dài để vượt qua 30 ký tự',
    }
    render(<JdForm value={longValue} onChange={vi.fn()} />)
    expect(screen.queryByText('Tối thiểu 30 ký tự')).not.toBeInTheDocument()
  })

  it('renders tech stack search and selected tags', () => {
    const valueWithTechs: JdFormData = {
      ...EMPTY_JD,
      techStack: ['React', 'TypeScript'],
    }
    render(<JdForm value={valueWithTechs} onChange={vi.fn()} />)
    expect(screen.getByText('Đã chọn (2)')).toBeInTheDocument()
    // React tag appears in both selected chips and the grid
    const reactElements = screen.getAllByText('React')
    expect(reactElements.length).toBeGreaterThanOrEqual(1)
  })

  it('removes a tech when clicking the X button on its chip', () => {
    const onChange = vi.fn()
    const valueWithTechs: JdFormData = {
      ...EMPTY_JD,
      techStack: ['React', 'TypeScript'],
    }
    render(<JdForm value={valueWithTechs} onChange={onChange} />)
    const removeReactBtn = screen.getByRole('button', { name: 'Bỏ chọn React' })
    fireEvent.click(removeReactBtn)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ techStack: ['TypeScript'] })
    )
  })

  it('filters tech stack options based on search query', () => {
    render(<JdForm value={EMPTY_JD} onChange={vi.fn()} />)
    const searchInput = screen.getByPlaceholderText(
      'VD: PyTorch, Terraform, Playwright...'
    )
    fireEvent.change(searchInput, { target: { value: 'pytorch' } })
    expect(screen.getByText('PyTorch')).toBeInTheDocument()
    // Unrelated tech should not be visible
    expect(screen.queryByText('React')).not.toBeInTheDocument()
  })

  it('renders position select with options', () => {
    render(<JdForm value={EMPTY_JD} onChange={vi.fn()} />)
    expect(screen.getByRole('combobox', { name: 'Vị trí' })).toBeInTheDocument()
  })

  it('renders salary input and calls onChange', () => {
    const onChange = vi.fn()
    render(<JdForm value={EMPTY_JD} onChange={onChange} />)
    const salaryInput = screen.getByPlaceholderText('VD: 15-25 triệu VNĐ')
    fireEvent.change(salaryInput, { target: { value: '20-30 triệu' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ salary: '20-30 triệu' })
    )
  })
})
