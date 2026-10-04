import { describe, it, expect, vi } from 'vitest'
import {
  generateSfiaAttributesProgressionCsvString,
  downloadSfiaAttributesProgressionCsv,
} from './sfia-attributes-export'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from './types'

describe('sfia-attributes-export utility', () => {
  const mockLevels: SfiaLevelResponsibility[] = [
    { levelId: 1, name: 'Follow', nameVi: 'Tuân thủ', essence: 'Giám sát trực tiếp.', description: 'Tác vụ cơ bản.' },
    { levelId: 2, name: 'Assist', nameVi: 'Hỗ trợ', essence: 'Hoạt động độc lập trong tác vụ quen.', description: 'Hỗ trợ đồng nghiệp.' },
    { levelId: 3, name: 'Apply', nameVi: 'Áp dụng', essence: 'Tự chủ công việc.', description: 'Chịu trách nhiệm đầu ra.' },
    { levelId: 4, name: 'Enable', nameVi: 'Chủ động', essence: 'Hướng dẫn người khác.', description: 'Phụ trách nhóm nhỏ.' },
    { levelId: 5, name: 'Ensure', nameVi: 'Đảm bảo', essence: 'Định hình kỹ thuật.', description: 'Cố vấn chuyên môn.' },
    { levelId: 6, name: 'Initiate', nameVi: 'Khởi xướng', essence: 'Chuyển đổi chiến lược.', description: 'Tiêu chuẩn toàn diện.' },
    { levelId: 7, name: 'Set strategy', nameVi: 'Chiến lược', essence: 'Tầm nhìn tối cao.', description: 'Cấp tập đoàn.' },
  ]

  const mockAttributes: SfiaGenericAttribute[] = [
    {
      code: 'AUTONOMY',
      name: 'Autonomy',
      nameVi: 'Mức độ tự chủ',
      description: 'Mức độ độc lập công việc.',
      levels: {
        1: 'Chỉ đạo trực tiếp.',
        2: 'Giám sát định kỳ.',
        3: 'Làm việc độc lập.',
        4: 'Tự chủ chuyên môn.',
        5: 'Chỉ đạo phân quyền.',
        6: 'Quyết định chiến lược cấp khối.',
        7: 'Toàn quyền quyết định.',
      },
    },
    {
      code: 'INFLUENCE',
      name: 'Influence',
      nameVi: 'Mức độ ảnh hưởng',
      description: 'Tác động đến người khác.',
      levels: {
        1: 'Tương tác người hướng dẫn.',
        2: 'Tương tác nhóm.',
        3: 'Ảnh hưởng sản phẩm nhóm.',
        4: 'Ảnh hưởng nhiều nhóm.',
        5: 'Ảnh hưởng chính sách.',
        6: 'Định hình chiến lược.',
        7: 'Dẫn dắt xu thế.',
      },
    },
  ]

  it('generates CSV string starting with UTF-8 BOM', () => {
    const csv = generateSfiaAttributesProgressionCsvString(mockLevels, mockAttributes)
    expect(csv.startsWith('\uFEFF')).toBe(true)
  })

  it('contains header row and formatted attribute progression data', () => {
    const csv = generateSfiaAttributesProgressionCsvString(mockLevels, mockAttributes)
    expect(csv).toContain('Mã thuộc tính')
    expect(csv).toContain('AUTONOMY')
    expect(csv).toContain('Autonomy')
    expect(csv).toContain('Mức độ tự chủ')
    expect(csv).toContain('Chỉ đạo trực tiếp.')
    expect(csv).toContain('Toàn quyền quyết định.')
    expect(csv).toContain('PHỤ LỤC: BẢN CHẤT CỐT LÕI CỦA 7 CẤP ĐỘ TRÁCH NHIỆM (SFIA 9)')
    expect(csv).toContain('Level 1')
    expect(csv).toContain('Level 7')
  })

  it('downloads file via browser document DOM in client environment', () => {
    const originalCreateObjectURL = window.URL.createObjectURL
    const originalRevokeObjectURL = window.URL.revokeObjectURL

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-uuid')
    window.URL.revokeObjectURL = vi.fn()

    const result = downloadSfiaAttributesProgressionCsv(mockLevels, mockAttributes, 'test-attributes.csv')
    expect(result).toBe(true)
    expect(window.URL.createObjectURL).toHaveBeenCalled()

    window.URL.createObjectURL = originalCreateObjectURL
    window.URL.revokeObjectURL = originalRevokeObjectURL
  })
})
