import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
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
import { ONET_ADMIN_REPOSITORY_TOKEN } from './domain/onet-admin-repository.interface';
import type { IOnetAdminRepository } from './domain/onet-admin-repository.interface';

@Injectable()
export class OnetAdminService {
  private readonly logger = new Logger(OnetAdminService.name);

  constructor(
    @Inject(ONET_ADMIN_REPOSITORY_TOKEN)
    private readonly onetAdminRepository: IOnetAdminRepository,
    @Optional()
    @Inject(SFIA_FACADE_TOKEN)
    private readonly sfiaFacade?: ISfiaFacade,
  ) {}

  /**
   * 1. Thống kê KPI tổng quan cho Analytics Dashboard
   */
  async getAnalyticsSummary(): Promise<OnetAnalyticsSummaryDto> {
    try {
      const row = await this.onetAdminRepository.getSystemSummary();

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
      const rawGroups =
        await this.onetAdminRepository.getMajorGroupsDistribution();

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
      const rows = await this.onetAdminRepository.searchSidebarOccupations(
        groupCode,
        mappedOnly,
        search,
        limit,
      );

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
      const rows = await this.onetAdminRepository.getTopOccupations(
        search,
        sortBy,
        limit,
      );

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
      const rawRows =
        await this.onetAdminRepository.getSfiaSkillCoverage(cleanLimit);

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
      const occ =
        await this.onetAdminRepository.getOccupationBaseDetail(cleanSoc);

      if (!occ) {
        throw new InterviewAIException(
          ErrorCode.ONET_OCCUPATION_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          `Không tìm thấy nghề nghiệp với mã SOC ${cleanSoc}.`,
        );
      }

      const majorGroupCode = cleanSoc.substring(0, 2);

      // Job Zone
      const jobZoneRow =
        await this.onetAdminRepository.getOccupationJobZone(cleanSoc);

      const jobZone: OnetJobZoneInfoDto = jobZoneRow
        ? {
            zone: jobZoneRow.zone,
            name: jobZoneRow.name,
            education: jobZoneRow.education,
            experience: jobZoneRow.experience,
            jobTraining: jobZoneRow.jobTraining,
          }
        : {
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
      const stats =
        await this.onetAdminRepository.getOccupationStatsCounts(cleanSoc);

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
      const rows =
        await this.onetAdminRepository.getOccupationTechSkills(cleanSoc);

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
      const rows = await this.onetAdminRepository.getOccupationTasks(cleanSoc);

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
      const total = await this.onetAdminRepository.getAlternateTitlesCount(
        cleanSoc,
        search,
      );
      const totalPages = Math.ceil(total / limit);

      const items =
        await this.onetAdminRepository.getAlternateTitlesPaginated(
          cleanSoc,
          search,
          limit,
          offset,
        );

      return {
        items,
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
