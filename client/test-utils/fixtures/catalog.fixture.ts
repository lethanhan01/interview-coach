import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/queries/keys'
import type { InterviewOptionsCatalog } from '@/types'

export const CATALOG_INTERVIEW_OPTIONS_FIXTURE: InterviewOptionsCatalog = {
  jdLevels: [
    {
      value: 'intern',
      label: 'Intern / Thực tập sinh',
      defaultSfiaLevel: 1,
      aliases: ['entry level', 'internship', 'thuc tap sinh', 'trainee'],
    },
    {
      value: 'fresher',
      label: 'Fresher',
      defaultSfiaLevel: 2,
      aliases: ['fresh', 'moi tot nghiep'],
    },
    {
      value: 'junior',
      label: 'Junior',
      defaultSfiaLevel: 2,
      aliases: [
        'junior developer',
        'junior 1y',
        'junior 1 year',
        'junior 2y',
        'junior 2 years',
        'associate',
      ],
    },
    {
      value: 'middle',
      label: 'Middle',
      defaultSfiaLevel: 3,
      aliases: [
        'mid',
        'mid level',
        'midlevel',
        'middle level',
        'middle developer',
        'intermediate',
      ],
    },
    {
      value: 'senior',
      label: 'Senior',
      defaultSfiaLevel: 4,
      aliases: ['senior developer', 'sr'],
    },
    {
      value: 'lead',
      label: 'Lead / Principal',
      defaultSfiaLevel: 5,
      aliases: [
        'principal',
        'principal engineer',
        'team lead',
        'tech lead',
        'architect',
        'manager',
        'director',
        'truong nhom',
      ],
    },
  ],
  sfiaLevels: [
    {
      levelId: 1,
      name: 'Follow',
      nameVi: 'Theo dõi & Học việc',
      essence: 'Thực hiện các nhiệm vụ cơ bản dưới sự giám sát chặt chẽ.',
      description:
        'Làm việc theo hướng dẫn, học hỏi và hoàn thành tác vụ giao.',
    },
    {
      levelId: 2,
      name: 'Assist',
      nameVi: 'Hỗ trợ',
      essence: 'Hỗ trợ đồng nghiệp và làm việc dưới sự hướng dẫn.',
      description: 'Đóng góp vào công việc nhóm với mức giám sát vừa phải.',
    },
    {
      levelId: 3,
      name: 'Apply',
      nameVi: 'Áp dụng độc lập',
      essence: 'Tự chủ xử lý công việc trong phạm vi được giao.',
      description: 'Áp dụng kiến thức để giải quyết vấn đề thường gặp.',
    },
    {
      levelId: 4,
      name: 'Enable',
      nameVi: 'Chủ động & Tạo điều kiện',
      essence: 'Chủ động dẫn dắt và tạo điều kiện cho đồng nghiệp.',
      description: 'Chịu trách nhiệm kết quả công việc và hỗ trợ người khác.',
    },
    {
      levelId: 5,
      name: 'Ensure, advise',
      nameVi: 'Định hướng & Cố vấn',
      essence: 'Đảm bảo chất lượng và cố vấn chuyên môn.',
      description: 'Có thẩm quyền chuyên môn, ảnh hưởng quyết định kỹ thuật.',
    },
    {
      levelId: 6,
      name: 'Initiate, influence',
      nameVi: 'Khởi xướng & Tác động',
      essence: 'Khởi xướng thay đổi và tác động rộng trong tổ chức.',
      description: 'Dẫn dắt sáng kiến, ảnh hưởng đến chiến lược đơn vị.',
    },
    {
      levelId: 7,
      name: 'Set strategy, inspire, mobilise',
      nameVi: 'Chiến lược & Truyền cảm hứng',
      essence: 'Định hình chiến lược và truyền cảm hứng toàn tổ chức.',
      description: 'Chịu trách nhiệm cao nhất về định hướng chuyên môn.',
    },
  ],
  durations: [
    { value: 30, label: '30 phút', numQuestions: 15 },
    { value: 60, label: '1 tiếng', numQuestions: 30 },
    { value: 90, label: '1 tiếng rưỡi', numQuestions: 45 },
  ],
  sessionTypes: [
    {
      value: 'hr',
      label: 'HR / Behavioral',
      shortLabel: 'Nhân sự',
      description: 'Câu hỏi về kinh nghiệm, soft skills, và tình huống',
    },
    {
      value: 'technical',
      label: 'Technical',
      shortLabel: 'Kỹ thuật',
      description: 'Câu hỏi kỹ thuật chuyên sâu theo JD',
    },
  ],
  contextPacks: [
    {
      value: 'VN',
      label: 'Việt Nam',
      description:
        'Phong cách phỏng vấn Việt Nam, rubric phù hợp văn hóa địa phương',
    },
    {
      value: 'Western',
      label: 'Western',
      description:
        'STAR method, behavioral focus, phong cách công ty nước ngoài',
    },
  ],
  educationDegrees: [
    { value: 'high_school', label: 'THPT' },
    { value: 'college', label: 'Cao đẳng' },
    { value: 'bachelor', label: 'Đại học (Cử nhân)' },
    { value: 'engineer', label: 'Đại học (Kỹ sư)' },
    { value: 'master', label: 'Thạc sĩ' },
    { value: 'phd', label: 'Tiến sĩ' },
    { value: 'other', label: 'Khác' },
  ],
}

/** Nạp sẵn catalog vào QueryClient (Unit Test & Storybook decorators). */
export function seedCatalogQuery(
  queryClient: QueryClient,
  data: InterviewOptionsCatalog = CATALOG_INTERVIEW_OPTIONS_FIXTURE
): void {
  queryClient.setQueryData(queryKeys.catalog.interviewOptions(), data)
}
