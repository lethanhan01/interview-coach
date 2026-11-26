import { notifications } from '@mantine/notifications'
import { axe } from 'jest-axe'
import {
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
} from '@test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/queries/keys'
import { onetAdminService } from '@/services/onet-admin.service'
import { sfiaAdminService } from '@/services/sfia-admin.service'
import type {
  OnetSfiaMapping,
  SfiaLevelResponsibility,
  SfiaSkillDefinition,
} from '@/types'
import { OnetSfiaTab } from './OnetSfiaTab'

vi.mock('@/services/onet-admin.service', () => ({
  onetAdminService: {
    getSfiaLibrary: vi.fn(),
    updateSfiaMapping: vi.fn(),
    createSfiaMapping: vi.fn(),
    deleteSfiaMapping: vi.fn(),
    resetSfiaMappings: vi.fn(),
  },
}))

vi.mock('@/services/sfia-admin.service', () => ({
  sfiaAdminService: {
    getResponsibilityLevels: vi.fn(),
  },
}))

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
    description: 'Works under general direction within a clear framework.',
  },
  {
    levelId: 5,
    name: 'Ensure, advise',
    nameVi: 'Đảm bảo & Tư vấn',
    essence: 'Ensure, advise',
    description: 'Works under broad direction.',
  },
  {
    levelId: 6,
    name: 'Initiate, influence',
    nameVi: 'Khởi xướng & Ảnh hưởng',
    essence: 'Initiate, influence',
    description: 'Has defined authority and accountability.',
  },
]

const mockLibrary: SfiaSkillDefinition[] = [
  {
    code: 'PROG',
    name: 'Programming/software development',
    category: 'Development and implementation',
    description: 'Developing software components.',
    minLevel: 2,
    maxLevel: 6,
    levelDescriptions: {
      4: 'Designs, codes, verifies, tests, documents, amends and refactors complex programs.',
    },
  },
  {
    code: 'DBDS',
    name: 'Database design',
    category: 'Development and implementation',
    description: 'Designing relational and distributed databases.',
    minLevel: 2,
    maxLevel: 5,
    levelDescriptions: {
      3: 'Develops specialist database designs.',
    },
  },
]

const mockMappings: OnetSfiaMapping[] = [
  {
    id: 'map-1',
    skillCode: 'PROG',
    skillName: 'Programming/software development',
    category: 'Development and implementation',
    targetLevel: 4,
    minLevel: 2,
    maxLevel: 6,
    weight: 1.5,
    isCore: true,
    source: 'ONET_CROSSWALK',
  },
]

function setupQueryClient() {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(queryKeys.onetAdmin.sfiaLibrary(), mockLibrary)
  queryClient.setQueryData(queryKeys.sfiaAdmin.levels(), mockLevels)
  queryClient.setQueryData(queryKeys.onetAdmin.majorGroups(), [])
  return queryClient
}

