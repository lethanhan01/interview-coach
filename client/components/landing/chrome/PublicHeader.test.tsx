import { render, screen, userEvent, within } from '@test-utils'
import { axe } from 'jest-axe'
import { PublicHeader } from './PublicHeader'

describe('PublicHeader', () => {
  it('renders brand link, color scheme toggle, auth links, and mobile drawer', async () => {
    const user = userEvent.setup()
    render(<PublicHeader />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Intervia — Trang chủ' })
    ).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute(
      'href',
      '/login'
    )
    expect(
      screen.getByRole('link', { name: 'Bắt đầu miễn phí' })
    ).toHaveAttribute('href', '/register')

    await user.click(screen.getByRole('button', { name: 'Mở menu điều hướng' }))

    const dialog = await within(document.body).findByRole('dialog')
    expect(
      within(dialog).getByRole('link', { name: 'Bắt đầu miễn phí' })
    ).toHaveAttribute('href', '/register')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<PublicHeader />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
