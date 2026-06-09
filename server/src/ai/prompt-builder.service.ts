import { Injectable } from '@nestjs/common';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { ContextPackConfig } from './context-pack.service';

export type PromptTask =
  | 'question-generation'
  | 'follow-up'
  | 'surgical-feedback'
  | 'comprehensive-report';

interface DynamicContextParams {
  systemMessage: string;
  jobDescription: string;
  sessionType?: string;
  targetRoles?: string[];
  question?: string;
  answer?: string;
  sessionHistory?: Array<{ question: string; answer: string }>;
}

const BASE_PROMPTS: Record<PromptTask, string> = {
  'question-generation': `You are an expert interviewer. Generate relevant, thoughtful interview questions based on the job description and interview strategy. Return valid JSON with a "questions" array. Each question must have: "text" (string), "category" (string), "competency_domain" (string), "difficulty" (1-3 integer).`,
  'follow-up': `You are a skilled interviewer. Based on the candidate's answer, generate ONE clarifying follow-up question that probes deeper. Return valid JSON with a "follow_up" string field, and a "trigger_reason" string field explaining why this follow-up was chosen.`,
  'surgical-feedback': `You are an expert interview coach. Evaluate the candidate's answer and provide surgical, actionable feedback. Return valid JSON matching the SurgicalFeedback schema exactly.\n\nCRITICAL: model_answer must be a complete, concrete example answer of 3-5 sentences written as if a strong candidate is actually speaking. It must directly answer the question using specific details, demonstrate best practices, and read like a real spoken response — NOT a list of improvement tips, NOT meta-advice about what to say.`,
  'comprehensive-report': `You are an expert career coach. Based on the interview session data, generate a comprehensive report with an action plan. Return valid JSON matching the ComprehensiveReport schema exactly.`,
};

@Injectable()
export class PromptBuilderService {
  buildBaseSystem(taskType: PromptTask): string {
    return BASE_PROMPTS[taskType];
  }

  applyContextPack(baseSystem: string, contextPack: ContextPackConfig): string {
    return `${baseSystem}\n\nCultural context: ${contextPack.culturalNotes}\nScoring dimensions: ${contextPack.rubricDimensions.join(', ')}.`;
  }

  injectDynamicContext(
    params: DynamicContextParams,
  ): ChatCompletionMessageParam[] {
    const {
      systemMessage,
      jobDescription,
      sessionType,
      targetRoles,
      question,
      answer,
      sessionHistory,
    } = params;

    let userContent = `<job_description>\n${jobDescription}\n</job_description>`;

    if (sessionType) {
      userContent += `\n\n<session_type>${sessionType}</session_type>`;
    }

    if (targetRoles && targetRoles.length > 0) {
      userContent += `\n\n<target_roles>\n${targetRoles.join('\n')}\n</target_roles>`;
    }

    if (question) {
      userContent += `\n\n<question>\n${question}\n</question>`;
    }

    if (answer) {
      userContent += `\n\n<answer>\n${answer}\n</answer>`;
    }

    if (sessionHistory && sessionHistory.length > 0) {
      const historyXml = sessionHistory
        .map(
          (h, i) =>
            `<turn index="${i + 1}">\n<question>${h.question}</question>\n<answer>${h.answer}</answer>\n</turn>`,
        )
        .join('\n');
      userContent += `\n\n<session_history>\n${historyXml}\n</session_history>`;
    }

    return [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userContent },
    ];
  }
}
