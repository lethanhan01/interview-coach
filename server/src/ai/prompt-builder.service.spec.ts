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
      expect(result).toContain('overall_score');
      expect(result).toContain('annotated_segments');
      expect(result).toContain('highlight_level');
      expect(result).toContain('segment_text');
      expect(result).toContain('start_index');
      expect(result).toContain('end_index');
    });
  });

  describe('applyContextPack', () => {
    it('chèn cultural notes và rubric dimensions vào base system', () => {
      const base = 'base prompt';
      const contextPack = {
        culturalNotes: 'Tôn trọng cấp trên',
        rubricDimensions: ['communication', 'technical'],
      } as any;

      const result = service.applyContextPack(base, contextPack);

      expect(result).toContain('base prompt');
      expect(result).toContain('Tôn trọng cấp trên');
    });

    it('output chứa prefix đúng "Cultural context:" và "Scoring dimensions:"', () => {
      const base = 'base-system';
      const contextPack = {
        culturalNotes: 'Teamwork culture',
        rubricDimensions: ['dim1', 'dim2', 'dim3'],
      } as any;

      const result = service.applyContextPack(base, contextPack);

      expect(result).toContain('Cultural context: Teamwork culture');
      expect(result).toContain('Scoring dimensions: dim1, dim2, dim3.');
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

      expect(content).toContain('<question>\nTell me about a challenge\n</question>');
      expect(content).toContain('<answer>\nI solved a performance issue by adding pagination\n</answer>');
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
  });
});
