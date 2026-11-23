import { render, screen } from '@test-utils'
import UnauthenticatedPage from './page'

describe('UnauthenticatedPage', () => {
  it('preserves safe internal next path in login href', async () => {
    const element = await UnauthenticatedPage({
      searchParams: Promise.resolve({ next: '/resume?tab=skills' }),
    })
    render(element)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Bạn chưa đăng nhập' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute(
      'href',
      '/login?next=%2Fresume%3Ftab%3Dskills'
    )
  })

  it('sanitizes unsafe external next parameter back to /sessions', async () => {
    const element = await UnauthenticatedPage({
      searchParams: Promise.resolve({ next: 'https://evil.example/phish' }),
    })
    render(element)

    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute(
      'href',
      '/login?next=%2Fsessions'
    )
  })
})
