import { describe, expect, it } from 'vitest'
import { render, screen } from '@test-utils'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'

describe('PasswordStrengthMeter', () => {
  it('shows empty state with 0% progress when password is empty', () => {
    render(<PasswordStrengthMeter password="" />)
    expect(screen.getByText('Chưa nhập mật khẩu')).toBeInTheDocument()
    const progress = screen.getByRole('progressbar', {
      name: 'Độ mạnh mật khẩu',
    })
    expect(progress).toHaveAttribute('aria-valuenow', '0')
  })

  it('shows weak state (25%) when only one criterion is satisfied', () => {
    render(<PasswordStrengthMeter password="abc" />)
    expect(screen.getByText('Yếu')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: 'Độ mạnh mật khẩu' })
    ).toHaveAttribute('aria-valuenow', '25')
  })

  it('shows medium state (50% / 75%) as criteria are met', () => {
    render(<PasswordStrengthMeter password="Abc123" />)
    expect(screen.getByText('Trung bình')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: 'Độ mạnh mật khẩu' })
    ).toHaveAttribute('aria-valuenow', '75')
  })

  it('shows strong state (100%) when all 4 criteria are met', () => {
    render(<PasswordStrengthMeter password="StrongPass123!" />)
    expect(screen.getByText('Mạnh')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: 'Độ mạnh mật khẩu' })
    ).toHaveAttribute('aria-valuenow', '100')
  })
})
