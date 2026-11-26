import {
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
} from '@test-utils'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { catalogService } from '@/services/catalog.service'
import { seedCatalogQuery } from '@/test-utils/fixtures/catalog.fixture'
import ScoringMethodCard from './ScoringMethodCard'

describe('ScoringMethodCard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders correctly with seeded catalog session label and SFIA levels', async () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)
    const user = userEvent.setup()

    render(<ScoringMethodCard contextPackId="VN" sessionType="technical" />, {
      queryClient,
    })

    expect(
      screen.getByText('Phương Pháp Đánh Giá Chuẩn Hóa SFIA 9 & O*NET')
    ).toBeInTheDocument()
    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.getByText('Bối cảnh: VN')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: /2\. Thang Cấp Bậc Năng Lực Quốc Tế SFIA Version 9/i,
      })
    )

    expect(screen.getByText('Follow (Theo dõi & Học việc)')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Set strategy, inspire, mobilise (Chiến lược & Truyền cảm hứng)'
      )
    ).toBeInTheDocument()
  })

  it('renders the 3 evaluation methodology accordion items', () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    render(<ScoringMethodCard contextPackId="VN" sessionType="hr" />, {
      queryClient,
    })

    expect(screen.getByText('HR / Behavioral')).toBeInTheDocument()
    expect(
      screen.getByText(/1\. Tiêu Chí Đánh Giá Nhị Phân 2 Chiều/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/2\. Thang Cấp Bậc Năng Lực Quốc Tế SFIA Version 9/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/3\. Tính Điểm Tất Định 0-100% & Quy Tắc Bỏ Qua/i)
    ).toBeInTheDocument()
  })

  it('shows raw sessionType and loading skeleton while catalog is pending', async () => {
    vi.spyOn(catalogService, 'getInterviewOptions').mockImplementation(
      () => new Promise(() => {})
    )
    const user = userEvent.setup()

    render(<ScoringMethodCard contextPackId="VN" sessionType="technical" />)

    expect(screen.getByText('technical')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: /2\. Thang Cấp Bậc Năng Lực Quốc Tế SFIA Version 9/i,
      })
    )

    expect(
      screen.getByLabelText('Đang tải thang cấp độ SFIA')
    ).toBeInTheDocument()
  })

  it('shows error alert with retry and no mock fallback when catalog fails', async () => {
    const spy = vi
      .spyOn(catalogService, 'getInterviewOptions')
      .mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()

    render(<ScoringMethodCard contextPackId="VN" sessionType="technical" />)

    await user.click(
      screen.getByRole('button', {
        name: /2\. Thang Cấp Bậc Năng Lực Quốc Tế SFIA Version 9/i,
      })
    )

    await waitFor(() => {
      expect(
        screen.getByText('Không thể tải thang cấp độ SFIA')
      ).toBeInTheDocument()
    })
    expect(screen.queryByText(/Theo dõi & Học việc/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  it('has no accessibility violations', async () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const { container } = render(
      <ScoringMethodCard contextPackId="VN" sessionType="technical" />,
      { queryClient }
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
