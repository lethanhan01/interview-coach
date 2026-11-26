import { render, screen, userEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { ColorSchemeToggle } from './ColorSchemeToggle'

describe('ColorSchemeToggle', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-mantine-color-scheme')
    window.localStorage.clear()
  })

  it('renders an accessible toggle button and switches color scheme on click', async () => {
    const user = userEvent.setup()
    render(<ColorSchemeToggle />)

    const button = screen.getByRole('button', {
      name: 'Chuyển đổi chế độ sáng tối',
    })
    expect(button).toBeInTheDocument()

    await user.click(button)
    expect(document.documentElement).toHaveAttribute(
      'data-mantine-color-scheme',
      'dark'
    )

    await user.click(button)
    expect(document.documentElement).toHaveAttribute(
      'data-mantine-color-scheme',
      'light'
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ColorSchemeToggle />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
