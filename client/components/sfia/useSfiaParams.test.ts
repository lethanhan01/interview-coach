import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSfiaParams } from './useSfiaParams'

const mockPush = vi.fn()
const mockReplace = vi.fn()
let mockSearchParams = new URLSearchParams()
let mockPathname = '/admin/sfia'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}))

describe('useSfiaParams (URL Deep Linking & State Synchronization)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    mockPathname = '/admin/sfia'
  })

  it('1. returns default values when no search params are provided', () => {
    const { result } = renderHook(() => useSfiaParams())

    expect(result.current.activeTab).toBe('taxonomy')
    expect(result.current.selectedSkill).toBe('PROG')
    expect(result.current.selectedLevel).toBe(3)
    expect(result.current.selectedCategory).toBeNull()
    expect(result.current.attrView).toBe('level')
  })

  it('2. parses deep link: ?tab=taxonomy&skill=SWDN&level=5', () => {
    mockSearchParams = new URLSearchParams('tab=taxonomy&skill=SWDN&level=5')
    const { result } = renderHook(() => useSfiaParams())

    expect(result.current.activeTab).toBe('taxonomy')
    expect(result.current.selectedSkill).toBe('SWDN')
    expect(result.current.selectedLevel).toBe(5)
  })

  it('3. parses deep link: ?tab=matrix&category=DEV_IMPL', () => {
    mockSearchParams = new URLSearchParams('tab=matrix&category=DEV_IMPL')
    const { result } = renderHook(() => useSfiaParams())

    expect(result.current.activeTab).toBe('matrix')
    expect(result.current.selectedCategory).toBe('DEV_IMPL')
  })

  it('4. parses deep link: ?tab=attributes&level=4&attrView=matrix', () => {
    mockSearchParams = new URLSearchParams('tab=attributes&level=4&attrView=matrix')
    const { result } = renderHook(() => useSfiaParams())

    expect(result.current.activeTab).toBe('attributes')
    expect(result.current.selectedLevel).toBe(4)
    expect(result.current.attrView).toBe('matrix')
  })

  it('5. parses deep link: ?tab=analytics', () => {
    mockSearchParams = new URLSearchParams('tab=analytics')
    const { result } = renderHook(() => useSfiaParams())

    expect(result.current.activeTab).toBe('analytics')
  })

  it('6. clamps invalid level to DEFAULT_SFIA_LEVEL (3)', () => {
    mockSearchParams = new URLSearchParams('level=99')
    const { result } = renderHook(() => useSfiaParams())
    expect(result.current.selectedLevel).toBe(3)

    mockSearchParams = new URLSearchParams('level=abc')
    const { result: invalidResult } = renderHook(() => useSfiaParams())
    expect(invalidResult.current.selectedLevel).toBe(3)
  })

  it('7. updates URL when setTab is called', () => {
    const { result } = renderHook(() => useSfiaParams())

    act(() => {
      result.current.setTab('matrix')
    })

    expect(mockReplace).toHaveBeenCalledWith('/admin/sfia?tab=matrix', { scroll: false })
  })

  it('8. updates URL when setSkill is called with level', () => {
    const { result } = renderHook(() => useSfiaParams())

    act(() => {
      result.current.setSkill('DBDS', 4)
    })

    expect(mockReplace).toHaveBeenCalledWith('/admin/sfia?skill=DBDS&level=4', { scroll: false })
  })

  it('9. updates URL when setCategory is called with categoryCode and clear with null', () => {
    const { result } = renderHook(() => useSfiaParams())

    act(() => {
      result.current.setCategory('STRAT_ARCH')
    })
    expect(mockReplace).toHaveBeenCalledWith('/admin/sfia?category=STRAT_ARCH', { scroll: false })

    mockSearchParams = new URLSearchParams('category=STRAT_ARCH')
    const { result: filledResult } = renderHook(() => useSfiaParams())

    act(() => {
      filledResult.current.setCategory(null)
    })
    expect(mockReplace).toHaveBeenCalledWith('/admin/sfia', { scroll: false })
  })

  it('10. updates URL when setAttrView is called', () => {
    const { result } = renderHook(() => useSfiaParams())

    act(() => {
      result.current.setAttrView('matrix')
    })
    expect(mockReplace).toHaveBeenCalledWith('/admin/sfia?attrView=matrix', { scroll: false })
  })
})
