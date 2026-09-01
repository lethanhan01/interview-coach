import type { PrismaClient } from '@prisma/client';

export async function provisionDefaultRubricCatalog(
  _prisma: PrismaClient,
): Promise<void> {
  // Legacy rubric provisioning deprecated in favor of SFIA 9 Framework taxonomy
  return Promise.resolve();
}
