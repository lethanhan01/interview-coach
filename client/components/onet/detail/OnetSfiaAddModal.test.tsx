import { axe } from 'jest-axe'
import { render, screen, userEvent } from '@test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { SfiaSkillDefinition } from '@/types'
import { OnetSfiaAddModal } from './OnetSfiaAddModal'

const mockSkills: SfiaSkillDefinition[] = [
  {
    code: 'PROG',
    name: 'Programming/software development',
    category: 'Development',
    description: 'Developing software components.',
    minLevel: 2,
    maxLevel: 6,
    levelDescriptions: {
      2: 'Applies standard programming techniques.',
      4: 'Designs and writes complex programs.',
    },
  },
]

describe('OnetSfiaAddModal', () => {
  it('renders modal controls and passes accessibility', async () => {
    const { container } = render(
      <OnetSfiaAddModal
        opened={true}
        onClose={vi.fn()}
        availableSkills={mockSkills}
        currentMappings={[]}
        onAddMapping={vi.fn()}
      />
    )

    expect(
      screen.getByRole('heading', { name: 'Thêm Ánh Xạ Kỹ Năng SFIA Mới' })
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Chọn một kỹ năng từ thư viện SFIA 9...')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Cấp độ Mục tiêu/i)
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Trọng số Đánh giá/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('switch')
    ).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('submits mapping payload with valid values', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()

    render(
      <OnetSfiaAddModal
        opened={true}
        onClose={onClose}
        availableSkills={mockSkills}
        currentMappings={[]}
        onAddMapping={onAdd}
      />
    )

    // Select skill via placeholder
    const skillSelect = screen.getByPlaceholderText(
      'Chọn một kỹ năng từ thư viện SFIA 9...'
    )
    await user.click(skillSelect)
    const option = await screen.findByRole('option', {
      name: /Programming\/software development/i,
    })
    await user.click(option)

    // Submit form
    const submitBtn = screen.getByRole('button', { name: 'Thêm ánh xạ' })
    await user.click(submitBtn)

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        skillCode: 'PROG',
      })
    )
    expect(onClose).toHaveBeenCalled()
  })
})
