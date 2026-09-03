import type { PrismaClient } from '@prisma/client';
import {
  SFIA_9_CATEGORIES,
  SFIA_9_LEVELS,
  SFIA_9_SKILLS,
  SFIA_9_ROLES,
  SFIA_9_SKILL_MAPPINGS,
} from './sfia-v9-data';

export async function seedSfiaV9Catalog(prisma: PrismaClient): Promise<void> {
  console.log('Seeding SFIA 9 Framework taxonomy (Skills, SkillLevels, RoleSkills)...');

  // Build lookup for subcategory -> (subcategory info + category info)
  const subcategoryLookup = new Map<
    string,
    {
      categoryCode: string;
      categoryName: string;
      subcategoryCode: string;
      subcategoryName: string;
    }
  >();

  for (const cat of SFIA_9_CATEGORIES) {
    for (const sub of cat.subcategories) {
      subcategoryLookup.set(sub.code, {
        categoryCode: cat.code,
        categoryName: cat.name,
        subcategoryCode: sub.code,
        subcategoryName: sub.name,
      });
    }
  }

  // Pre-calculate generic attributes per level rank
  const genericAttributesMap = new Map<
    number,
    {
      autonomy: string;
      influence: string;
      complexity: string;
      businessSkills: string;
      knowledge: string;
    }
  >();

  for (const lvl of SFIA_9_LEVELS) {
    genericAttributesMap.set(lvl.rank, {
      autonomy: lvl.autonomy,
      influence: lvl.influence,
      complexity: lvl.complexity,
      businessSkills: lvl.businessSkills,
      knowledge: lvl.knowledge,
    });
  }

  await prisma.$transaction(
    async (tx) => {
      // 1. Seed 7 Levels of Responsibility
      const levelMap = new Map<number, string>();
      for (const lvl of SFIA_9_LEVELS) {
        const levelRecord = await tx.level.upsert({
          where: { rank: lvl.rank },
          create: {
            rank: lvl.rank,
            code: lvl.code,
            name: lvl.name,
            autonomy: lvl.autonomy,
            influence: lvl.influence,
            complexity: lvl.complexity,
            businessSkills: lvl.businessSkills,
            knowledge: lvl.knowledge,
            description: lvl.description,
          },
          update: {
            name: lvl.name,
            autonomy: lvl.autonomy,
            influence: lvl.influence,
            complexity: lvl.complexity,
            businessSkills: lvl.businessSkills,
            knowledge: lvl.knowledge,
            description: lvl.description,
          },
          select: { id: true, rank: true },
        });
        levelMap.set(levelRecord.rank, levelRecord.id);
      }

      // 2. Seed Flattened Skills & Skill Levels
      const skillMap = new Map<string, string>();
      let displayOrder = 1;
      for (const skill of SFIA_9_SKILLS) {
        const subInfo = subcategoryLookup.get(skill.subcategoryCode) ?? {
          categoryCode: 'GENERAL',
          categoryName: 'General IT',
          subcategoryCode: skill.subcategoryCode,
          subcategoryName: skill.subcategoryCode,
        };

        const skillRecord = await tx.skill.upsert({
          where: { code: skill.code },
          create: {
            code: skill.code,
            name: skill.name,
            categoryCode: subInfo.categoryCode,
            categoryName: subInfo.categoryName,
            subcategoryCode: subInfo.subcategoryCode,
            subcategoryName: subInfo.subcategoryName,
            overallDescription: skill.overallDescription,
            guidanceNotes: skill.guidanceNotes,
            sfiaVersion: '9.0.0',
            displayOrder: displayOrder++,
          },
          update: {
            name: skill.name,
            categoryCode: subInfo.categoryCode,
            categoryName: subInfo.categoryName,
            subcategoryCode: subInfo.subcategoryCode,
            subcategoryName: subInfo.subcategoryName,
            overallDescription: skill.overallDescription,
            guidanceNotes: skill.guidanceNotes,
            sfiaVersion: '9.0.0',
          },
          select: { id: true, code: true },
        });
        skillMap.set(skillRecord.code, skillRecord.id);

        // Seed Skill Levels per Skill & Level
        for (const crit of skill.levels) {
          const levelId = levelMap.get(crit.levelRank);
          if (!levelId) continue;

          const genericAttrs = genericAttributesMap.get(crit.levelRank) ?? null;

          await tx.skillLevel.upsert({
            where: {
              skillId_levelId: {
                skillId: skillRecord.id,
                levelId,
              },
            },
            create: {
              skillId: skillRecord.id,
              levelId,
              code: crit.code,
              name: crit.name,
              levelDescription: crit.levelDescription,
              behavioralIndicators: (crit.behavioralIndicators ?? []) as any,
              genericAttributes: (genericAttrs ?? undefined) as any,
              weight: 1.0,
            },
            update: {
              code: crit.code,
              name: crit.name,
              levelDescription: crit.levelDescription,
              behavioralIndicators: (crit.behavioralIndicators ?? []) as any,
              genericAttributes: (genericAttrs ?? undefined) as any,
              weight: 1.0,
            },
          });
        }
      }

      // 3. Seed Roles & Role Skills
      for (const role of SFIA_9_ROLES) {
        const roleRecord = await tx.role.upsert({
          where: { code: role.code },
          create: {
            code: role.code,
            name: role.name,
            description: role.description,
          },
          update: {
            name: role.name,
            description: role.description,
          },
          select: { id: true },
        });

        for (const roleSkill of role.skills) {
          const skillId = skillMap.get(roleSkill.skillCode);
          const targetLevelId = levelMap.get(roleSkill.targetLevelRank);
          if (!skillId || !targetLevelId) continue;

          await tx.roleSkill.upsert({
            where: {
              roleId_skillId_targetLevelId: {
                roleId: roleRecord.id,
                skillId,
                targetLevelId,
              },
            },
            create: {
              roleId: roleRecord.id,
              skillId,
              targetLevelId,
              defaultWeight: roleSkill.defaultWeight,
              priority: roleSkill.priority,
            },
            update: {
              defaultWeight: roleSkill.defaultWeight,
              priority: roleSkill.priority,
            },
          });
        }
      }
    },
    {
      maxWait: 10000,
      timeout: 120000,
    },
  );

  console.log('SFIA 9 Framework taxonomy (Skills, SkillLevels, RoleSkills) seeded successfully.');
}
