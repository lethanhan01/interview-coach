import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import {
  type ISfiaFacade,
  SFIA_FACADE_TOKEN,
} from '@modules/sfia/contracts';
import {
  AI_GATEWAY_TOKEN,
  type IAIGateway,
} from '@infra/ai/ai-gateway.interface';
import {
  ResolvedSessionSkill,
  ResolveSkillsParams,
} from './hybrid-mapping.types';

const AiSkillInferenceSchema = z.object({
  skills: z
    .array(
      z.object({
        skillCode: z.string().trim().toUpperCase(),
        isCore: z.boolean(),
        weight: z.number().min(0.5).max(3.0),
      }),
    )
    .min(2)
    .max(4),
});

@Injectable()
export class HybridMappingService {
  private readonly logger = new Logger(HybridMappingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SFIA_FACADE_TOKEN)
    private readonly sfiaFacade: ISfiaFacade,
    @Inject(AI_GATEWAY_TOKEN)
    private readonly aiGateway: IAIGateway,
  ) {}

  async resolveSkillsForSession(
    params: ResolveSkillsParams,
  ): Promise<ResolvedSessionSkill[]> {
    const targetLevel = this.clampLevel(params.targetLevel);

    if (params.sessionType === 'hr') {
      return this.resolveHrSkills(targetLevel);
    }

    return this.resolveTechnicalSkills(
      params.socCode?.trim() || '15-1252.00',
      targetLevel,
      params.jdText,
      params.normalizedTechStack || [],
    );
  }

  private resolveHrSkills(targetLevel: number): ResolvedSessionSkill[] {
    const hrSkillCodes = [
      { skillCode: 'ETMG', weight: 1.5, isCore: true },
      { skillCode: 'REFM', weight: 1.2, isCore: true },
      { skillCode: 'PDSV', weight: 1.0, isCore: false },
      { skillCode: 'OCDV', weight: 1.0, isCore: false },
    ];

    return hrSkillCodes.map((s) => ({
      skillCode: s.skillCode,
      targetLevel,
      weight: s.weight,
      isCore: s.isCore,
      source: 'curated',
      techContext: [],
    }));
  }

  private async resolveTechnicalSkills(
    socCode: string,
    targetLevel: number,
    jdText: string,
    normalizedTechStack: string[],
  ): Promise<ResolvedSessionSkill[]> {
    // Tầng 1: Curated Lookup từ bảng onet_sfia_mappings
    try {
      const curated = await this.prisma.onetSfiaMapping.findMany({
        where: {
          onetSocCode: socCode,
          targetSfiaLevel: targetLevel,
        },
        orderBy: [{ isCore: 'desc' }, { defaultWeight: 'desc' }],
      });

      if (curated.length > 0) {
        return curated.map((item) => ({
          skillCode: item.sfiaSkillCode,
          targetLevel: item.targetSfiaLevel,
          weight: Number(item.defaultWeight),
          isCore: item.isCore,
          source: (item.source as 'curated' | 'ai_inferred') || 'curated',
          techContext: this.distributeTechContext(
            item.sfiaSkillCode,
            normalizedTechStack,
          ),
        }));
      }
    } catch (error) {
      this.logger.warn(
        `Error querying onet_sfia_mappings for SOC ${socCode} Level ${targetLevel}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Tầng 2: Cache Miss -> Thử suy luận qua LLM và lưu cache
    try {
      const aiInferred = await this.inferSkillsViaAi(socCode, targetLevel, jdText);
      if (aiInferred.length > 0) {
        // Lưu cache vào CSDL
        await this.prisma.onetSfiaMapping
          .createMany({
            data: aiInferred.map((s) => ({
              onetSocCode: socCode,
              sfiaSkillCode: s.skillCode,
              targetSfiaLevel: targetLevel,
              defaultWeight: s.weight,
              isCore: s.isCore,
              source: 'ai_inferred',
            })),
            skipDuplicates: true,
          })
          .catch((err) => {
            this.logger.warn(`Failed to cache AI inferred SFIA skills: ${err}`);
          });

        return aiInferred.map((s) => ({
          ...s,
          techContext: this.distributeTechContext(
            s.skillCode,
            normalizedTechStack,
          ),
        }));
      }
    } catch (aiError) {
      this.logger.warn(
        `AI SFIA inference failed for SOC ${socCode}: ${aiError instanceof Error ? aiError.message : String(aiError)}. Falling back to resilience strategy.`,
      );
    }

    // Tầng 3: Safe Resilience Fallback
    return this.fallbackSkills(socCode, targetLevel, normalizedTechStack);
  }

  private async inferSkillsViaAi(
    socCode: string,
    targetLevel: number,
    jdText: string,
  ): Promise<Array<Omit<ResolvedSessionSkill, 'techContext'>>> {
    const allSkills = await this.sfiaFacade.getAllSkills();
    const availableCodes = new Set(allSkills.map((s) => s.code.toUpperCase()));

    const skillsOverview = allSkills
      .slice(0, 80)
      .map((s) => `${s.code}: ${s.name}`)
      .join('\n');

    const systemPrompt = `You are a specialist in O*NET occupational standards and SFIA (Skills Framework for the Information Age) version 9.
Your task is to select 2 to 4 core SFIA skills from the provided list that best represent the job description for the given O*NET SOC code and target level.
Always choose valid SFIA skill codes from the provided list. Return exactly 2 to 4 skills with reasonable weights (1.0 to 1.5).`;

    const userPrompt = `O*NET SOC Code: ${socCode}
Target SFIA Level: ${targetLevel}
Job Description Text:
${jdText.slice(0, 1500)}

Available SFIA Skills (code and name):
${skillsOverview}

Please select 2-4 appropriate SFIA skill codes for this role.`;

    const result = await this.aiGateway.generateStructured({
      systemPrompt,
      userPrompt,
      schema: AiSkillInferenceSchema,
      schemaName: 'AiSkillInference',
      task: 'question-generation',
      temperature: 0.2,
    });

    const validSkills = result.skills.filter((s) =>
      availableCodes.has(s.skillCode.toUpperCase()),
    );

    if (validSkills.length < 2) {
      return [];
    }

    return validSkills.map((s) => ({
      skillCode: s.skillCode.toUpperCase(),
      targetLevel,
      weight: s.weight,
      isCore: s.isCore,
      source: 'ai_inferred' as const,
    }));
  }

  private async fallbackSkills(
    socCode: string,
    targetLevel: number,
    normalizedTechStack: string[],
  ): Promise<ResolvedSessionSkill[]> {
    // Thử tìm mapping của cùng SOC code ở bất kỳ level nào khác trong DB
    try {
      const existingSocMappings = await this.prisma.onetSfiaMapping.findMany({
        where: { onetSocCode: socCode },
        orderBy: [{ isCore: 'desc' }, { defaultWeight: 'desc' }],
        take: 4,
      });

      if (existingSocMappings.length > 0) {
        return existingSocMappings.map((m) => ({
          skillCode: m.sfiaSkillCode,
          targetLevel,
          weight: Number(m.defaultWeight),
          isCore: m.isCore,
          source: 'fallback',
          techContext: this.distributeTechContext(
            m.sfiaSkillCode,
            normalizedTechStack,
          ),
        }));
      }
    } catch {
      // Bỏ qua lỗi DB truy vấn phụ
    }

    // Default IT resilience fallback
    const defaults = [
      { skillCode: 'PROG', weight: 1.5, isCore: true },
      { skillCode: 'TEST', weight: 1.0, isCore: true },
    ];

    if (targetLevel >= 4) {
      defaults.push({ skillCode: 'ARCH', weight: 1.2, isCore: false });
    }

    return defaults.map((d) => ({
      skillCode: d.skillCode,
      targetLevel,
      weight: d.weight,
      isCore: d.isCore,
      source: 'fallback',
      techContext: this.distributeTechContext(d.skillCode, normalizedTechStack),
    }));
  }

  distributeTechContext(
    skillCode: string,
    normalizedTechStack: string[],
  ): string[] {
    if (!normalizedTechStack || normalizedTechStack.length === 0) {
      return [];
    }

    const code = skillCode.toUpperCase();

    const dbKeywords =
      /(postgres|sql|mysql|mongodb|redis|cassandra|mariadb|oracle|sqlite|dynamodb|elasticsearch|opensearch|database|nosql)/i;
    const opsKeywords =
      /(docker|kubernetes|k8s|aws|azure|gcp|terraform|ansible|ci\/cd|jenkins|gitlab|github actions|linux|nginx|prometheus|grafana|helm|argo)/i;
    const devKeywords =
      /(javascript|typescript|node|python|java|golang|go\b|rust|c\+\+|c#|php|ruby|react|angular|vue|express|nest|spring|django|flask|fastapi|dotnet|\.net)/i;

    if (['DBDS', 'DBAD', 'DATA'].includes(code)) {
      const dbTech = normalizedTechStack.filter((t) => dbKeywords.test(t));
      return dbTech.length > 0 ? dbTech : normalizedTechStack;
    }

    if (['ITOP', 'HSIN', 'SCAD', 'METL'].includes(code)) {
      const opsTech = normalizedTechStack.filter((t) => opsKeywords.test(t));
      return opsTech.length > 0 ? opsTech : normalizedTechStack;
    }

    if (['PROG', 'TEST', 'DESN', 'ARCH', 'SWDN'].includes(code)) {
      const devTech = normalizedTechStack.filter((t) => devKeywords.test(t));
      return devTech.length > 0 ? devTech : normalizedTechStack;
    }

    return normalizedTechStack;
  }

  private clampLevel(level?: number | null): number {
    if (typeof level !== 'number' || isNaN(level)) return 3;
    return Math.max(1, Math.min(7, Math.round(level)));
  }
}
