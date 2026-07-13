import { sanitizeFeedbackSegments } from './feedback-segment-sanitizer';

const makeSegment = (overrides: Partial<Parameters<typeof sanitizeFeedbackSegments>[1][number]> = {}) => ({
  segmentText: 'backend developer',
  startIndex: 7,
  endIndex: 24,
  highlightLevel: 'strength',
  annotation: 'Specific evidence',
  ...overrides,
});

describe('sanitizeFeedbackSegments', () => {
  it('giữ segment hợp lệ khi range khớp chính xác answerText', () => {
    const result = sanitizeFeedbackSegments('Tôi là backend developer.', [
      makeSegment(),
    ]);

    expect(result.issues).toEqual([]);
    expect(result.segments).toEqual([makeSegment()]);
  });

  it('sửa start/end index khi quote xuất hiện duy nhất trong answerText', () => {
    const result = sanitizeFeedbackSegments('Tôi là backend developer.', [
      makeSegment({ startIndex: 0, endIndex: 3 }),
    ]);

    expect(result.segments[0]).toEqual(
      makeSegment({ startIndex: 7, endIndex: 24 }),
    );
    expect(result.issues).toEqual([
      { index: 0, reason: 'range_text_mismatch' },
    ]);
  });

  it('loại segment lấy từ modelAnswer vì quote không nằm trong answerText', () => {
    const result = sanitizeFeedbackSegments('Tôi nghĩ REST là nghỉ ngơi.', [
      makeSegment({
        segmentText:
          'REST là một kiến trúc phong cách được thiết kế cho các dịch vụ web.',
        startIndex: 0,
        endIndex: 73,
      }),
    ]);

    expect(result.segments).toEqual([]);
    expect(result.issues).toEqual([{ index: 0, reason: 'quote_not_found' }]);
  });

  it('loại quote rỗng, range sai, quote không tồn tại và quote lặp mơ hồ', () => {
    const result = sanitizeFeedbackSegments('REST REST', [
      makeSegment({ segmentText: '   ', startIndex: 0, endIndex: 1 }),
      makeSegment({ segmentText: 'REST', startIndex: -1, endIndex: 3 }),
      makeSegment({ segmentText: 'GraphQL', startIndex: 0, endIndex: 4 }),
      makeSegment({ segmentText: 'REST', startIndex: 0, endIndex: 3 }),
    ]);

    expect(result.segments).toEqual([]);
    expect(result.issues).toEqual([
      { index: 0, reason: 'empty_quote' },
      { index: 1, reason: 'ambiguous_quote' },
      { index: 2, reason: 'range_text_mismatch' },
      { index: 3, reason: 'ambiguous_quote' },
    ]);
  });

  it('loại mọi segment khi answerText rỗng', () => {
    const result = sanitizeFeedbackSegments('', [makeSegment()]);

    expect(result.segments).toEqual([]);
    expect(result.issues).toEqual([{ index: 0, reason: 'quote_not_found' }]);
  });
});
