import type { PrismaClient } from '@prisma/client';

export async function backfillCompanyProfiles(prisma: PrismaClient): Promise<void> {
  console.log('Backfilling company profiles from saved job descriptions...');

  const savedJds = await prisma.savedJobDescription.findMany({
    where: {
      companyProfileId: null,
      companyName: { not: '' },
    },
    select: {
      id: true,
      companyName: true,
      companyWebsite: true,
    },
  });

  if (savedJds.length === 0) {
    console.log('No pending saved job descriptions to backfill.');
    return;
  }

  const companyMap = new Map<string, string>();

  await prisma.$transaction(async (tx) => {
    for (const jd of savedJds) {
      const normalizedName = jd.companyName.trim();
      if (!normalizedName) continue;

      let companyProfileId = companyMap.get(normalizedName.toLowerCase());

      if (!companyProfileId) {
        const existing = await tx.companyProfile.findFirst({
          where: { name: { equals: normalizedName, mode: 'insensitive' } },
          select: { id: true },
        });

        if (existing) {
          companyProfileId = existing.id;
        } else {
          const created = await tx.companyProfile.create({
            data: {
              name: normalizedName,
              website: jd.companyWebsite?.trim() || null,
            },
            select: { id: true },
          });
          companyProfileId = created.id;
        }
        companyMap.set(normalizedName.toLowerCase(), companyProfileId);
      }

      await tx.savedJobDescription.update({
        where: { id: jd.id },
        data: { companyProfileId },
      });
    }
  }, {
    maxWait: 10000,
    timeout: 60000,
  });

  console.log(`Successfully backfilled company profiles for ${savedJds.length} job descriptions.`);
}
