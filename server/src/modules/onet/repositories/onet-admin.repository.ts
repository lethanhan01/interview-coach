import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { IOnetAdminRepository } from '../domain/onet-admin-repository.interface';
import {
  OnetAdminSummaryStatsRaw,
  SocMajorGroupRawRow,
  SidebarOccupationRawRow,
  TopOccupationRawRow,
  SfiaSkillCoverageRawRow,
  OccupationDetailBaseRawRow,
  OccupationJobZoneRawRow,
  OccupationStatsCountsRawRow,
  OccupationTechSkillRawRow,
  OccupationTaskRawRow,
  OccupationSfiaMappingRawRow,
} from './types/onet-raw-row.types';

@Injectable()
export class OnetAdminRepository implements IOnetAdminRepository {
  private readonly logger = new Logger(OnetAdminRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx || this.prisma;
  }

  async getSystemSummary(
    tx?: Prisma.TransactionClient,
  ): Promise<OnetAdminSummaryStatsRaw> {
    try {
      const summaryRows = await this.getClient(tx).$queryRaw<
        OnetAdminSummaryStatsRaw[]
      >`
        SELECT 
          (SELECT COUNT(*) FROM onet.occupation_data)::int AS "totalOccupations",
          23::int AS "totalMajorGroups",
          (SELECT COUNT(DISTINCT onet_soc_code) FROM public.onet_sfia_mappings)::int AS "totalMappedOccupations",
          (SELECT COUNT(*) FROM onet.occupation_data WHERE onetsoc_code LIKE '15-%')::int AS "itGroupOccupations",
          (SELECT COUNT(DISTINCT onet_soc_code) FROM public.onet_sfia_mappings WHERE onet_soc_code LIKE '15-%')::int AS "itGroupMappedOccupations",
          (SELECT COUNT(*) FROM onet.software_skills)::int AS "totalSoftwareSkills",
          (SELECT COUNT(*) FROM onet.software_skills WHERE hot_technology = 'Y')::int AS "hotTechCount",
          (SELECT COUNT(*) FROM onet.software_skills WHERE in_demand = 'Y')::int AS "inDemandTechCount",
          (SELECT COUNT(*) FROM onet.job_titles)::int AS "totalAlternateTitles",
          (SELECT COUNT(*) FROM public.interview_sessions)::int AS "totalMockInterviews",
          (SELECT COUNT(*) FROM public.saved_job_descriptions WHERE deleted_at IS NULL)::int AS "totalLinkedJobDescriptions";
      `;

      return (
        summaryRows[0] || {
          totalOccupations: 0,
          totalMajorGroups: 23,
          totalMappedOccupations: 0,
          itGroupOccupations: 0,
          itGroupMappedOccupations: 0,
          totalSoftwareSkills: 0,
          hotTechCount: 0,
          inDemandTechCount: 0,
          totalAlternateTitles: 0,
          totalMockInterviews: 0,
          totalLinkedJobDescriptions: 0,
        }
      );
    } catch (error) {
      this.logger.error(
        `Error querying system summary: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getMajorGroupsDistribution(
    tx?: Prisma.TransactionClient,
  ): Promise<SocMajorGroupRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<SocMajorGroupRawRow[]>`
        SELECT 
          SUBSTRING(occ.onetsoc_code, 1, 2) AS "code",
          COUNT(occ.onetsoc_code)::int AS "totalOccupations",
          COUNT(DISTINCT m.onet_soc_code)::int AS "mappedOccupations"
        FROM onet.occupation_data occ
        LEFT JOIN public.onet_sfia_mappings m ON occ.onetsoc_code = m.onet_soc_code
        GROUP BY SUBSTRING(occ.onetsoc_code, 1, 2)
        ORDER BY SUBSTRING(occ.onetsoc_code, 1, 2) ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Error querying major groups distribution: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async searchSidebarOccupations(
    groupCode?: string,
    mappedOnly?: boolean,
    search?: string,
    limit = 50,
    tx?: Prisma.TransactionClient,
  ): Promise<SidebarOccupationRawRow[]> {
    try {
      const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
      if (groupCode) {
        const groupPattern = `${groupCode}-%`;
        conditions.push(Prisma.sql`occ.onetsoc_code LIKE ${groupPattern}`);
      }
      if (mappedOnly) {
        conditions.push(Prisma.sql`COALESCE(m.mapping_count, 0) > 0`);
      }
      if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(
          Prisma.sql`(occ.onetsoc_code ILIKE ${searchPattern} OR occ.title ILIKE ${searchPattern})`,
        );
      }
      const whereClause = Prisma.join(conditions, ' AND ');

      return await this.getClient(tx).$queryRaw<SidebarOccupationRawRow[]>`
        WITH mapping_counts AS (
          SELECT onet_soc_code, COUNT(*)::int AS mapping_count
          FROM public.onet_sfia_mappings
          GROUP BY onet_soc_code
        )
        SELECT 
          occ.onetsoc_code AS "socCode",
          occ.title,
          SUBSTRING(occ.onetsoc_code, 1, 2) AS "majorGroupCode",
          (COALESCE(m.mapping_count, 0) > 0) AS "isMapped",
          COALESCE(m.mapping_count, 0)::int AS "mappingCount"
        FROM onet.occupation_data occ
        LEFT JOIN mapping_counts m ON occ.onetsoc_code = m.onet_soc_code
        WHERE ${whereClause}
        ORDER BY (COALESCE(m.mapping_count, 0) > 0) DESC, occ.onetsoc_code ASC
        LIMIT ${limit};
      `;
    } catch (error) {
      this.logger.error(
        `Error searching sidebar occupations: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getTopOccupations(
    search?: string,
    sortBy: 'interviews' | 'jds' | 'mappings' = 'interviews',
    limit = 10,
    tx?: Prisma.TransactionClient,
  ): Promise<TopOccupationRawRow[]> {
    try {
      const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
      if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(
          Prisma.sql`(occ.title ILIKE ${searchPattern} OR occ.onetsoc_code ILIKE ${searchPattern})`,
        );
      }
      const whereClause = Prisma.join(conditions, ' AND ');

      let orderByClause = Prisma.sql`ORDER BY "mockInterviewCount" DESC, "mappingCount" DESC`;
      if (sortBy === 'jds') {
        orderByClause = Prisma.sql`ORDER BY "jobDescriptionCount" DESC, "mockInterviewCount" DESC`;
      } else if (sortBy === 'mappings') {
        orderByClause = Prisma.sql`ORDER BY "mappingCount" DESC, "mockInterviewCount" DESC`;
      }

      return await this.getClient(tx).$queryRaw<TopOccupationRawRow[]>`
        WITH session_counts AS (
          SELECT onet_soc_code, COUNT(*)::int AS sessions_count
          FROM public.interview_sessions
          WHERE onet_soc_code IS NOT NULL
          GROUP BY onet_soc_code
        ),
        jd_counts AS (
          SELECT onet_soc_code, COUNT(*)::int AS jds_count
          FROM public.saved_job_descriptions
          WHERE onet_soc_code IS NOT NULL AND deleted_at IS NULL
          GROUP BY onet_soc_code
        ),
        mapping_stats AS (
          SELECT 
            onet_soc_code,
            COUNT(*)::int AS mappings_count,
            ARRAY_AGG(DISTINCT sfia_skill_code) FILTER (WHERE is_core = TRUE) AS core_skills
          FROM public.onet_sfia_mappings
          GROUP BY onet_soc_code
        )
        SELECT 
          occ.onetsoc_code AS "socCode",
          occ.title,
          SUBSTRING(occ.onetsoc_code, 1, 2) AS "majorGroupCode",
          COALESCE(sc.sessions_count, 0)::int AS "mockInterviewCount",
          COALESCE(jc.jds_count, 0)::int AS "jobDescriptionCount",
          COALESCE(ms.mappings_count, 0)::int AS "mappingCount",
          (COALESCE(ms.mappings_count, 0) > 0) AS "isMapped",
          COALESCE(ms.core_skills, ARRAY[]::text[]) AS "coreSkillCodes"
        FROM onet.occupation_data occ
        LEFT JOIN session_counts sc ON occ.onetsoc_code = sc.onet_soc_code
        LEFT JOIN jd_counts jc ON occ.onetsoc_code = jc.onet_soc_code
        LEFT JOIN mapping_stats ms ON occ.onetsoc_code = ms.onet_soc_code
        WHERE ${whereClause}
        ${orderByClause}
        LIMIT ${limit};
      `;
    } catch (error) {
      this.logger.error(
        `Error querying top occupations: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getSfiaSkillCoverage(
    limit = 20,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaSkillCoverageRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<SfiaSkillCoverageRawRow[]>`
        SELECT 
          m.sfia_skill_code AS "code",
          COUNT(DISTINCT m.onet_soc_code)::int AS "mappedOccupationsCount",
          COUNT(*) FILTER (WHERE m.is_core = TRUE)::int AS "coreCount",
          COUNT(*) FILTER (WHERE m.is_core = FALSE)::int AS "secondaryCount",
          MIN(m.target_sfia_level)::int AS "minTargetLevel",
          MAX(m.target_sfia_level)::int AS "maxTargetLevel",
          ROUND(AVG(m.target_sfia_level)::numeric, 1)::float AS "avgTargetLevel"
        FROM public.onet_sfia_mappings m
        GROUP BY m.sfia_skill_code
        ORDER BY "mappedOccupationsCount" DESC, "coreCount" DESC
        LIMIT ${limit};
      `;
    } catch (error) {
      this.logger.error(
        `Error querying SFIA skill coverage: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getOccupationBaseDetail(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationDetailBaseRawRow | null> {
    try {
      const rows = await this.getClient(tx).$queryRaw<
        OccupationDetailBaseRawRow[]
      >`
        SELECT 
          onetsoc_code AS "socCode",
          title,
          description
        FROM onet.occupation_data
        WHERE onetsoc_code = ${socCode}
        LIMIT 1;
      `;

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      this.logger.error(
        `Error querying occupation base detail for "${socCode}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getOccupationJobZone(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationJobZoneRawRow | null> {
    try {
      const rows = await this.getClient(tx).$queryRaw<
        OccupationJobZoneRawRow[]
      >`
        SELECT 
          jz.job_zone AS "zone",
          jzr.name,
          jzr.education,
          jzr.experience,
          jzr.job_training AS "jobTraining"
        FROM onet.job_zones jz
        JOIN onet.job_zone_reference jzr ON jz.job_zone = jzr.job_zone
        WHERE jz.onetsoc_code = ${socCode}
        LIMIT 1;
      `;

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      this.logger.error(
        `Error querying job zone for "${socCode}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getOccupationStatsCounts(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationStatsCountsRawRow> {
    try {
      const rows = await this.getClient(tx).$queryRaw<
        OccupationStatsCountsRawRow[]
      >`
        SELECT 
          (SELECT COUNT(*) FROM onet.software_skills WHERE onetsoc_code = ${socCode})::int AS "toolCount",
          (SELECT COUNT(*) FROM onet.task_statements WHERE onetsoc_code = ${socCode})::int AS "taskCount",
          (SELECT COUNT(*) FROM public.onet_sfia_mappings WHERE onet_soc_code = ${socCode})::int AS "mappingCount",
          (SELECT COUNT(*) FROM onet.job_titles WHERE onetsoc_code = ${socCode})::int AS "alternateTitleCount";
      `;

      return (
        rows[0] || {
          toolCount: 0,
          taskCount: 0,
          mappingCount: 0,
          alternateTitleCount: 0,
        }
      );
    } catch (error) {
      this.logger.error(
        `Error querying stats counts for "${socCode}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getOccupationTechSkills(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationTechSkillRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<OccupationTechSkillRawRow[]>`
        SELECT 
          workplace_example AS "name",
          'Phần mềm & Công nghệ' AS "category",
          (hot_technology = 'Y') AS "isHotTechnology",
          (in_demand = 'Y') AS "inDemand"
        FROM onet.software_skills
        WHERE onetsoc_code = ${socCode}
        ORDER BY (hot_technology = 'Y') DESC, (in_demand = 'Y') DESC, workplace_example ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Error querying tech skills for "${socCode}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getOccupationTasks(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationTaskRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<OccupationTaskRawRow[]>`
        SELECT 
          task_id AS "id",
          task AS "statement",
          (task_type = 'Core') AS "isCore"
        FROM onet.task_statements
        WHERE onetsoc_code = ${socCode}
        ORDER BY (task_type = 'Core') DESC, task_id ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Error querying tasks for "${socCode}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getAlternateTitlesCount(
    socCode: string,
    search?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    try {
      const conditions: Prisma.Sql[] = [Prisma.sql`onetsoc_code = ${socCode}`];
      if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(Prisma.sql`job_title ILIKE ${searchPattern}`);
      }
      const whereClause = Prisma.join(conditions, ' AND ');

      const countRows = await this.getClient(tx).$queryRaw<
        Array<{ count: number }>
      >`
        SELECT COUNT(*)::int AS count
        FROM onet.job_titles
        WHERE ${whereClause};
      `;

      return Number(countRows[0]?.count) || 0;
    } catch (error) {
      this.logger.error(
        `Error querying alternate titles count for "${socCode}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getAlternateTitlesPaginated(
    socCode: string,
    search: string | undefined,
    limit: number,
    offset: number,
    tx?: Prisma.TransactionClient,
  ): Promise<string[]> {
    try {
      const conditions: Prisma.Sql[] = [Prisma.sql`onetsoc_code = ${socCode}`];
      if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(Prisma.sql`job_title ILIKE ${searchPattern}`);
      }
      const whereClause = Prisma.join(conditions, ' AND ');

      const itemsRows = await this.getClient(tx).$queryRaw<
        Array<{ job_title: string }>
      >`
        SELECT job_title
        FROM onet.job_titles
        WHERE ${whereClause}
        ORDER BY job_title ASC
        LIMIT ${limit} OFFSET ${offset};
      `;

      return itemsRows.map((r) => r.job_title);
    } catch (error) {
      this.logger.error(
        `Error querying alternate titles paginated for "${socCode}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getOccupationSfiaMappings(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationSfiaMappingRawRow[]> {
    try {
      const records = await this.getClient(tx).onetSfiaMapping.findMany({
        where: { onetSocCode: socCode },
        orderBy: [
          { isCore: 'desc' },
          { targetSfiaLevel: 'asc' },
          { sfiaSkillCode: 'asc' },
        ],
      });

      return records.map((r) => ({
        id: r.id,
        onetSocCode: r.onetSocCode,
        sfiaSkillCode: r.sfiaSkillCode,
        targetSfiaLevel: r.targetSfiaLevel,
        defaultWeight: Number(r.defaultWeight),
        isCore: r.isCore,
        source: r.source,
        createdAt: r.createdAt,
      }));
    } catch (error) {
      this.logger.error(
        `Error querying SFIA mappings for "${socCode}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async findSfiaMappingById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationSfiaMappingRawRow | null> {
    try {
      const record = await this.getClient(tx).onetSfiaMapping.findUnique({
        where: { id },
      });

      if (!record) return null;

      return {
        id: record.id,
        onetSocCode: record.onetSocCode,
        sfiaSkillCode: record.sfiaSkillCode,
        targetSfiaLevel: record.targetSfiaLevel,
        defaultWeight: Number(record.defaultWeight),
        isCore: record.isCore,
        source: record.source,
        createdAt: record.createdAt,
      };
    } catch (error) {
      this.logger.error(
        `Error finding SFIA mapping by id "${id}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async findSfiaMappingByUnique(
    socCode: string,
    sfiaSkillCode: string,
    targetSfiaLevel: number,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationSfiaMappingRawRow | null> {
    try {
      const record = await this.getClient(tx).onetSfiaMapping.findUnique({
        where: {
          onetSocCode_sfiaSkillCode_targetSfiaLevel: {
            onetSocCode: socCode,
            sfiaSkillCode,
            targetSfiaLevel,
          },
        },
      });

      if (!record) return null;

      return {
        id: record.id,
        onetSocCode: record.onetSocCode,
        sfiaSkillCode: record.sfiaSkillCode,
        targetSfiaLevel: record.targetSfiaLevel,
        defaultWeight: Number(record.defaultWeight),
        isCore: record.isCore,
        source: record.source,
        createdAt: record.createdAt,
      };
    } catch (error) {
      this.logger.error(
        `Error finding SFIA mapping by unique constraint: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async createSfiaMapping(
    socCode: string,
    sfiaSkillCode: string,
    targetSfiaLevel: number,
    defaultWeight: number,
    isCore: boolean,
    source = 'EXPERT_CURATED',
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationSfiaMappingRawRow> {
    try {
      const record = await this.getClient(tx).onetSfiaMapping.create({
        data: {
          onetSocCode: socCode,
          sfiaSkillCode,
          targetSfiaLevel,
          defaultWeight: new Prisma.Decimal(defaultWeight),
          isCore,
          source,
        },
      });

      return {
        id: record.id,
        onetSocCode: record.onetSocCode,
        sfiaSkillCode: record.sfiaSkillCode,
        targetSfiaLevel: record.targetSfiaLevel,
        defaultWeight: Number(record.defaultWeight),
        isCore: record.isCore,
        source: record.source,
        createdAt: record.createdAt,
      };
    } catch (error) {
      this.logger.error(
        `Error creating SFIA mapping: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async updateSfiaMapping(
    id: string,
    targetSfiaLevel?: number,
    defaultWeight?: number,
    isCore?: boolean,
    source?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationSfiaMappingRawRow> {
    try {
      const updateData: Prisma.OnetSfiaMappingUpdateInput = {};
      if (typeof targetSfiaLevel === 'number') {
        updateData.targetSfiaLevel = targetSfiaLevel;
      }
      if (typeof defaultWeight === 'number') {
        updateData.defaultWeight = new Prisma.Decimal(defaultWeight);
      }
      if (typeof isCore === 'boolean') {
        updateData.isCore = isCore;
      }
      if (source) {
        updateData.source = source;
      }

      const record = await this.getClient(tx).onetSfiaMapping.update({
        where: { id },
        data: updateData,
      });

      return {
        id: record.id,
        onetSocCode: record.onetSocCode,
        sfiaSkillCode: record.sfiaSkillCode,
        targetSfiaLevel: record.targetSfiaLevel,
        defaultWeight: Number(record.defaultWeight),
        isCore: record.isCore,
        source: record.source,
        createdAt: record.createdAt,
      };
    } catch (error) {
      this.logger.error(
        `Error updating SFIA mapping "${id}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async deleteSfiaMapping(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    try {
      await this.getClient(tx).onetSfiaMapping.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting SFIA mapping "${id}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async deleteOccupationMappings(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    try {
      const res = await this.getClient(tx).onetSfiaMapping.deleteMany({
        where: { onetSocCode: socCode },
      });
      return res.count;
    } catch (error) {
      this.logger.error(
        `Error deleting occupation mappings for "${socCode}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
