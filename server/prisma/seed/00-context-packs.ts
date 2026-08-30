import type { PrismaClient } from '@prisma/client';
import {
  provisionDefaultRubricCatalog,
} from '../../src/modules/interview-assessment/evaluation/rubric/rubric-catalog-provision';

export async function seedContextPacks(prisma: PrismaClient): Promise<void> {
  await provisionDefaultRubricCatalog(prisma);

  console.log('rubric catalog provisioned');
}
