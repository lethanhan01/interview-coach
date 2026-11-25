import { Inject, Injectable } from '@nestjs/common';
import {
  type ISfiaFacade,
  SFIA_FACADE_TOKEN,
  SFIA_VI_TRANSLATIONS,
} from '@modules/sfia/contracts';
import type {
  ContextPackOptionDto,
  DurationOptionDto,
  InterviewOptionsCatalogResponse,
  JdLevelOptionDto,
  SelectOptionItemDto,
  SessionTypeOptionDto,
} from './dto/interview-options-response.dto';

const JD_LEVEL_OPTIONS: JdLevelOptionDto[] = [
  {
    value: 'intern',
    label: 'Intern / Thực tập sinh',
    defaultSfiaLevel: 1,
    aliases: [
      'entry level',
      'entrylevel',
      'internship',
      'thuc tap sinh',
      'trainee',
    ],
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
      'lead principal',
      'team lead',
      'tech lead',
      'architect',
      'manager',
      'director',
      'truong nhom',
    ],
  },
];

const DURATION_OPTIONS: DurationOptionDto[] = [
  { value: 30, label: '30 phút', numQuestions: 15 },
  { value: 60, label: '1 tiếng', numQuestions: 30 },
  { value: 90, label: '1 tiếng rưỡi', numQuestions: 45 },
];

const SESSION_TYPE_OPTIONS: SessionTypeOptionDto[] = [
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
];

const CONTEXT_PACK_OPTIONS: ContextPackOptionDto[] = [
  {
    value: 'VN',
    label: 'Việt Nam',
    description:
      'Phong cách phỏng vấn Việt Nam, rubric phù hợp văn hóa địa phương',
  },
  {
    value: 'Western',
    label: 'Western',
    description: 'STAR method, behavioral focus, phong cách công ty nước ngoài',
  },
];

const EDUCATION_DEGREE_OPTIONS: SelectOptionItemDto[] = [
  { value: 'high_school', label: 'THPT' },
  { value: 'college', label: 'Cao đẳng' },
  { value: 'bachelor', label: 'Đại học (Cử nhân)' },
  { value: 'engineer', label: 'Đại học (Kỹ sư)' },
  { value: 'master', label: 'Thạc sĩ' },
  { value: 'phd', label: 'Tiến sĩ' },
  { value: 'other', label: 'Khác' },
];

@Injectable()
export class InterviewOptionsCatalogService {
  constructor(
    @Inject(SFIA_FACADE_TOKEN)
    private readonly sfiaFacade: ISfiaFacade,
  ) {}

  async getInterviewOptions(): Promise<InterviewOptionsCatalogResponse> {
    const rawLevels = await this.sfiaFacade.getAllLevels();

    const sfiaLevels = rawLevels
      .slice()
      .sort((a, b) => a.levelId - b.levelId)
      .map((lvl) => ({
        levelId: lvl.levelId,
        name: lvl.name,
        nameVi:
          lvl.nameVi || SFIA_VI_TRANSLATIONS.levels[lvl.levelId] || lvl.name,
        essence: lvl.essence,
        description: lvl.description,
      }));

    return {
      jdLevels: JD_LEVEL_OPTIONS,
      sfiaLevels,
      durations: DURATION_OPTIONS,
      sessionTypes: SESSION_TYPE_OPTIONS,
      contextPacks: CONTEXT_PACK_OPTIONS,
      educationDegrees: EDUCATION_DEGREE_OPTIONS,
    };
  }
}
