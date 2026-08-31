import type { PrismaClient } from '@prisma/client';
import {
  SFIA_9_CATEGORIES,
  SFIA_9_LEVELS,
  SFIA_9_SKILLS,
  SFIA_9_ROLES,
  SFIA_9_SKILL_MAPPINGS,
} from './sfia-v9-data';

export async function seedSfiaV9Catalog(prisma: PrismaClient): Promise<void> {
  // Ensure check constraint allows sfia-v9
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "rubric_versions" DROP CONSTRAINT IF EXISTS "chk_rubric_versions_context_pack";
    ALTER TABLE "rubric_versions" ADD CONSTRAINT "chk_rubric_versions_context_pack" CHECK (context_pack_id IN ('VN', 'Western', 'sfia-v9'));
  `);

  console.log('Seeding SFIA 9 Framework taxonomy...');

  await prisma.$transaction(async (tx) => {
    // 1. Seed Rubric Version for SFIA 9
    const sfiaRubricVersion = await tx.rubricVersion.upsert({
      where: {
        contextPackId_versionKey: {
          contextPackId: 'sfia-v9',
          versionKey: '9.0.0',
        },
      },
      create: {
        contextPackId: 'sfia-v9',
        versionKey: '9.0.0',
        status: 'active',
        checksum: 'sfia-9-official-checksum',
      },
      update: {
        status: 'active',
      },
      select: { id: true },
    });

    // 2. Seed 7 Levels of Responsibility
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

    // 3. Seed Categories & Subcategories
    const subcategoryMap = new Map<string, string>();
    for (const cat of SFIA_9_CATEGORIES) {
      const categoryRecord = await tx.competencyCategory.upsert({
        where: { code: cat.code },
        create: {
          code: cat.code,
          name: cat.name,
          description: cat.description,
          displayOrder: cat.displayOrder,
        },
        update: {
          name: cat.name,
          description: cat.description,
          displayOrder: cat.displayOrder,
        },
        select: { id: true },
      });

      for (const sub of cat.subcategories) {
        const subRecord = await tx.competencySubcategory.upsert({
          where: { code: sub.code },
          create: {
            categoryId: categoryRecord.id,
            code: sub.code,
            name: sub.name,
            description: sub.description,
            displayOrder: sub.displayOrder,
          },
          update: {
            categoryId: categoryRecord.id,
            name: sub.name,
            description: sub.description,
            displayOrder: sub.displayOrder,
          },
          select: { id: true, code: true },
        });
        subcategoryMap.set(subRecord.code, subRecord.id);
      }
    }

    // 4. Seed Professional Skills & Level Criteria
    const competencyMap = new Map<string, string>();
    for (const skill of SFIA_9_SKILLS) {
      const subcategoryId = subcategoryMap.get(skill.subcategoryCode);
      const compRecord = await tx.competency.upsert({
        where: {
          rubricVersionId_code: {
            rubricVersionId: sfiaRubricVersion.id,
            code: skill.code,
          },
        },
        create: {
          rubricVersionId: sfiaRubricVersion.id,
          subcategoryId: subcategoryId ?? null,
          code: skill.code,
          name: skill.name,
          overallDescription: skill.overallDescription,
          guidanceNotes: skill.guidanceNotes,
        },
        update: {
          name: skill.name,
          overallDescription: skill.overallDescription,
          guidanceNotes: skill.guidanceNotes,
        },
        select: { id: true, code: true },
      });
      competencyMap.set(compRecord.code, compRecord.id);

      // Seed Level Criteria
      for (const crit of skill.levels) {
        const levelId = levelMap.get(crit.levelRank);
        if (!levelId) continue;

        await tx.competencyCriterion.upsert({
          where: {
            competencyId_levelId: {
              competencyId: compRecord.id,
              levelId,
            },
          },
          create: {
            competencyId: compRecord.id,
            levelId,
            code: crit.code,
            name: crit.name,
            levelDescription: crit.levelDescription,
            behavioralIndicators: crit.behavioralIndicators ?? [],
          },
          update: {
            code: crit.code,
            name: crit.name,
            levelDescription: crit.levelDescription,
            behavioralIndicators: crit.behavioralIndicators ?? [],
          },
        });
      }
    }

    // 5. Seed Roles & Role Level Competencies
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
        const competencyId = competencyMap.get(roleSkill.skillCode);
        const targetLevelId = levelMap.get(roleSkill.targetLevelRank);
        if (!competencyId || !targetLevelId) continue;

        await tx.roleLevelCompetency.upsert({
          where: {
            roleId_competencyId_targetLevelId: {
              roleId: roleRecord.id,
              competencyId,
              targetLevelId,
            },
          },
          create: {
            roleId: roleRecord.id,
            competencyId,
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

    // 6. Seed Skill Competency Mappings
    for (const mapping of SFIA_9_SKILL_MAPPINGS) {
      const competencyId = competencyMap.get(mapping.skillCode);
      if (!competencyId) continue;

      await tx.skillCompetencyMapping.upsert({
        where: {
          skillName_competencyId: {
            skillName: mapping.skillName,
            competencyId,
          },
        },
        create: {
          skillName: mapping.skillName,
          competencyId,
          relevanceWeight: mapping.relevanceWeight,
        },
        update: {
          relevanceWeight: mapping.relevanceWeight,
        },
      });
    }
  }, {
    maxWait: 10000,
    timeout: 120000,
  });

  console.log('SFIA 9 Framework taxonomy seeded successfully.');
}
