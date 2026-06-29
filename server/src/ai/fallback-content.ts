import type { OutputLanguage } from './output-language';
import { resolveOutputLanguage } from './output-language';

const FALLBACK_FEEDBACK_MESSAGES: Record<OutputLanguage, string> = {
  vi: 'Phản hồi AI tạm thời chưa khả dụng. Bạn vẫn có thể xem lại câu trả lời trong báo cáo.',
  en: 'AI feedback is temporarily unavailable. You can still review your answer in the report.',
};

const FALLBACK_ACTION_PLANS: Record<OutputLanguage, { items: string[] }> = {
  vi: {
    items: [
      'Viết lại từng câu trả lời theo cấu trúc STAR.',
      'Bổ sung một ví dụ cụ thể và một kết quả đo lường được cho mỗi câu trả lời.',
      'Luyện nói lại các câu trả lời yếu nhất trước buổi phỏng vấn tiếp theo.',
    ],
  },
  en: {
    items: [
      'Rewrite each answer using the STAR structure.',
      'Add one concrete example and one measurable result to every answer.',
      'Practice the weakest answers aloud before the next interview.',
    ],
  },
};

const FALLBACK_REPORT_SUMMARIES: Record<OutputLanguage, string> = {
  vi: 'AI tạm thời chưa thể chấm điểm. Câu trả lời của bạn đã được lưu và có thể đánh giá lại khi dịch vụ AI ổn định.',
  en: 'AI scoring was unavailable. Your answers were saved and can be evaluated again after the AI service is restored.',
};

export function getFallbackFeedbackMessage(language?: string | null): string {
  return FALLBACK_FEEDBACK_MESSAGES[resolveOutputLanguage(language)];
}

export function getFallbackActionPlan(language?: string | null): {
  items: string[];
} {
  return FALLBACK_ACTION_PLANS[resolveOutputLanguage(language)];
}

export function getFallbackReportSummary(language?: string | null): string {
  return FALLBACK_REPORT_SUMMARIES[resolveOutputLanguage(language)];
}

export const FALLBACK_FEEDBACK_MESSAGE = getFallbackFeedbackMessage('vi');
export const FALLBACK_ACTION_PLAN = getFallbackActionPlan('vi');
