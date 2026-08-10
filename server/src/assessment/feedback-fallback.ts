import type { OutputLanguage } from '../ai/output-language';
import { resolveOutputLanguage } from '../ai/output-language';

const messages: Record<OutputLanguage, string> = {
  vi: 'Phản hồi AI tạm thời chưa khả dụng. Bạn vẫn có thể xem lại câu trả lời trong báo cáo.',
  en: 'AI feedback is temporarily unavailable. You can still review your answer in the report.',
};

export function getFallbackFeedbackMessage(language?: string | null): string {
  return messages[resolveOutputLanguage(language)];
}
