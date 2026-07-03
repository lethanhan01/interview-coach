import { Injectable } from '@nestjs/common';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { ContextPackConfig } from './context-pack.service';
import type { SessionType } from './pipelines/interview-pipeline.interface';

export type PromptTask =
  | 'question-generation'
  | 'surgical-feedback'
  | 'comprehensive-report';

interface DynamicContextParams {
  systemMessage: string;
  jobDescription: string;
  sessionType?: string;
  targetRoles?: string[];
  numQuestions?: number;
  question?: string;
  questionCategory?: string;
  competencyDomain?: string;
  answer?: string;
  sessionHistory?: Array<{ question: string; answer: string }>;
}

const BASE_PROMPTS: Record<PromptTask, string> = {
  'question-generation': `You are an expert interviewer. Generate relevant, thoughtful interview questions based on the job description and interview strategy. Generate exactly the number of questions specified in <num_questions>.

Return ONLY a compact valid JSON object with exactly this shape, no markdown fences, no explanation, no analysis, no prose before or after the JSON:
{
  "questions": [
    {
      "text": "<one interview question>",
      "category": "behavioral",
      "competency_domain": "D1",
      "difficulty": <integer 1-3>
    }
  ]
}

Use "category" exactly as "behavioral" or "technical". Use "competency_domain" exactly as one allowed rubric ID (for example D1 or TD3), never a dimension name or free-form phrase.

Write the final JSON directly in the assistant message content.`,
  'surgical-feedback': `You are an expert interview coach. Evaluate the candidate's answer and provide surgical, actionable feedback.

CRITICAL: model_answer must be a complete, concrete example answer of 3-4 concise sentences written as if a strong candidate is actually speaking. It must directly answer the question using specific details, demonstrate best practices, and read like a real spoken response — NOT a list of improvement tips, NOT meta-advice about what to say.

Return ONLY a compact valid JSON object with exactly this structure — no extra text, no markdown fences. Include at most 2 annotated_segments. For optional fields, either provide a string or omit the field entirely; never use null:
{
  "applied_dimensions": [
    { "id": "<dimension id exactly as listed in the system instructions>", "score": <integer 1-100> }
  ],
  "model_answer": "<complete 3-4 sentence example answer spoken as a candidate>",
  "key_takeaway": "<one concise insight about the answer quality>",
  "annotated_segments": [
    {
      "segment_text": "<exact substring copied verbatim from the candidate answer>",
      "start_index": <integer: zero-based character offset where segment starts>,
      "end_index": <integer: zero-based character offset where segment ends>,
      "highlight_level": "strength",
      "annotation": "<why this is a strength>"
    },
    {
      "segment_text": "<exact substring copied verbatim from the candidate answer>",
      "start_index": <integer>,
      "end_index": <integer>,
      "highlight_level": "improvement",
      "annotation": "<what needs to improve>",
      "suggestion": "<specific rewording, optional>",
      "improved_version": "<rewritten segment, optional>"
    }
  ]
}`,
  'comprehensive-report': `You are an expert career coach. Based on the interview session data, generate a comprehensive report with an action plan. Return valid JSON matching the ComprehensiveReport schema exactly.`,
};

@Injectable()
export class PromptBuilderService {
  buildBaseSystem(taskType: PromptTask): string {
    return BASE_PROMPTS[taskType];
  }

  applyContextPack(baseSystem: string, contextPack: ContextPackConfig): string {
    const behavioral = contextPack.behavioralDimensions
      .map((d) => `${d.id}=${d.name}`)
      .join(', ');
    const technical = contextPack.technicalDimensions
      .map((d) => `${d.id}=${d.name}`)
      .join(', ');

    return [
      baseSystem,
      `Cultural context: ${contextPack.culturalNotes}`,
      `Question metadata contract: category must be exactly "behavioral" or "technical". competency_domain must be exactly one allowed ID, not a label or phrase.`,
      `Behavioral IDs: ${behavioral}.`,
      `Technical IDs: ${technical}.`,
      `For HR sessions, use only behavioral/D* IDs. For Technical sessions, use only technical/TD* IDs. For Mixed sessions, choose one best-fitting allowed ID per question.`,
    ].join('\n\n');
  }

  applyContextPackForEvaluation(
    baseSystem: string,
    contextPack: ContextPackConfig,
    sessionType: SessionType,
    options: { competencyDomain?: string } = {},
  ): string {
    const { culturalNotes, behavioralDimensions, technicalDimensions } =
      contextPack;
    const lines = (dims: { id: string; name: string }[]) =>
      dims.map((d) => `  - ${d.id} ${d.name}`).join('\n');

    const selectionRules = [
      `From the candidate dimensions below, select ONLY the ones THIS question actually evaluates and ignore the rest.`,
      `Score each selected dimension from 1 to 100.`,
      `Return them in "applied_dimensions" as objects { "id", "score" } using the ids exactly as listed.`,
      `Do NOT invent ids outside the list. Do NOT output any weight or overall score — the system computes those.`,
    ];

    let scoringSection: string;
    if (sessionType === 'hr') {
      scoringSection = [
        `Session type: HR (behavioral only).`,
        `Candidate dimensions (maximum set that could apply):`,
        lines(behavioralDimensions),
        ...selectionRules,
        `Do NOT apply any technical criteria.`,
        `Example: a self-introduction question usually evaluates communication and self-awareness, not teamwork under pressure.`,
      ].join('\n');
    } else if (sessionType === 'technical') {
      scoringSection = [
        `Session type: Technical (technical only).`,
        `Candidate dimensions (maximum set that could apply):`,
        lines(technicalDimensions),
        ...selectionRules,
        `Do NOT apply any behavioral criteria.`,
        `Example: a pure definition question ("What is a closure?") usually evaluates only foundational knowledge and practical application, not debugging or systems thinking.`,
      ].join('\n');
    } else {
      const targetDomainRule = options.competencyDomain
        ? `Target competency_domain is ${options.competencyDomain}. Return exactly this one ID in "applied_dimensions"; do not include behavioral or technical dimensions outside the target.`
        : `A question may evaluate behavioral dimensions, technical dimensions, or both — include only those it truly tests.`;
      scoringSection = [
        `Session type: Mixed (behavioral + technical).`,
        `Candidate behavioral dimensions:`,
        lines(behavioralDimensions),
        `Candidate technical dimensions:`,
        lines(technicalDimensions),
        ...selectionRules,
        targetDomainRule,
        `Example: "Tell me about a bug you fixed" may evaluate debugging plus communication, but not coding-style depth.`,
      ].join('\n');
    }

    return `${baseSystem}\n\nCultural context: ${culturalNotes}\n${scoringSection}`;
  }

  injectDynamicContext(
    params: DynamicContextParams,
  ): ChatCompletionMessageParam[] {
    const {
      systemMessage,
      jobDescription,
      sessionType,
      targetRoles,
      numQuestions,
      question,
      questionCategory,
      competencyDomain,
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

    if (numQuestions !== undefined) {
      userContent += `\n\n<num_questions>${numQuestions}</num_questions>`;
    }

    if (question) {
      userContent += `\n\n<question>\n${question}\n</question>`;
    }

    if (questionCategory || competencyDomain) {
      userContent += `\n\n<question_metadata>`;
      if (questionCategory) {
        userContent += `\ncategory=${questionCategory}`;
      }
      if (competencyDomain) {
        userContent += `\ncompetency_domain=${competencyDomain}`;
      }
      userContent += `\n</question_metadata>`;
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
