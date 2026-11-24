import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EMPTY_JD } from '@/lib/setup-helpers'
import { onetService } from '@/services/onet.service'
import type { JdFormData } from '@/types'
import JdForm from './JdForm'

vi.mock('@/services/onet.service', () => ({
  onetService: {
    searchOccupations: vi.fn().mockResolvedValue([
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        description: 'Develop software',
      },
    ]),
    getOccupationTech: vi.fn().mockResolvedValue([
      { example: 'Docker', isHotTechnology: true, inDemand: true },
      { example: 'Kubernetes', isHotTechnology: true, inDemand: false },
    ]),
  },
}))

describe('JdForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all 4 section headings and passes jest-axe', async () => {
    const { container } = render(<JdForm value={EMPTY_JD} onChange={vi.fn()} />)
    expect(screen.getByText('Thông tin công ty')).toBeInTheDocument()
    expect(screen.getByText('Vị trí tuyển dụng')).toBeInTheDocument()
    expect(screen.getByText('Nội dung & Yêu cầu')).toBeInTheDocument()
    expect(screen.getByText('Phúc lợi & Lương')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  }, 15_000)

  it('updates text fields and shows 30-char hint for short requirements', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<JdForm value={EMPTY_JD} onChange={onChange} />)

    await user.type(
      screen.getByPlaceholderText('VD: FPT Software, Shopee...'),
      'Shopee'
    )
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ company: 'Shopee' })
    )

    const reqTextarea = screen.getByPlaceholderText(
      'Liệt kê yêu cầu về kinh nghiệm, kỹ năng, bằng cấp...'
    )
    await user.type(reqTextarea, 'Ngắn')
    expect(screen.getByText('Tối thiểu 30 ký tự')).toBeInTheDocument()
  }, 15_000)

  it('filters tech stack, supports adding custom tech, and removes selected tags', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const valueWithTechs: JdFormData = {
      ...EMPTY_JD,
      techStack: ['React', 'TypeScript'],
    }
    render(<JdForm value={valueWithTechs} onChange={onChange} />)

    expect(screen.getByText('Đã chọn (2)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Bỏ chọn React' }))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ techStack: ['TypeScript'] })
    )

    const searchInput = screen.getByPlaceholderText(
      'VD: PyTorch, Terraform, Playwright...'
    )
    await user.type(searchInput, 'PrismaORM')

    const addCustomBtn = screen.getByRole('button', {
      name: /Thêm “PrismaORM”|Thêm "PrismaORM"/i,
    })
    await user.click(addCustomBtn)

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ techStack: ['TypeScript', 'PrismaORM'] })
    )
  })

  it('searches O*NET occupation, populates position outside POSITION_OPTIONS, and fetches tech suggestions', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<JdForm value={EMPTY_JD} onChange={onChange} />)

    const onetInput = screen.getByRole('searchbox', {
      name: 'Tìm kiếm chức danh chuẩn O*NET',
    })
    await user.type(onetInput, 'Software')

    await waitFor(() => {
      expect(onetService.searchOccupations).toHaveBeenCalledWith(
        'Software',
        8,
        expect.any(AbortSignal)
      )
    })

    const option = await screen.findByRole('option', {
      name: /Software Developers/i,
    })
    await user.click(option)

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        onetSocCode: '15-1252.00',
        onetOccupationTitle: 'Software Developers',
        position: 'Software Developers',
        targetSfiaLevel: 3,
      })
    )

    await waitFor(() => {
      expect(onetService.getOccupationTech).toHaveBeenCalledWith(
        '15-1252.00',
        expect.any(AbortSignal)
      )
    })

    const dockerBtn = await screen.findByRole('button', { name: '+ Docker' })
    await user.click(dockerBtn)

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ techStack: ['Docker'] })
    )

    await user.click(
      screen.getByRole('button', { name: 'Bỏ chọn chức danh O*NET' })
    )
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        onetSocCode: undefined,
        onetOccupationTitle: undefined,
      })
    )
  }, 15_000)
})
