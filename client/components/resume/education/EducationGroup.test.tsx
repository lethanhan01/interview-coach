import {
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
} from '@test-utils'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { catalogService } from '@/services/catalog.service'
import {
  CATALOG_INTERVIEW_OPTIONS_FIXTURE,
  seedCatalogQuery,
} from '@/test-utils/fixtures/catalog.fixture'
import EducationGroup from './EducationGroup'

vi.mock('@/services/catalog.service', () => ({
  catalogService: {
    getInterviewOptions: vi.fn(),
  },
}))

describe('EducationGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(catalogService.getInterviewOptions).mockResolvedValue(
      CATALOG_INTERVIEW_OPTIONS_FIXTURE
    )
  })

  it('renders timeline view when education exists and passes jest-axe', async () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const { container } = render(
      <EducationGroup
        data={{
          degree: 'engineer',
          school: 'Đại học Bách Khoa Hà Nội',
          major: 'Khoa học máy tính',
          gpa: '3.6 / 4.0',
          graduationYear: '2025',
        }}
        onSave={vi.fn()}
      />,
      { queryClient }
    )

    expect(screen.getByText('Đại học Bách Khoa Hà Nội')).toBeInTheDocument()
    expect(
      screen.getByText(/Đại học \(Kỹ sư\) · Khoa học máy tính/i)
    ).toBeInTheDocument()
    expect(screen.getByText('Tốt nghiệp: 2025')).toBeInTheDocument()
    expect(screen.getByText('GPA: 3.6 / 4.0')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  }, 15_000)

  it('validates graduationYear with Zod and saves valid education', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const { container } = render(
      <EducationGroup data={null} onSave={onSave} />,
      { queryClient }
    )

    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))
    expect(await axe(container)).toHaveNoViolations()

    await user.type(screen.getByLabelText('Trường'), 'ĐH Công nghệ')
    await user.type(screen.getByLabelText('Năm tốt nghiệp'), '99')
    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }))

    expect(
      await screen.findByText(/Năm tốt nghiệp gồm 4 chữ số hợp lệ/i)
    ).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()

    const yearInput = screen.getByLabelText('Năm tốt nghiệp')
    await user.clear(yearInput)
    await user.type(yearInput, '2026')
    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          school: 'ĐH Công nghệ',
          graduationYear: '2026',
        })
      )
    })
  }, 15_000)

  it('preserves form values while catalog is pending', async () => {
    const user = userEvent.setup()
    vi.mocked(catalogService.getInterviewOptions).mockImplementation(
      () => new Promise(() => {})
    )

    render(
      <EducationGroup
        data={{
          degree: 'engineer',
          school: 'Đại học Bách Khoa Hà Nội',
          major: 'Khoa học máy tính',
          graduationYear: '2025',
        }}
        onSave={vi.fn()}
      />
    )

    expect(
      screen.getByText(/engineer · Khoa học máy tính/i)
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))
    expect(screen.getByLabelText('Trường')).toHaveValue(
      'Đại học Bách Khoa Hà Nội'
    )
    expect(screen.getByLabelText('Năm tốt nghiệp')).toHaveValue('2025')
  })

  it('shows danger Alert with retry on catalog error and recovers', async () => {
    const user = userEvent.setup()
    vi.mocked(catalogService.getInterviewOptions)
      .mockRejectedValueOnce(new Error('Catalog down'))
      .mockResolvedValueOnce(CATALOG_INTERVIEW_OPTIONS_FIXTURE)

    render(
      <EducationGroup
        data={{
          degree: 'engineer',
          school: 'HUST',
          major: 'CS',
        }}
        onSave={vi.fn()}
      />
    )

    expect(
      await screen.findByText('Không thể tải danh mục cấu hình')
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(
      await screen.findByText(/Đại học \(Kỹ sư\) · CS/i)
    ).toBeInTheDocument()
  })
})
