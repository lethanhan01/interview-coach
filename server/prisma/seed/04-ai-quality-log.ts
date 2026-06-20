import type { PrismaClient } from '@prisma/client';

const LOG_ENTRIES = [
  { jobType: 'question-gen', model: 'gpt-4o', promptVersion: 'qgen-v2.1', inputTokens: 1240, outputTokens: 890, latencyMs: 3200, isFallback: false, errorCode: null },
  { jobType: 'question-gen', model: 'gpt-4o', promptVersion: 'qgen-v2.1', inputTokens: 1380, outputTokens: 920, latencyMs: 3850, isFallback: false, errorCode: null },
  { jobType: 'answer-feedback', model: 'gpt-4o', promptVersion: 'feedback-v1.3', inputTokens: 2100, outputTokens: 1450, latencyMs: 4100, isFallback: false, errorCode: null },
  { jobType: 'answer-feedback', model: 'gpt-4o', promptVersion: 'feedback-v1.3', inputTokens: 1980, outputTokens: 1320, latencyMs: 3900, isFallback: false, errorCode: null },
  { jobType: 'answer-feedback', model: 'gpt-4o', promptVersion: 'feedback-v1.3', inputTokens: 2250, outputTokens: 1600, latencyMs: 4500, isFallback: false, errorCode: null },
  // Fallback — answer feedback timed out, switched to gpt-4o-mini
  { jobType: 'answer-feedback', model: 'gpt-4o-mini', promptVersion: 'feedback-v1.3-fallback', inputTokens: 1980, outputTokens: 180, latencyMs: 12100, isFallback: true, errorCode: null },
  { jobType: 'session-summary', model: 'gpt-4o', promptVersion: 'summary-v1.0', inputTokens: 4800, outputTokens: 2100, latencyMs: 6200, isFallback: false, errorCode: null },
  { jobType: 'session-summary', model: 'gpt-4o', promptVersion: 'summary-v1.0', inputTokens: 5100, outputTokens: 2350, latencyMs: 6800, isFallback: false, errorCode: null },
  { jobType: 'follow-up-gen', model: 'gpt-4o', promptVersion: 'followup-v1.1', inputTokens: 980, outputTokens: 320, latencyMs: 1800, isFallback: false, errorCode: null },
  // Error — question generation, OpenAI timeout
  { jobType: 'question-gen', model: 'gpt-4o', promptVersion: 'qgen-v2.1', inputTokens: null, outputTokens: null, latencyMs: 30000, isFallback: false, errorCode: 'OPENAI_TIMEOUT' },
  { jobType: 'opening-transcript', model: 'gpt-4o', promptVersion: 'opening-v1.0', inputTokens: 750, outputTokens: 480, latencyMs: 2100, isFallback: false, errorCode: null },
  { jobType: 'comm-analysis', model: 'gpt-4o', promptVersion: 'comm-v1.0', inputTokens: 3200, outputTokens: 890, latencyMs: 3100, isFallback: false, errorCode: null },
];

export async function seedAiQualityLog(prisma: PrismaClient): Promise<void> {
  const count = await prisma.aiQualityLog.count();
  if (count >= LOG_ENTRIES.length) {
    console.log('ai_quality_log: already seeded, skipping');
    return;
  }

  const baseTime = Date.now() - 8 * 24 * 60 * 60 * 1000;
  await prisma.aiQualityLog.createMany({
    data: LOG_ENTRIES.map((e, i) => ({
      jobType: e.jobType,
      model: e.model,
      promptVersion: e.promptVersion,
      inputTokens: e.inputTokens ?? undefined,
      outputTokens: e.outputTokens ?? undefined,
      latencyMs: e.latencyMs,
      isFallback: e.isFallback,
      errorCode: e.errorCode,
      createdAt: new Date(baseTime + i * 3 * 60 * 60 * 1000),
    })),
  });

  console.log(`ai_quality_log: seeded ${LOG_ENTRIES.length} entries`);
}
