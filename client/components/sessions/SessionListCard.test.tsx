import { createTestQueryClient, render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { catalogService } from '@/services/catalog.service'
import {
  CATALOG_INTERVIEW_OPTIONS_FIXTURE,
  seedCatalogQuery,
} from '@/test-utils/fixtures/catalog.fixture'
import type { Session } from '@/types'
import SessionListCard from './SessionListCard'

vi.mock('@/services/catalog.service', () => ({
  catalogService: {
    getInterviewOptions: vi.fn(),
  },
}))

const MOCK_SESSION: Session = {
  id: 'sess-1',
  userId: 'user-1',
  jobTitle: 'Senior Backend Engineer',
  jobDescription: 'Tên công ty: Acme Corp\nBuild APIs',
  sessionType: 'technical',
  contextPackId: 'VN',
  status: 'completed',
  durationMin: 60,
  numQuestions: 30,
  overallScore: 84,
  createdAt: '2026-04-10T09:00:00.000Z',
}

describe('SessionListCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(catalogService.getInterviewOptions).mockResolvedValue(
      CATALOG_INTERVIEW_OPTIONS_FIXTURE
    )
  })

  it('renders session type label from backend catalog and passes jest-axe', async () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const { container } = render(<SessionListCard session={MOCK_SESSION} />, {
      queryClient,
    })

    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.getByText('84/100')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  }, 15_000)

  it('falls back gracefully to raw sessionType while catalog is pending', () => {
    vi.mocked(catalogService.getInterviewOptions).mockImplementation(
      () => new Promise(() => {})
    )

    render(<SessionListCard session={{ ...MOCK_SESSION, sessionType: 'hr' }} />)

    expect(screen.getByText('hr')).toBeInTheDocument()
  })
})
