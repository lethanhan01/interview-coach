import type { PrismaClient } from '@prisma/client';

export async function mapQuestionBankCriteria(prisma: PrismaClient): Promise<void> {
  console.log('Mapping Question Bank to SFIA 9 Criteria...');

  const criteriaList = await prisma.criteria.findMany({
    select: {
      id: true,
      code: true,
    },
  });

  const criteriaByCode = new Map<string, string>();
  for (const c of criteriaList) {
    criteriaByCode.set(c.code, c.id);
  }

  // Fallback criterion (e.g. PROG_L3 or first available)
  const defaultCriteriaId =
    criteriaByCode.get('PROG_L3') ??
    criteriaByCode.get('PROG_L2') ??
    criteriaList[0]?.id;

  if (!defaultCriteriaId) {
    console.warn('No criteria available in database to map questions.');
    return;
  }

  const questions = await prisma.questionBank.findMany({
    select: {
      id: true,
      content: true,
      sessionType: true,
      difficulty: true,
      contextPackId: true,
    },
  });

  let mappedCount = 0;

  for (const q of questions) {
    const text = (q.content ?? '').toLowerCase();
    const pack = (q.contextPackId ?? '').toLowerCase();
    const diff = q.difficulty ?? 3;

    let targetCode = 'PROG_L3';

    // Content-based heuristic mapping
    if (text.includes('database') || text.includes('sql') || text.includes('index') || text.includes('nosql') || text.includes('prisma') || text.includes('table')) {
      targetCode = diff >= 4 ? 'DBDS_L4' : 'DBDS_L3';
    } else if (text.includes('test') || text.includes('jest') || text.includes('qa') || text.includes('cypress') || text.includes('mock')) {
      targetCode = diff >= 4 ? 'TEST_L4' : 'TEST_L3';
    } else if (text.includes('security') || text.includes('jwt') || text.includes('auth') || text.includes('owasp') || text.includes('encrypt')) {
      targetCode = diff >= 4 ? 'CYBS_L4' : 'CYBS_L3';
    } else if (text.includes('docker') || text.includes('ci/cd') || text.includes('deploy') || text.includes('kubernetes') || text.includes('cloud') || pack.includes('devops')) {
      targetCode = diff >= 4 ? 'ITOP_L4' : 'ITOP_L3';
    } else if (text.includes('architecture') || text.includes('microservice') || text.includes('design pattern') || text.includes('solid') || text.includes('system design')) {
      targetCode = diff >= 4 ? 'DESN_L4' : 'DESN_L3';
    } else if (pack.includes('qa') || pack.includes('test')) {
      targetCode = diff >= 4 ? 'TEST_L4' : 'TEST_L3';
    } else {
      if (diff <= 2) targetCode = 'PROG_L2';
      else if (diff <= 3) targetCode = 'PROG_L3';
      else if (diff <= 4) targetCode = 'PROG_L4';
      else targetCode = 'PROG_L5';
    }

    const matchedId = criteriaByCode.get(targetCode) ?? defaultCriteriaId;

    await prisma.questionBankCriterion.upsert({
      where: {
        questionBankId_criteriaId: {
          questionBankId: q.id,
          criteriaId: matchedId,
        },
      },
      create: {
        questionBankId: q.id,
        criteriaId: matchedId,
        isPrimary: true,
        weight: 1.0,
      },
      update: {
        isPrimary: true,
        weight: 1.0,
      },
    });

    mappedCount++;
  }

  console.log(`Successfully mapped ${mappedCount} questions in Question Bank to SFIA 9 Criteria.`);
}
