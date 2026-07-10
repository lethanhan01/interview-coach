import { readFileSync } from 'fs';
import { join } from 'path';
import type { Prisma, PrismaClient, QuestionSessionType } from '@prisma/client';

type KaggleQuestion = {
  content: string;
  sessionType: QuestionSessionType;
  difficulty: number;
  contextPackId: string;
  subcategory: string;
  competencyDomains: string[];
  applicableRoles: string[];
  applicableLevels: string[];
  tags: string[];
  estimatedTimeMin: number;
  translations: Prisma.InputJsonObject;
  contentJson: Prisma.InputJsonObject;
};

function toQuestionBankRow(question: KaggleQuestion) {
  return {
    content: question.content,
    sessionType: question.sessionType,
    difficulty: question.difficulty,
    contextPackId: question.contextPackId,
    competencyDomains: question.competencyDomains,
    estimatedTimeMin: question.estimatedTimeMin,
    translations: question.translations,
    contentJson: question.contentJson,
  };
}

function loadQuestions(): KaggleQuestion[] {
  const filePath = join(__dirname, 'data', 'kaggle-questions.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as KaggleQuestion[];
}

export async function seedKaggleQuestions(prisma: PrismaClient): Promise<void> {
  const questions = loadQuestions();

  const existingCount = await prisma.questionBank.count({
    where: {
      deletedAt: null,
      contentJson: { path: ['source'], equals: 'kaggle' },
    },
  });

  if (existingCount >= questions.length) {
    console.log(`question_bank (kaggle): already seeded ${existingCount} rows, skipping`);
    return;
  }

  if (existingCount > 0) {
    // Re-seed: soft-delete existing kaggle rows and re-insert clean
    await prisma.$executeRaw`
      UPDATE question_bank
      SET deleted_at = NOW()
      WHERE deleted_at IS NULL
        AND content_json->>'source' = 'kaggle'
    `;
  }

  await prisma.questionBank.createMany({
    data: questions.map(toQuestionBankRow),
    skipDuplicates: true,
  });

  console.log(`question_bank (kaggle): seeded ${questions.length} questions`);
}