describe('OnetSfiaTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(onetAdminService.getSfiaLibrary).mockResolvedValue(mockLibrary)
    vi.mocked(sfiaAdminService.getResponsibilityLevels).mockResolvedValue(
      mockLevels
    )
  })

  it('passes accessibility checks and loads seeded SFIA library & levels without extra fetches', async () => {
    const queryClient = setupQueryClient()
    const { container } = render(
      <OnetSfiaTab
        socCode="15-1252.00"
        occupationTitle="Software Developers"
        mappings={mockMappings}
      />,
      { queryClient }
    )

    expect(onetAdminService.getSfiaLibrary).not.toHaveBeenCalled()
    expect(sfiaAdminService.getResponsibilityLevels).not.toHaveBeenCalled()
    expect(screen.getByText('Tự chủ')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('edits a mapping inline via OnetSfiaRowEditor with single level select and weight validation', async () => {
    const user = userEvent.setup()
    const queryClient = setupQueryClient()
    const onUpdateMappings = vi.fn()
    const notifySpy = vi.spyOn(notifications, 'show')

    vi.mocked(onetAdminService.updateSfiaMapping).mockResolvedValueOnce({
      ...mockMappings[0],
      weight: 2.5,
    })

    render(
      <OnetSfiaTab
        socCode="15-1252.00"
        occupationTitle="Software Developers"
        mappings={mockMappings}
        onUpdateMappings={onUpdateMappings}
      />,
      { queryClient }
    )

    await user.click(
      screen.getByRole('button', { name: 'Chỉnh sửa ánh xạ này' })
    )

    // Skill code & name remain visible during inline editing
    expect(screen.getAllByText('PROG').length).toBeGreaterThan(0)
    expect(
      screen.getByText('Programming/software development')
    ).toBeInTheDocument()

    // Only a single level Select exists in the editor row, and the row has 7 aligned cells
    const levelSelects = screen.getAllByRole('combobox', {
      name: /cấp độ mục tiêu/i,
    })
    expect(levelSelects).toHaveLength(1)
    const editingRow = levelSelects[0].closest('tr')
    expect(editingRow?.querySelectorAll('td')).toHaveLength(7)

    const weightInput = screen.getByLabelText('Chỉnh sửa trọng số đánh giá')
    const saveButton = screen.getByRole('button', {
      name: 'Lưu thay đổi ánh xạ',
    })

    // Clearing weight disables Save instead of snapping back to 1.0
    await user.clear(weightInput)
    expect(saveButton).toBeDisabled()

    await user.type(weightInput, '2.5')
    expect(saveButton).toBeEnabled()
    await user.click(saveButton)

    await waitFor(() => {
      expect(onetAdminService.updateSfiaMapping).toHaveBeenCalledWith(
        '15-1252.00',
        'map-1',
        expect.objectContaining({
          targetLevel: 4,
          weight: 2.5,
          isCore: true,
        })
      )
      expect(onUpdateMappings).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'map-1', weight: 2.5 }),
      ])
    })

    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'success',
        title: 'Đã cập nhật ánh xạ SFIA',
      })
    )
  })

  it('deletes mapping while excluding sfia-library from query invalidation', async () => {
    const user = userEvent.setup()
    const queryClient = setupQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const onUpdateMappings = vi.fn()

    vi.mocked(onetAdminService.deleteSfiaMapping).mockResolvedValueOnce({
      success: true,
      message: 'Deleted',
    })

    render(
      <OnetSfiaTab
        socCode="15-1252.00"
        occupationTitle="Software Developers"
        mappings={mockMappings}
        onUpdateMappings={onUpdateMappings}
      />,
      { queryClient }
    )

    await user.click(screen.getByRole('button', { name: 'Xóa ánh xạ này' }))
    await user.click(
      await screen.findByRole('button', { name: /Xác nhận xóa/i })
    )

    await waitFor(() => {
      expect(onetAdminService.deleteSfiaMapping).toHaveBeenCalledWith(
        '15-1252.00',
        'map-1'
      )
      expect(onUpdateMappings).toHaveBeenCalledWith([])
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: queryKeys.onetAdmin.all,
        predicate: expect.any(Function),
      })
    )

    const invalidationArg = invalidateSpy.mock.calls[0]?.[0]
    const predicate = invalidationArg?.predicate as
      ((q: { queryKey: readonly unknown[] }) => boolean) | undefined
    expect(predicate?.({ queryKey: queryKeys.onetAdmin.sfiaLibrary() })).toBe(
      false
    )
    expect(predicate?.({ queryKey: queryKeys.onetAdmin.majorGroups() })).toBe(
      true
    )
    expect(
      predicate?.({ queryKey: queryKeys.onetAdmin.detail('15-1252.00') })
    ).toBe(true)
  })

  it('resets mappings via mutation and calls onUpdateMappings with restored data', async () => {
    const user = userEvent.setup()
    const queryClient = setupQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const onUpdateMappings = vi.fn()

    vi.mocked(onetAdminService.resetSfiaMappings).mockResolvedValueOnce(
      mockMappings
    )

    render(
      <OnetSfiaTab
        socCode="15-1252.00"
        occupationTitle="Software Developers"
        mappings={mockMappings}
        onUpdateMappings={onUpdateMappings}
      />,
      { queryClient }
    )

    await user.click(screen.getByRole('button', { name: /Khôi phục Mẫu/i }))
    await user.click(
      await screen.findByRole('button', { name: /Xác nhận khôi phục/i })
    )

    await waitFor(() => {
      expect(onetAdminService.resetSfiaMappings).toHaveBeenCalledWith(
        '15-1252.00'
      )
      expect(onUpdateMappings).toHaveBeenCalledWith(mockMappings)
      expect(invalidateSpy).toHaveBeenCalled()
    })
  })
})
