import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor } from '@test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OnetSfiaTab } from './OnetSfiaTab'
import { queryKeys } from '@/lib/query-client'
import { onetAdminService } from '@/services/onet-admin.service'
import type { OnetSfiaMapping, SfiaSkillDefinition } from '@/types'

vi.mock('@/services/onet-admin.service', () => ({
  onetAdminService: {
    getSfiaLibrary: vi.fn(),
    updateSfiaMapping: vi.fn(),
    createSfiaMapping: vi.fn(),
    deleteSfiaMapping: vi.fn(),
    resetSfiaMappings: vi.fn(),
  },
}))

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

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 60_000,
        gcTime: 60_000,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

describe('OnetSfiaTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(onetAdminService.getSfiaLibrary).mockResolvedValue(mockLibrary)
  })

  it('loads SFIA library via QueryClient and deletes mapping while excluding sfiaLibrary from invalidation', async () => {
    const queryClient = createTestClient()
    queryClient.setQueryData(queryKeys.onetAdmin.sfiaLibrary(), mockLibrary)
    queryClient.setQueryData(queryKeys.onetAdmin.majorGroups(), [])
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const onUpdateMappings = vi.fn()

    vi.mocked(onetAdminService.deleteSfiaMapping).mockResolvedValueOnce({
      success: true,
      message: 'Deleted',
    })

    render(
      <QueryClientProvider client={queryClient}>
        <OnetSfiaTab
          socCode="15-1252.00"
          occupationTitle="Software Developers"
          mappings={mockMappings}
          onUpdateMappings={onUpdateMappings}
        />
      </QueryClientProvider>
    )

    expect(onetAdminService.getSfiaLibrary).not.toHaveBeenCalled()

    const deleteTrigger = screen.getByRole('button', {
      name: 'Xóa ánh xạ này',
    })
    fireEvent.click(deleteTrigger)

    const confirmDelete = await screen.findByRole('button', {
      name: /Xác nhận xóa/i,
    })
    fireEvent.click(confirmDelete)

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
    const queryClient = createTestClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const onUpdateMappings = vi.fn()

    vi.mocked(onetAdminService.resetSfiaMappings).mockResolvedValueOnce(
      mockMappings
    )

    render(
      <QueryClientProvider client={queryClient}>
        <OnetSfiaTab
          socCode="15-1252.00"
          occupationTitle="Software Developers"
          mappings={mockMappings}
          onUpdateMappings={onUpdateMappings}
        />
      </QueryClientProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Khôi phục Mẫu/i }))
    const confirmReset = await screen.findByRole('button', {
      name: /Xác nhận khôi phục/i,
    })
    fireEvent.click(confirmReset)

    await waitFor(() => {
      expect(onetAdminService.resetSfiaMappings).toHaveBeenCalledWith(
        '15-1252.00'
      )
      expect(onUpdateMappings).toHaveBeenCalledWith(mockMappings)
      expect(invalidateSpy).toHaveBeenCalled()
    })
  })
})
