import { axe } from 'jest-axe'
import { render, screen, userEvent } from '@test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { SfiaLevelResponsibility, SfiaSkillDefinition } from '@/types'
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
      3: 'Designs and writes moderately complex code.',
      4: 'Designs and writes complex programs.',
    },
  },
]

const mockLevels: SfiaLevelResponsibility[] = [
  {
    levelId: 2,
    name: 'Assist',
    nameVi: 'Hỗ trợ',
    essence: 'Assist',
    description: 'Works under routine direction.',
  },
  {
    levelId: 3,
    name: 'Apply',
    nameVi: 'Áp dụng',
    essence: 'Apply',
    description: 'Works under general direction.',
  },
  {
    levelId: 4,
    name: 'Enable',
    nameVi: 'Tự chủ',
    essence: 'Enable',
    description: 'Works under general direction within clear framework.',
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
        levels={mockLevels}
        onAddMapping={vi.fn()}
      />
    )

    expect(
      screen.getByRole('heading', { name: 'Thêm Ánh Xạ Kỹ Năng SFIA Mới' })
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Chọn một kỹ năng từ thư viện SFIA 9...')
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Cấp độ mục tiêu/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Trọng số đánh giá/i)).toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()

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
        levels={mockLevels}
        onAddMapping={onAdd}
      />
    )

    const skillSelect = screen.getByPlaceholderText(
      'Chọn một kỹ năng từ thư viện SFIA 9...'
    )
    await user.click(skillSelect)
    const option = await screen.findByRole('option', {
      name: /Programming\/software development/i,
    })
    await user.click(option)

    await user.click(screen.getByRole('button', { name: 'Thêm ánh xạ' }))

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        skillCode: 'PROG',
        targetLevel: 3,
        weight: 1,
        isCore: true,
      })
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('rejects empty targetLevel and weight without coercing to 0', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(undefined)

    render(
      <OnetSfiaAddModal
        opened={true}
        onClose={vi.fn()}
        availableSkills={mockSkills}
        currentMappings={[]}
        levels={mockLevels}
        onAddMapping={onAdd}
      />
    )

    await user.click(
      screen.getByPlaceholderText('Chọn một kỹ năng từ thư viện SFIA 9...')
    )
    await user.click(
      await screen.findByRole('option', {
        name: /Programming\/software development/i,
      })
    )

    const levelInput = screen.getByLabelText(/Cấp độ mục tiêu/i)
    const weightInput = screen.getByLabelText(/Trọng số đánh giá/i)
    await user.clear(levelInput)
    await user.clear(weightInput)

    await user.click(screen.getByRole('button', { name: 'Thêm ánh xạ' }))

    expect(
      await screen.findByText('Vui lòng chọn cấp độ SFIA')
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Vui lòng nhập trọng số')
    ).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('rejects out-of-range targetLevel for the selected skill', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(undefined)

    render(
      <OnetSfiaAddModal
        opened={true}
        onClose={vi.fn()}
        availableSkills={mockSkills}
        currentMappings={[]}
        levels={mockLevels}
        onAddMapping={onAdd}
      />
    )

    await user.click(
      screen.getByPlaceholderText('Chọn một kỹ năng từ thư viện SFIA 9...')
    )
    await user.click(
      await screen.findByRole('option', {
        name: /Programming\/software development/i,
      })
    )

    const levelInput = screen.getByLabelText(/Cấp độ mục tiêu/i)
    await user.clear(levelInput)
    await user.type(levelInput, '7')

    await user.click(screen.getByRole('button', { name: 'Thêm ánh xạ' }))

    expect(
      await screen.findByText('Cấp độ tối đa cho kỹ năng này là L6')
    ).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('updates levelDescriptions preview live when changing targetLevel', async () => {
    const user = userEvent.setup()

    render(
      <OnetSfiaAddModal
        opened={true}
        onClose={vi.fn()}
        availableSkills={mockSkills}
        currentMappings={[]}
        levels={mockLevels}
        onAddMapping={vi.fn()}
      />
    )

    await user.click(
      screen.getByPlaceholderText('Chọn một kỹ năng từ thư viện SFIA 9...')
    )
    await user.click(
      await screen.findByRole('option', {
        name: /Programming\/software development/i,
      })
    )

    expect(
      screen.getByText('Designs and writes moderately complex code.')
    ).toBeInTheDocument()

    const levelInput = screen.getByLabelText(/Cấp độ mục tiêu/i)
    await user.clear(levelInput)
    await user.type(levelInput, '4')

    expect(
      await screen.findByText('Designs and writes complex programs.')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Mô tả hành vi cấp độ L4 — Tự chủ/i)
    ).toBeInTheDocument()
  })

  it('displays server error Alert and locks modal actions while pending', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onAdd = vi
      .fn()
      .mockRejectedValueOnce(new Error('Kỹ năng đã tồn tại trong nghề này'))

    const { rerender } = render(
      <OnetSfiaAddModal
        opened={true}
        onClose={onClose}
        availableSkills={mockSkills}
        currentMappings={[]}
        levels={mockLevels}
        onAddMapping={onAdd}
        isPending={false}
      />
    )

    await user.click(
      screen.getByPlaceholderText('Chọn một kỹ năng từ thư viện SFIA 9...')
    )
    await user.click(
      await screen.findByRole('option', {
        name: /Programming\/software development/i,
      })
    )
    await user.click(screen.getByRole('button', { name: 'Thêm ánh xạ' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Kỹ năng đã tồn tại trong nghề này'
    )
    expect(onClose).not.toHaveBeenCalled()

    rerender(
      <OnetSfiaAddModal
        opened={true}
        onClose={onClose}
        availableSkills={mockSkills}
        currentMappings={[]}
        levels={mockLevels}
        onAddMapping={onAdd}
        isPending={true}
      />
    )

    expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })
})
