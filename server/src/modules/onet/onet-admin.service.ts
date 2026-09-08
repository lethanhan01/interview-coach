import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { SFIA_FACADE_TOKEN } from '@modules/sfia/contracts/sfia.facade.interface';
import type { ISfiaFacade } from '@modules/sfia/contracts/sfia.facade.interface';
import {
  OnetAnalyticsSummaryDto,
  SocGroupDistributionItemDto,
  OnetTopOccupationItemDto,
  OnetTopOccupationsQueryDto,
  SfiaSkillCoverageItemDto,
  OnetSearchOccupationsQueryDto,
  OnetOccupationSummaryDto,
  OnetOccupationDetailDto,
  OnetTaskStatementDto,
  OnetSoftwareSkillDto,
  OnetJobZoneInfoDto,
  OnetAlternateTitlesQueryDto,
  PaginatedAlternateTitlesDto,
} from './dto/onet-admin.dto';
import { SOC_MAJOR_GROUPS } from './constants/soc-groups.constant';

@Injectable()
export class OnetAdminService {
  private readonly logger = new Logger(OnetAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(SFIA_FACADE_TOKEN)
    private readonly sfiaFacade?: ISfiaFacade,
  ) {}

  /**
   * 1. Thống kê KPI tổng quan cho Analytics Dashboard
   */
  async getAnalyticsSummary(): Promise<OnetAnalyticsSummaryDto> {
    try {
      const summaryRows = await this.prisma.$queryRaw<
        Array<{
          totalOccupations: number;
          totalMajorGroups: number;
          totalMappedOccupations: number;
          itGroupOccupations: number;
          itGroupMappedOccupations: number;
          totalSoftwareSkills: number;
          hotTechCount: number;
          inDemandTechCount: number;
          totalAlternateTitles: number;
          totalMockInterviews: number;
          totalLinkedJobDescriptions: number;
        }>
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

      const row = summaryRows[0] || {
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
      };

      const totalOccupations = Number(row.totalOccupations) || 0;
      const totalMappedOccupations = Number(row.totalMappedOccupations) || 0;
      const itGroupOccupations = Number(row.itGroupOccupations) || 0;
      const itGroupMappedOccupations =
        Number(row.itGroupMappedOccupations) || 0;

      const overallMappingCoveragePercent =
        totalOccupations > 0
          ? Number(
              ((totalMappedOccupations / totalOccupations) * 100).toFixed(1),
            )
          : 0;

      const itGroupCoveragePercent =
        itGroupOccupations > 0
          ? Number(
              ((itGroupMappedOccupations / itGroupOccupations) * 100).toFixed(
                1,
              ),
            )
          : 0;

      return {
        totalOccupations,
        totalMajorGroups: Number(row.totalMajorGroups) || 23,
        totalMappedOccupations,
        overallMappingCoveragePercent,
        itGroupOccupations,
        itGroupMappedOccupations,
        itGroupCoveragePercent,
        totalSoftwareSkills: Number(row.totalSoftwareSkills) || 0,
        hotTechCount: Number(row.hotTechCount) || 0,
        inDemandTechCount: Number(row.inDemandTechCount) || 0,
        totalAlternateTitles: Number(row.totalAlternateTitles) || 0,
        totalMockInterviews: Number(row.totalMockInterviews) || 0,
        totalLinkedJobDescriptions: Number(row.totalLinkedJobDescriptions) || 0,
      };
    } catch (error) {
      this.logger.error(
        `Error querying O*NET Analytics summary: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InterviewAIException(
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Không thể truy vấn thông tin thống kê O*NET Analytics.',
      );
    }
  }

  /**
   * 2. Phân bổ 23 Major Groups SOC cho biểu đồ Analytics & Accordion Sidebar
   */
  async getMajorGroupsDistribution(): Promise<SocGroupDistributionItemDto[]> {
    try {
      const rawGroups = await this.prisma.$queryRaw<
        Array<{
          code: string;
          totalOccupations: number;
          mappedOccupations: number;
        }>
      >`
        SELECT 
          SUBSTRING(occ.onetsoc_code, 1, 2) AS "code",
          COUNT(occ.onetsoc_code)::int AS "totalOccupations",
          COUNT(DISTINCT m.onet_soc_code)::int AS "mappedOccupations"
        FROM onet.occupation_data occ
        LEFT JOIN public.onet_sfia_mappings m ON occ.onetsoc_code = m.onet_soc_code
        GROUP BY SUBSTRING(occ.onetsoc_code, 1, 2)
        ORDER BY SUBSTRING(occ.onetsoc_code, 1, 2) ASC;
      `;

      const groupMap = new Map(rawGroups.map((g) => [g.code, g]));

      return Object.entries(SOC_MAJOR_GROUPS).map(([code, meta]) => {
        const found = groupMap.get(code);
        const total = found ? Number(found.totalOccupations) : 0;
        const mapped = found ? Number(found.mappedOccupations) : 0;
        const coverage =
          total > 0 ? Number(((mapped / total) * 100).toFixed(1)) : 0;

        return {
          code,
          name: meta.name,
          englishName: meta.englishName,
          totalOccupations: total,
          mappedOccupations: mapped,
          mappingCoveragePercent: coverage,
          isFocusGroup: code === '15',
        };
      });
    } catch (error) {
      this.logger.error(
        `Error querying SOC major groups distribution: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InterviewAIException(
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Không thể truy vấn phân bổ 23 nhóm nghề O*NET SOC.',
      );
    }
  }

  /**
   * 3. Lấy danh sách 23 Major Groups ngắn gọn cho Master Sidebar
   */
  async getMajorGroups(): Promise<
    Array<{
      code: string;
      name: string;
      englishName: string;
      totalOccupations: number;
      mappedCount: number;
    }>
  > {
    const list = await this.getMajorGroupsDistribution();
    return list.map((item) => ({
      code: item.code,
      name: item.name,
      englishName: item.englishName,
      totalOccupations: item.totalOccupations,
      mappedCount: item.mappedOccupations,
    }));
  }

  /**
   * 4. Tìm kiếm / Danh sách nghề cho Master Sidebar
   */
  async searchOccupations(
    query: OnetSearchOccupationsQueryDto,
  ): Promise<OnetOccupationSummaryDto[]> {
    const search = query.search?.trim();
    const groupCode = query.groupCode?.trim();
    const mappedOnly = Boolean(query.mappedOnly);
    const limit = Math.max(1, Math.min(200, query.limit || 50));

    try {
      let whereClauses = 'WHERE 1=1';
      if (groupCode) {
        whereClauses += ` AND occ.onetsoc_code LIKE '${groupCode.replace(/'/g, "''")}-%'`;
      }
      if (mappedOnly) {
        whereClauses += ' AND m.mapping_count > 0';
      }
      if (search) {
        const cleanSearch = search.replace(/'/g, "''");
        whereClauses += ` AND (occ.onetsoc_code ILIKE '%${cleanSearch}%' OR occ.title ILIKE '%${cleanSearch}%')`;
      }

      const sql = `
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
        ${whereClauses}
        ORDER BY (COALESCE(m.mapping_count, 0) > 0) DESC, occ.onetsoc_code ASC
        LIMIT ${limit};
      `;

      const rows = await this.prisma.$queryRawUnsafe<
        Array<{
          socCode: string;
          title: string;
          majorGroupCode: string;
          isMapped: boolean;
          mappingCount: number;
        }>
      >(sql);

      return rows.map((r) => ({
        socCode: r.socCode,
        title: r.title,
        majorGroupCode: r.majorGroupCode,
        isMapped: Boolean(r.isMapped),
        mappingCount: Number(r.mappingCount) || 0,
      }));
    } catch (error) {
      this.logger.error(
        `Error searching occupations for sidebar: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InterviewAIException(
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Không thể tìm kiếm danh sách nghề nghiệp O*NET.',
      );
    }
  }

  /**
   * 5. Bảng Top Nghề Quan tâm & Luyện tập nhiều nhất
   */
  async getTopOccupations(
    query: OnetTopOccupationsQueryDto,
  ): Promise<OnetTopOccupationItemDto[]> {
    const limit = Math.max(1, Math.min(50, query.limit || 10));
    const sortBy = query.sortBy || 'interviews';
    const search = query.search?.trim();

    try {
      let searchCondition = '';
      if (search) {
        const cleanSearch = search.replace(/'/g, "''");
        searchCondition = `WHERE occ.title ILIKE '%${cleanSearch}%' OR occ.onetsoc_code ILIKE '%${cleanSearch}%'`;
      }

      let orderClause =
        'ORDER BY "mockInterviewCount" DESC, "mappingCount" DESC';
      if (sortBy === 'jds') {
        orderClause =
          'ORDER BY "jobDescriptionCount" DESC, "mockInterviewCount" DESC';
      } else if (sortBy === 'mappings') {
        orderClause = 'ORDER BY "mappingCount" DESC, "mockInterviewCount" DESC';
      }

      const sql = `
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
            ARRAY_AGG(sfia_skill_code) FILTER (WHERE is_core = TRUE) AS core_skills
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
        ${searchCondition}
        ${orderClause}
        LIMIT ${limit};
      `;

      const rows = await this.prisma.$queryRawUnsafe<
        Array<{
          socCode: string;
          title: string;
          majorGroupCode: string;
          mockInterviewCount: number;
          jobDescriptionCount: number;
          mappingCount: number;
          isMapped: boolean;
          coreSkillCodes: string[] | null;
        }>
      >(sql);

      return rows.map((r) => {
        const groupMeta = SOC_MAJOR_GROUPS[r.majorGroupCode];
        return {
          socCode: r.socCode,
          title: r.title,
          majorGroupCode: r.majorGroupCode,
          majorGroupName: groupMeta
            ? groupMeta.name
            : `Nhóm ${r.majorGroupCode}`,
          mockInterviewCount: Number(r.mockInterviewCount) || 0,
          jobDescriptionCount: Number(r.jobDescriptionCount) || 0,
          mappingCount: Number(r.mappingCount) || 0,
          isMapped: Boolean(r.isMapped),
          coreSkillCodes: Array.isArray(r.coreSkillCodes)
            ? r.coreSkillCodes
            : [],
        };
      });
    } catch (error) {
      this.logger.error(
        `Error querying Top Occupations: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InterviewAIException(
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Không thể truy vấn danh sách Top nghề quan tâm.',
      );
    }
  }

  /**
   * 6. Biểu đồ Phân bổ Độ phủ Kỹ năng SFIA
   */
  async getSfiaSkillCoverage(
    limit = 20,
    category?: string,
  ): Promise<SfiaSkillCoverageItemDto[]> {
    const cleanLimit = Math.max(1, Math.min(100, limit || 20));

    try {
      const rawRows = await this.prisma.$queryRaw<
        Array<{
          code: string;
          mappedOccupationsCount: number;
          coreCount: number;
          secondaryCount: number;
          minTargetLevel: number;
          maxTargetLevel: number;
          avgTargetLevel: number;
        }>
      >`
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
        LIMIT ${cleanLimit};
      `;

      const enriched: SfiaSkillCoverageItemDto[] = [];
      for (const row of rawRows) {
        let name = row.code;
        let skillCategory = 'Chung';

        if (this.sfiaFacade) {
          try {
            const skillInfo = await this.sfiaFacade.getSkillByCode(row.code);
            if (skillInfo) {
              name = skillInfo.name;
              skillCategory = skillInfo.categoryCode || skillCategory;
            }
          } catch {
            // Ignore facade lookup failure
          }
        }

        if (
          !category ||
          skillCategory.toLowerCase().includes(category.toLowerCase())
        ) {
          enriched.push({
            code: row.code,
            name,
            category: skillCategory,
            mappedOccupationsCount: Number(row.mappedOccupationsCount) || 0,
            coreCount: Number(row.coreCount) || 0,
            secondaryCount: Number(row.secondaryCount) || 0,
            minTargetLevel: Number(row.minTargetLevel) || 1,
            maxTargetLevel: Number(row.maxTargetLevel) || 7,
            avgTargetLevel: Number(row.avgTargetLevel) || 3.0,
          });
        }
      }

      return enriched;
    } catch (error) {
      this.logger.error(
        `Error querying SFIA skill coverage: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InterviewAIException(
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Không thể truy vấn độ phủ kỹ năng SFIA.',
      );
    }
  }

  /**
   * 7. Lấy chi tiết nghề nghiệp O*NET & Job Zone
   */
  async getOccupationDetail(socCode: string): Promise<OnetOccupationDetailDto> {
    if (!socCode) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Mã nghề O*NET không được để trống.',
      );
    }

    const cleanSoc = socCode.trim();

    try {
      const occRows = await this.prisma.$queryRaw<
        Array<{
          socCode: string;
          title: string;
          description: string;
        }>
      >`
        SELECT 
          onetsoc_code AS "socCode",
          title,
          description
        FROM onet.occupation_data
        WHERE onetsoc_code = ${cleanSoc}
        LIMIT 1;
      `;

      if (!occRows || occRows.length === 0) {
        throw new InterviewAIException(
          ErrorCode.ONET_OCCUPATION_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          `Không tìm thấy nghề nghiệp với mã SOC ${cleanSoc}.`,
        );
      }

      const occ = occRows[0];
      const majorGroupCode = cleanSoc.substring(0, 2);

      // Job Zone
      const jobZoneRows = await this.prisma.$queryRaw<
        Array<{
          zone: number;
          name: string;
          education: string;
          experience: string;
          jobTraining: string;
        }>
      >`
        SELECT 
          jz.job_zone AS "zone",
          jzr.name,
          jzr.education,
          jzr.experience,
          jzr.job_training AS "jobTraining"
        FROM onet.job_zones jz
        JOIN onet.job_zone_reference jzr ON jz.job_zone = jzr.job_zone
        WHERE jz.onetsoc_code = ${cleanSoc}
        LIMIT 1;
      `;

      const jobZone: OnetJobZoneInfoDto = jobZoneRows[0] || {
        zone: 4,
        name: 'Considerable Preparation Needed',
        education:
          "Most of these occupations require a four-year bachelor's degree.",
        experience:
          'A considerable amount of work-related skill, knowledge, or experience is needed.',
        jobTraining:
          'Employees in these occupations usually need several years of work-related experience.',
      };

      // Stats counts
      const statsRows = await this.prisma.$queryRaw<
        Array<{
          toolCount: number;
          taskCount: number;
          mappingCount: number;
          alternateTitleCount: number;
        }>
      >`
        SELECT 
          (SELECT COUNT(*) FROM onet.software_skills WHERE onetsoc_code = ${cleanSoc})::int AS "toolCount",
          (SELECT COUNT(*) FROM onet.task_statements WHERE onetsoc_code = ${cleanSoc})::int AS "taskCount",
          (SELECT COUNT(*) FROM public.onet_sfia_mappings WHERE onet_soc_code = ${cleanSoc})::int AS "mappingCount",
          (SELECT COUNT(*) FROM onet.job_titles WHERE onetsoc_code = ${cleanSoc})::int AS "alternateTitleCount";
      `;

      const stats = statsRows[0] || {
        toolCount: 0,
        taskCount: 0,
        mappingCount: 0,
        alternateTitleCount: 0,
      };

      const tasks = await this.getOccupationTasks(cleanSoc);
      const softwareSkills = await this.getOccupationTechSkills(cleanSoc);
      const alternateTitlesRes = await this.getOccupationAlternateTitles(
        cleanSoc,
        {
          page: 1,
          limit: 10,
        },
      );

      return {
        socCode: occ.socCode,
        title: occ.title,
        description: occ.description,
        majorGroupCode,
        isMapped: (Number(stats.mappingCount) || 0) > 0,
        mappingCount: Number(stats.mappingCount) || 0,
        jobZone,
        stats: {
          toolCount: Number(stats.toolCount) || 0,
          taskCount: Number(stats.taskCount) || 0,
          mappingCount: Number(stats.mappingCount) || 0,
          alternateTitleCount: Number(stats.alternateTitleCount) || 0,
        },
        tasks,
        softwareSkills,
        alternateTitles: alternateTitlesRes.items,
        sfiaMappings: [],
      };
    } catch (error) {
      if (error instanceof InterviewAIException) throw error;
      this.logger.error(
        `Error querying occupation detail for "${cleanSoc}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InterviewAIException(
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Không thể lấy thông tin chi tiết nghề nghiệp ${cleanSoc}.`,
      );
    }
  }

  /**
   * 8. Lấy danh sách phần mềm / công nghệ (Tech Skills)
   */
  async getOccupationTechSkills(
    socCode: string,
  ): Promise<OnetSoftwareSkillDto[]> {
    const cleanSoc = socCode.trim();
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{
          name: string;
          category: string;
          isHotTechnology: boolean;
          inDemand: boolean;
        }>
      >`
        SELECT 
          workplace_example AS "name",
          COALESCE(commodity_code::text, 'Công cụ chung') AS "category",
          (hot_technology = 'Y') AS "isHotTechnology",
          (in_demand = 'Y') AS "inDemand"
        FROM onet.software_skills
        WHERE onetsoc_code = ${cleanSoc}
        ORDER BY (hot_technology = 'Y') DESC, (in_demand = 'Y') DESC, workplace_example ASC;
      `;

      return rows.map((r) => ({
        name: r.name,
        category: r.category,
        isHotTechnology: Boolean(r.isHotTechnology),
        inDemand: Boolean(r.inDemand),
      }));
    } catch (error) {
      this.logger.error(
        `Error querying tech skills for "${cleanSoc}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * 9. Lấy danh sách nhiệm vụ thực tế (Tasks)
   */
  async getOccupationTasks(socCode: string): Promise<OnetTaskStatementDto[]> {
    const cleanSoc = socCode.trim();
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{
          id: number;
          statement: string;
          isCore: boolean;
        }>
      >`
        SELECT 
          task_id AS "id",
          task AS "statement",
          (task_type = 'Core') AS "isCore"
        FROM onet.task_statements
        WHERE onetsoc_code = ${cleanSoc}
        ORDER BY (task_type = 'Core') DESC, task_id ASC;
      `;

      return rows.map((r) => ({
        id: String(r.id),
        statement: r.statement,
        isCore: Boolean(r.isCore),
      }));
    } catch (error) {
      this.logger.error(
        `Error querying tasks for "${cleanSoc}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * 10. Phân trang chức danh thị trường (Alternate Job Titles)
   */
  async getOccupationAlternateTitles(
    socCode: string,
    query: OnetAlternateTitlesQueryDto,
  ): Promise<PaginatedAlternateTitlesDto> {
    const cleanSoc = socCode.trim();
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const offset = (page - 1) * limit;
    const search = query.search?.trim();

    try {
      let searchCondition = '';
      if (search) {
        const cleanSearch = search.replace(/'/g, "''");
        searchCondition = `AND job_title ILIKE '%${cleanSearch}%'`;
      }

      const countRows = await this.prisma.$queryRawUnsafe<
        Array<{ count: number }>
      >(`
        SELECT COUNT(*)::int AS count
        FROM onet.job_titles
        WHERE onetsoc_code = '${cleanSoc.replace(/'/g, "''")}' ${searchCondition};
      `);

      const total = Number(countRows[0]?.count) || 0;
      const totalPages = Math.ceil(total / limit);

      const itemsRows = await this.prisma.$queryRawUnsafe<
        Array<{ job_title: string }>
      >(`
        SELECT job_title
        FROM onet.job_titles
        WHERE onetsoc_code = '${cleanSoc.replace(/'/g, "''")}' ${searchCondition}
        ORDER BY job_title ASC
        LIMIT ${limit} OFFSET ${offset};
      `);

      return {
        items: itemsRows.map((r) => r.job_title),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Error querying alternate titles for "${cleanSoc}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }
}
