import type { PrismaClient } from '@prisma/client';

export function provisionDefaultRubricCatalog(
  _prisma: PrismaClient,
): Promise<void> {
  void _prisma;
  // Legacy rubric provisioning deprecated in favor of SFIA 9 Framework taxonomy
  return Promise.resolve();
}
