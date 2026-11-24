import { render, screen, userEvent, waitFor, within } from '@test-utils'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { candidateProfileService } from '@/services/candidate-profile.service'
import type { GetProfileResponse } from '@/types'
import ResumeClient from './ResumeClient'

const mockReplace = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}))

vi.mock('@/services/candidate-profile.service', () => ({
  candidateProfileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}))

vi.mock('@/services/onet.service', () => ({
  onetService: {
    searchOccupations: vi.fn().mockResolvedValue([]),
    getOccupationTech: vi.fn().mockResolvedValue([]),
  },
}))

const MOCK_PROFILE: GetProfileResponse = {
  id: 'u1',
  email: 'candidate@example.com',
  profile: {
    targetPosition: 'Frontend Developer',
    targetLevel: 'middle',
    personality: 'analytical',
    education: {
      degree: 'engineer',
      school: 'HUST',
      major: 'CS',
      gpa: '3.5',
      graduationYear: '2024',
    },
    technicalSkills: [
      { id: 's1', category: 'language', name: 'TypeScript', usagePeriod: 24 },
    ],
    workExperience: [
      {
        id: '',
        company: 'Legacy Co',
        position: 'Developer',
        startDate: '2023-01',
        endDate: '2024-01',
        isCurrent: false,
        description: '',
        techStack: [],
      },
    ],
    projects: [],
    certifications: [],
    awards: [],
  },
}

describe('ResumeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    vi.mocked(candidateProfileService.getProfile).mockResolvedValue(
      MOCK_PROFILE
    )
  })

  it('loads profile, syncs ?section= URL param, and switches sections cleanly', async () => {
    const user = userEvent.setup()
    const { container } = render(<ResumeClient />)

    expect(
      await screen.findByRole('heading', { name: 'Hồ sơ CV & Kinh nghiệm' })
    ).toBeInTheDocument()
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    const nav = screen.getByRole('navigation', { name: 'Danh mục hồ sơ CV' })
    await user.click(within(nav).getByRole('button', { name: /Kinh nghiệm/i }))

    expect(mockReplace).toHaveBeenCalledWith('/resume?section=experience', {
      scroll: false,
    })
    expect(screen.getByText('Legacy Co')).toBeInTheDocument()
  })

  it('opens confirm modal when switching section with unsaved inline edits', async () => {
    const user = userEvent.setup()
    render(<ResumeClient />)

    await screen.findByText('Frontend Developer')
    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))
    await user.click(screen.getByRole('button', { name: 'Backend Developer' }))

    const nav = screen.getByRole('navigation', { name: 'Danh mục hồ sơ CV' })
    await user.click(within(nav).getByRole('button', { name: /Học vấn/i }))

    const confirmDialog = await within(document.body).findByRole('dialog')
    expect(confirmDialog).toHaveTextContent('Thay đổi chưa được lưu')

    await user.click(
      within(confirmDialog).getByRole('button', {
        name: 'Hủy thay đổi & chuyển mục',
      })
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/resume?section=education', {
        scroll: false,
      })
    })
    expect(screen.getByText('HUST')).toBeInTheDocument()
  })
})
