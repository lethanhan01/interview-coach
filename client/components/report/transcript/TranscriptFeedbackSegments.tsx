import { Blockquote, Paper, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconQuote } from '@tabler/icons-react'
import type { AnnotatedSegment } from '@/types'

export interface TranscriptFeedbackSegmentsProps {
  strengthSegments: AnnotatedSegment[]
  improvementSegments: AnnotatedSegment[]
  answerText: string
}

function getSegmentQuote(
  answerText: string,
  segment: AnnotatedSegment
): string {
  const explicitQuote = segment.segmentText?.trim()
  if (explicitQuote && answerText.includes(explicitQuote)) {
    return explicitQuote
  }

  const hasValidRange =
    Number.isInteger(segment.startIndex) &&
    Number.isInteger(segment.endIndex) &&
    segment.startIndex >= 0 &&
    segment.endIndex > segment.startIndex &&
    segment.endIndex <= answerText.length

  return hasValidRange
    ? answerText.slice(segment.startIndex, segment.endIndex).trim()
    : ''
}

function FeedbackGroup({
  title,
  segments,
  answerText,
}: Readonly<{
  title: string
  segments: AnnotatedSegment[]
  answerText: string
}>) {
  if (segments.length === 0) return null

  return (
    <Stack gap="xs">
      <Text size="sm" fw={600}>
        {title}
      </Text>
      <Stack gap="xs">
        {segments.map((seg) => {
          const quote = getSegmentQuote(answerText, seg)

          return (
            <Paper key={seg.id} withBorder radius="md" p="sm">
              <Stack gap={4}>
                {quote && (
                  <Blockquote
                    color="neutral"
                    radius="sm"
                    p="xs"
                    icon={
                      <ThemeIcon
                        size={16}
                        variant="transparent"
                        color="neutral"
                      >
                        <IconQuote size={12} aria-hidden="true" />
                      </ThemeIcon>
                    }
                  >
                    <Text size="xs" fs="italic">
                      &ldquo;{quote}&rdquo;
                    </Text>
                  </Blockquote>
                )}
                <Text size="xs">
                  <Text component="span" fw={600}>
                    Nhận xét:{' '}
                  </Text>
                  {seg.annotation}
                </Text>
                {seg.suggestion && (
                  <Text size="xs" c="dimmed">
                    <Text component="span" fw={600}>
                      Gợi ý:{' '}
                    </Text>
                    {seg.suggestion}
                  </Text>
                )}
              </Stack>
            </Paper>
          )
        })}
      </Stack>
    </Stack>
  )
}

export function TranscriptFeedbackSegments({
  strengthSegments,
  improvementSegments,
  answerText,
}: Readonly<TranscriptFeedbackSegmentsProps>) {
  if (strengthSegments.length === 0 && improvementSegments.length === 0) {
    return null
  }

  return (
    <Stack gap="md">
      <FeedbackGroup
        title="Ưu điểm trong câu trả lời"
        segments={strengthSegments}
        answerText={answerText}
      />
      <FeedbackGroup
        title="Điểm cần cải thiện"
        segments={improvementSegments}
        answerText={answerText}
      />
    </Stack>
  )
}

export default TranscriptFeedbackSegments
