import { FollowUpCoordinatorService } from './follow-up-coordinator.service';

describe('FollowUpCoordinatorService', () => {
  let service: FollowUpCoordinatorService;

  beforeEach(() => {
    service = new FollowUpCoordinatorService();
  });

  describe('shouldGenerateFollowUp', () => {
    const LONG_TEXT = 'a'.repeat(50);
    const SHORT_TEXT = 'a'.repeat(49);

    it('trả về true khi answer đủ dài và không phải câu cuối', () => {
      expect(service.shouldGenerateFollowUp(LONG_TEXT, 1, 5)).toBe(true);
    });

    it('trả về false khi orderIndex >= totalQuestions (câu cuối)', () => {
      expect(service.shouldGenerateFollowUp(LONG_TEXT, 5, 5)).toBe(false);
    });

    it('trả về false khi orderIndex vượt totalQuestions', () => {
      expect(service.shouldGenerateFollowUp(LONG_TEXT, 6, 5)).toBe(false);
    });

    it('trả về false khi text.length < 50', () => {
      expect(service.shouldGenerateFollowUp(SHORT_TEXT, 1, 5)).toBe(false);
    });

    it('trả về false khi text rỗng', () => {
      expect(service.shouldGenerateFollowUp('', 1, 5)).toBe(false);
    });

    it('trả về false khi cả hai điều kiện cùng fail', () => {
      expect(service.shouldGenerateFollowUp(SHORT_TEXT, 5, 5)).toBe(false);
    });
  });
});
