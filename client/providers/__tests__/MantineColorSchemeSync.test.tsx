import { render, screen, userEvent, waitFor } from '@test-utils'
import { MantineColorSchemeSync } from '../MantineColorSchemeSync'
import { ColorSchemeToggle } from '@/components/layout/ColorSchemeToggle'

describe('MantineColorSchemeSync', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-mantine-color-scheme')
    window.localStorage.clear()
  })

  it('syncs the .dark class on documentElement when Mantine color scheme changes', async () => {
    const user = userEvent.setup()
    render(
      <>
        <MantineColorSchemeSync />
        <ColorSchemeToggle />
      </>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(false)

    const toggleBtn = screen.getByRole('button', {
      name: 'Chuyển đổi chế độ sáng tối',
    })
    await user.click(toggleBtn)

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    await user.click(toggleBtn)

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })
})
