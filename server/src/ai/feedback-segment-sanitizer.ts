export interface FeedbackSegmentLike {
  segmentText: string;
  startIndex: number;
  endIndex: number;
  highlightLevel: string;
  annotation: string;
  suggestion?: string | null;
  improvedVersion?: string | null;
}

export interface SegmentSanitizerIssue {
  index: number;
  reason:
    | 'empty_quote'
    | 'invalid_range'
    | 'range_text_mismatch'
    | 'quote_not_found'
    | 'ambiguous_quote';
}

export interface SegmentSanitizerResult<T extends FeedbackSegmentLike> {
  segments: T[];
  issues: SegmentSanitizerIssue[];
}

function findAllOccurrences(text: string, search: string): number[] {
  const positions: number[] = [];
  let index = text.indexOf(search);

  while (index !== -1) {
    positions.push(index);
    index = text.indexOf(search, index + 1);
  }

  return positions;
}

function hasExactRange(answerText: string, segment: FeedbackSegmentLike) {
  return (
    Number.isInteger(segment.startIndex) &&
    Number.isInteger(segment.endIndex) &&
    segment.startIndex >= 0 &&
    segment.endIndex > segment.startIndex &&
    segment.endIndex <= answerText.length &&
    answerText.slice(segment.startIndex, segment.endIndex) ===
      segment.segmentText
  );
}

export function sanitizeFeedbackSegments<T extends FeedbackSegmentLike>(
  answerText: string,
  segments: T[],
): SegmentSanitizerResult<T> {
  const cleanAnswerText = answerText ?? '';
  const sanitized: T[] = [];
  const issues: SegmentSanitizerIssue[] = [];

  segments.forEach((segment, index) => {
    const quote = segment.segmentText.trim();
    if (!quote) {
      issues.push({ index, reason: 'empty_quote' });
      return;
    }

    const normalizedSegment = { ...segment, segmentText: quote };
    if (hasExactRange(cleanAnswerText, normalizedSegment)) {
      sanitized.push(normalizedSegment);
      return;
    }

    const hasIntegerRange =
      Number.isInteger(segment.startIndex) &&
      Number.isInteger(segment.endIndex);
    const hasBoundedRange =
      hasIntegerRange &&
      segment.startIndex >= 0 &&
      segment.endIndex > segment.startIndex &&
      segment.endIndex <= cleanAnswerText.length;
    const matches = findAllOccurrences(cleanAnswerText, quote);

    if (matches.length === 1) {
      const startIndex = matches[0];
      sanitized.push({
        ...normalizedSegment,
        startIndex,
        endIndex: startIndex + quote.length,
      });
      issues.push({
        index,
        reason: hasBoundedRange ? 'range_text_mismatch' : 'invalid_range',
      });
      return;
    }

    issues.push({
      index,
      reason:
        matches.length > 1
          ? 'ambiguous_quote'
          : hasBoundedRange
            ? 'range_text_mismatch'
            : 'quote_not_found',
    });
  });

  return { segments: sanitized, issues };
}
