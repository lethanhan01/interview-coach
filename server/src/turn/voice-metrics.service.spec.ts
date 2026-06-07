import { VoiceMetricsService } from './voice-metrics.service';

describe('VoiceMetricsService', () => {
  let service: VoiceMetricsService;

  beforeEach(() => {
    service = new VoiceMetricsService();
  });

  describe('calculate', () => {
    it('tính WPM đúng với 60 words trong 60 giây', () => {
      const text = Array(60).fill('word').join(' ');
      const result = service.calculate(text, 60);
      expect(result.wpm).toBe(60);
    });

    it('trả về wpm = 0 khi durationSeconds = 0', () => {
      const result = service.calculate('hello world', 0);
      expect(result.wpm).toBe(0);
    });

    it('làm tròn WPM — 10 words / 7s ≈ 85.71 → 86', () => {
      const text = Array(10).fill('word').join(' ');
      const result = service.calculate(text, 7);
      expect(result.wpm).toBe(86);
    });

    it('đếm filler words đúng', () => {
      const result = service.calculate(
        'um I think uh you know this is like correct',
        30,
      );
      expect(result.fillerWordCount).toBe(4);
      expect(result.fillerWords).toContain('um');
      expect(result.fillerWords).toContain('uh');
      expect(result.fillerWords).toContain('you know');
      expect(result.fillerWords).toContain('like');
    });

    it('không đếm filler words nếu không có', () => {
      const result = service.calculate(
        'The system architecture is well designed',
        30,
      );
      expect(result.fillerWordCount).toBe(0);
      expect(result.fillerWords).toHaveLength(0);
    });

    it('đếm filler word xuất hiện nhiều lần', () => {
      const result = service.calculate('um yes um no um maybe', 30);
      expect(result.fillerWordCount).toBe(3);
    });

    it('không phân biệt hoa thường với filler words', () => {
      const result = service.calculate('UM and UH are filler words', 30);
      expect(result.fillerWordCount).toBe(2);
    });

    it('xử lý string rỗng', () => {
      const result = service.calculate('', 60);
      expect(result.wpm).toBe(0);
      expect(result.fillerWordCount).toBe(0);
    });
  });
});
