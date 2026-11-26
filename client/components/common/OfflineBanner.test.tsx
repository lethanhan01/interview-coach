import { useNetwork } from '@mantine/hooks'
import { render, screen, userEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { vi } from 'vitest'
import { OfflineBanner } from './OfflineBanner'

vi.mock('@mantine/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mantine/hooks')>()
  return {
    ...actual,
    useNetwork: vi.fn(() => ({ online: true })),
  }
})

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when network is online', () => {
    vi.mocked(useNetwork).mockReturnValue({ online: true })
    render(<OfflineBanner />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders assertive offline alert and triggers retry handler when offline', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    vi.mocked(useNetwork).mockReturnValue({ online: false })

    render(<OfflineBanner onRetry={onRetry} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'assertive')
    expect(
      screen.getByRole('heading', { name: 'Mất kết nối mạng' })
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('has no accessibility violations when visible', async () => {
    vi.mocked(useNetwork).mockReturnValue({ online: false })
    const { container } = render(<OfflineBanner onRetry={vi.fn()} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
