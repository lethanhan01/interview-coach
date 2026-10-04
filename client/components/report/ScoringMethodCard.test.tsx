import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ScoringMethodCard from './ScoringMethodCard'

describe('ScoringMethodCard', () => {
  it('renders correctly with session context and title', () => {
    render(<ScoringMethodCard contextPackId="VN" sessionType="technical" />)

    expect(
      screen.getByText('Phương Pháp Đánh Giá Chuẩn Hóa SFIA 9 & O*NET')
    ).toBeInTheDocument()

    expect(screen.getByText('Chuyên môn Kỹ thuật')).toBeInTheDocument()
    expect(screen.getByText('Bối cảnh: VN')).toBeInTheDocument()
  })

  it('renders the 3 evaluation methodology accordion items', () => {
    render(<ScoringMethodCard contextPackId="VN" sessionType="hr" />)

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
})
