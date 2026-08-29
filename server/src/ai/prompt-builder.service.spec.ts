import { Test, TestingModule } from '@nestjs/testing';
import { PromptBuilderService } from './prompt-builder.service';

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptBuilderService],
    }).compile();
    service = module.get<PromptBuilderService>(PromptBuilderService);
  });

  describe('buildBaseSystem', () => {
    it('trả về string không rỗng cho question-generation', () => {
      const result = service.buildBaseSystem('question-generation');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('trả về string không rỗng cho surgical-feedback', () => {
      expect(
        service.buildBaseSystem('surgical-feedback').length,
      ).toBeGreaterThan(0);
    });

    it('trả về string không rỗng cho comprehensive-report', () => {
      expect(
        service.buildBaseSystem('comprehensive-report').length,
      ).toBeGreaterThan(0);
    });

    it('surgical-feedback prompt chứa cấu trúc JSON response bắt buộc', () => {
      const result = service.buildBaseSystem('surgical-feedback');

      expect(result).toContain('CRITICAL: model_answer');
      expect(result).toContain('applied_dimensions');
      expect(result).toContain('annotated_segments');
      expect(result).toContain('highlight_level');
      expect(result).toContain('segment_text');
      expect(result).toContain('start_index');
      expect(result).toContain('end_index');
      expect(result).toContain('<integer 0-100>');
      expect(result).toContain('never use null');
      expect(result).toContain('exact substring copied verbatim');
      expect(result).toContain('quote ONLY the candidate answer');
      expect(result).toContain('Never copy text from model_answer');
    });
  });

  describe('applyContextPack', () => {
    it('chèn cultural notes và rubric dimensions vào base system', () => {
      const base = 'base prompt';
      const contextPack = {
        culturalNotes: 'Tôn trọng cấp trên',
        rubricDimensions: ['communication', 'technical'],
        behavioralDimensions: [{ id: 'D1', name: 'Communication' }],
        technicalDimensions: [{ id: 'TD1', name: 'Fundamentals' }],
      } as any;

      const result = service.applyContextPack(base, contextPack);

      expect(result).toContain('base prompt');
      expect(result).toContain('Tôn trọng cấp trên');
    });

    it('output chứa metadata contract và allowed rubric IDs', () => {
      const base = 'base-system';
      const contextPack = {
        culturalNotes: 'Teamwork culture',
        rubricDimensions: ['dim1', 'dim2', 'dim3'],
        behavioralDimensions: [{ id: 'D1', name: 'Communication' }],
        technicalDimensions: [{ id: 'TD1', name: 'Fundamentals' }],
      } as any;

      const result = service.applyContextPack(base, contextPack);

      expect(result).toContain('Cultural context: Teamwork culture');
      expect(result).toContain('Question metadata contract');
      expect(result).toContain('D1=Communication');
      expect(result).toContain('TD1=Fundamentals');
    });
  });

  describe('applyContextPackForEvaluation', () => {
    const behavioralDimensions = [
      { id: 'D1', name: 'Communication', weight: 0.2 },
      { id: 'D2', name: 'Teamwork', weight: 0.8 },
    ];
    const technicalDimensions = [
      { id: 'TD1', name: 'Fundamentals', weight: 0.5 },
      { id: 'TD2', name: 'Application', weight: 0.5 },
    ];
    const contextPack = {
      culturalNotes: 'Team-first culture',
      rubricDimensions: [
        'Communication',
        'Teamwork',
        'Fundamentals',
        'Application',
      ],
      behavioralDimensions,
      technicalDimensions,
      scoringWeights: { behavioral_weight: 0.45, technical_weight: 0.55 },
    } as any;

    it('HR: chứa behavioral dimensions, không có technical', () => {
      const result = service.applyContextPackForEvaluation(
        'base',
        contextPack,
        'hr',
      );

      expect(result).toContain('HR (behavioral only)');
      expect(result).toContain('D1 Communication');
      expect(result).toContain('D2 Teamwork');
      expect(result).not.toContain('TD1');
      expect(result).not.toContain('TD2');
      expect(result).toContain('Do NOT apply any technical criteria');
    });

    it('Technical: chứa technical dimensions, không có behavioral', () => {
      const result = service.applyContextPackForEvaluation(
        'base',
        contextPack,
        'technical',
      );

      expect(result).toContain('Technical (technical only)');
      expect(result).toContain('TD1 Fundamentals');
      expect(result).toContain('TD2 Application');
      expect(result).not.toContain('D1 Communication');
      expect(result).toContain('Do NOT apply any behavioral criteria');
    });


    it('mọi session type đều chứa cultural notes', () => {
      (['hr', 'technical'] as const).forEach((sessionType) => {
        const result = service.applyContextPackForEvaluation(
          'base',
          contextPack,
          sessionType,
        );
        expect(result).toContain('Team-first culture');
      });
    });

    it('output chứa base prompt', () => {
      const result = service.applyContextPackForEvaluation(
        'my-base-prompt',
        contextPack,
        'hr',
      );
      expect(result).toContain('my-base-prompt');
    });

    it('mọi session type chỉ thị chọn tập con tiêu chí, không tính sẵn overall', () => {
      (['hr', 'technical'] as const).forEach((sessionType) => {
        const result = service.applyContextPackForEvaluation(
          'base',
          contextPack,
          sessionType,
        );
        expect(result).toContain('select ONLY');
        expect(result).toContain('Score each selected dimension from 0 to 100');
        expect(result).toContain('A score of 0 is required');
        expect(result).not.toContain('weights sum to 1.0');
      });
    });
  });

  describe('injectDynamicContext', () => {
    it('trả về [system, user] với job description', () => {
      const messages = service.injectDynamicContext({
        systemMessage: 'sys-prompt',
        jobDescription: 'phần mềm engineer',
      });

      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({ role: 'system', content: 'sys-prompt' });
      expect(messages[1].role).toBe('user');
      expect(messages[1].content as string).toContain('phần mềm engineer');
    });

    it('bao gồm question và answer khi được cung cấp', () => {
      const messages = service.injectDynamicContext({
        systemMessage: 'sys',
        jobDescription: 'jd',
        question: 'Giới thiệu bản thân?',
        answer: 'Tôi là developer',
      });
      const content = messages[1].content as string;

      expect(content).toContain('Giới thiệu bản thân?');
      expect(content).toContain('Tôi là developer');
    });

    it('bao gồm question_metadata khi feedback cung cấp category/domain', () => {
      const messages = service.injectDynamicContext({
        systemMessage: 'sys',
        jobDescription: '',
        question: 'Tell me about a challenge',
        questionCategory: 'behavioral',
        competencyDomains: ['D2'],
        answer: 'I handled an incident calmly.',
      });
      const content = messages[1].content as string;

      expect(content).toContain('<question_metadata>');
      expect(content).toContain('category=behavioral');
      expect(content).toContain('competency_domains=D2');
    });

    it('bao gồm session type và target roles khi được cung cấp', () => {
      const messages = service.injectDynamicContext({
        systemMessage: 'sys',
        jobDescription: 'jd',
        sessionType: 'technical',
        targetRoles: ['Backend Engineer', 'Platform Engineer'],
      });
      const content = messages[1].content as string;

      expect(content).toContain('<session_type>technical</session_type>');
      expect(content).toContain('Backend Engineer');
      expect(content).toContain('Platform Engineer');
    });

    it('bao gồm session_history khi sessionHistory không rỗng', () => {
      const messages = service.injectDynamicContext({
        systemMessage: 'sys',
        jobDescription: 'jd',
        sessionHistory: [{ question: 'Q1', answer: 'A1' }],
      });
      const content = messages[1].content as string;

      expect(content).toContain('Q1');
      expect(content).toContain('A1');
    });

    it('bỏ qua session_history khi sessionHistory là mảng rỗng', () => {
      const messages = service.injectDynamicContext({
        systemMessage: 'sys',
        jobDescription: 'jd',
        sessionHistory: [],
      });

      expect(messages).toHaveLength(2);
      expect(messages[1].content as string).not.toContain('<session_history>');
    });

    it('feedback path: question và answer bọc trong XML tags', () => {
      const messages = service.injectDynamicContext({
        systemMessage: 'sys',
        jobDescription: '',
        question: 'Tell me about a challenge',
        answer: 'I solved a performance issue by adding pagination',
      });
      const content = messages[1].content as string;

      expect(content).toContain(
        '<question>\nTell me about a challenge\n</question>',
      );
      expect(content).toContain(
        '<answer>\nI solved a performance issue by adding pagination\n</answer>',
      );
    });

    it('không thêm <question> hay <answer> khi thiếu hai trường này', () => {
      const messages = service.injectDynamicContext({
        systemMessage: 'sys',
        jobDescription: 'some jd',
      });
      const content = messages[1].content as string;

      expect(content).not.toContain('<question>');
      expect(content).not.toContain('<answer>');
    });

    it('inject <num_questions> khi numQuestions được cung cấp', () => {
      const messages = service.injectDynamicContext({
        systemMessage: 'sys',
        jobDescription: 'jd',
        numQuestions: 3,
      });
      const content = messages[1].content as string;

      expect(content).toContain('<num_questions>3</num_questions>');
    });

    it('không thêm <num_questions> khi numQuestions không được cung cấp', () => {
      const messages = service.injectDynamicContext({
        systemMessage: 'sys',
        jobDescription: 'jd',
      });
      const content = messages[1].content as string;

      expect(content).not.toContain('<num_questions>');
    });
  });
});
