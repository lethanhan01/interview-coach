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
  OnetSfiaMappingItemDto,
  CreateOnetSfiaMappingDto,
  UpdateOnetSfiaMappingDto,
  SfiaLibrarySkillDto,
} from './dto/onet-admin.dto';
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

      return rawGroups.map((g) => {
        const total = Number(g.totalOccupations) || 0;
        const mapped = Number(g.mappedOccupations) || 0;
        const coverage =
          total > 0 ? Number(((mapped / total) * 100).toFixed(1)) : 0;

        return {
          code: g.code,
          name: `Nhóm ${g.code}`,
          englishName: `Major Group ${g.code}`,
          totalOccupations: total,
          mappedOccupations: mapped,
          mappingCoveragePercent: coverage,
          isFocusGroup: g.code === '15',
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
        return {
          socCode: r.socCode,
          title: r.title,
          majorGroupCode: r.majorGroupCode,
          majorGroupName: `Nhóm ${r.majorGroupCode}`,
          mockInterviewCount: Number(r.mockInterviewCount) || 0,
          jobDescriptionCount: Number(r.jobDescriptionCount) || 0,
          mappingCount: Number(r.mappingCount) || 0,
          isMapped: Boolean(r.isMapped),
          coreSkillCodes: Array.isArray(r.coreSkillCodes)
            ? Array.from(new Set(r.coreSkillCodes))
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

      const skillMap = new Map<string, { name: string; category: string }>();

      if (this.sfiaFacade) {
        try {
          const allSkills = await this.sfiaFacade.getAllSkills();
          for (const s of allSkills) {
            skillMap.set(s.code.toUpperCase(), {
              name: s.name,
              category: s.categoryCode || 'Software Engineering',
            });
          }
        } catch (err) {
          this.logger.warn(
            `Failed to pre-fetch all SFIA skills for coverage: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      const enriched: SfiaSkillCoverageItemDto[] = [];
      for (const row of rawRows) {
        const meta = skillMap.get(row.code.toUpperCase());
        const name = meta?.name || row.code;
        const skillCategory = meta?.category || 'Chung';

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
      const sfiaMappings = await this.getOccupationSfiaMappings(cleanSoc);

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
        sfiaMappings,
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

      const items = await this.onetAdminRepository.getAlternateTitlesPaginated(
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

  /**
   * 11. Lấy danh sách ánh xạ kỹ năng SFIA của một nghề
   */
  async getOccupationSfiaMappings(
    socCode: string,
  ): Promise<OnetSfiaMappingItemDto[]> {
    const cleanSoc = socCode.trim();
    try {
      const rawMappings =
        await this.onetAdminRepository.getOccupationSfiaMappings(cleanSoc);

      const items: OnetSfiaMappingItemDto[] = [];
      for (const m of rawMappings) {
        let skillName = m.sfiaSkillCode;
        let skillCategory = 'Software Engineering';
        let minLevel = 1;
        let maxLevel = 7;
        let responsibility = '';

        if (this.sfiaFacade) {
          try {
            const skill = await this.sfiaFacade.getSkillByCode(m.sfiaSkillCode);
            if (skill) {
              skillName = skill.name;
              skillCategory = skill.categoryCode || skillCategory;
              minLevel = skill.minLevel;
              maxLevel = skill.maxLevel;
            }
            const lvl = await this.sfiaFacade.getLevel(m.targetSfiaLevel);
            if (lvl) {
              responsibility = lvl.description;
            }
          } catch {
            // ignore facade lookup failure
          }
        }

        items.push({
          id: m.id,
          onetSocCode: m.onetSocCode,
          sfiaSkillCode: m.sfiaSkillCode,
          skillName,
          skillCategory,
          targetSfiaLevel: m.targetSfiaLevel,
          defaultWeight: m.defaultWeight,
          isCore: m.isCore,
          source: m.source,
          minLevel,
          maxLevel,
          responsibility,
          createdAt: m.createdAt?.toISOString(),
        });
      }

      return items;
    } catch (error) {
      this.logger.error(
        `Error querying SFIA mappings for "${cleanSoc}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * 12. Thêm mới ánh xạ SFIA cho một nghề
   */
  async createSfiaMapping(
    socCode: string,
    dto: CreateOnetSfiaMappingDto,
  ): Promise<OnetSfiaMappingItemDto> {
    const cleanSoc = socCode.trim();
    const skillCode = dto.sfiaSkillCode.trim().toUpperCase();
    const targetLevel = dto.targetSfiaLevel;

    // Validate level range from SFIA facade
    let skillName = skillCode;
    let skillCategory = 'Software Engineering';
    let minLevel = 1;
    let maxLevel = 7;

    if (this.sfiaFacade) {
      const skill = await this.sfiaFacade.getSkillByCode(skillCode);
      if (!skill) {
        throw new InterviewAIException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          `Mã kỹ năng SFIA "${skillCode}" không tồn tại trong hệ thống.`,
        );
      }
      skillName = skill.name;
      skillCategory = skill.categoryCode || skillCategory;
      minLevel = skill.minLevel;
      maxLevel = skill.maxLevel;

      if (targetLevel < minLevel || targetLevel > maxLevel) {
        throw new InterviewAIException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          `Kỹ năng ${skillCode} chỉ hỗ trợ cấp độ từ ${minLevel} đến ${maxLevel} (bạn đã chọn Level ${targetLevel}).`,
        );
      }
    }

    // Check unique constraint
    const existing = await this.onetAdminRepository.findSfiaMappingByUnique(
      cleanSoc,
      skillCode,
      targetLevel,
    );
    if (existing) {
      throw new InterviewAIException(
        ErrorCode.CONFLICT,
        HttpStatus.CONFLICT,
        `Ánh xạ giữa nghề ${cleanSoc}, kỹ năng ${skillCode} và cấp độ ${targetLevel} đã tồn tại trong hệ thống.`,
      );
    }

    const created = await this.onetAdminRepository.createSfiaMapping(
      cleanSoc,
      skillCode,
      targetLevel,
      dto.defaultWeight ?? 1.0,
      dto.isCore ?? true,
      dto.source || 'USER_DEFINED',
    );

    return {
      id: created.id,
      onetSocCode: created.onetSocCode,
      sfiaSkillCode: created.sfiaSkillCode,
      skillName,
      skillCategory,
      targetSfiaLevel: created.targetSfiaLevel,
      defaultWeight: created.defaultWeight,
      isCore: created.isCore,
      source: created.source,
      minLevel,
      maxLevel,
      createdAt: created.createdAt?.toISOString(),
    };
  }

  /**
   * 13. Cập nhật ánh xạ SFIA
   */
  async updateSfiaMapping(
    socCode: string,
    mappingId: string,
    dto: UpdateOnetSfiaMappingDto,
  ): Promise<OnetSfiaMappingItemDto> {
    const cleanSoc = socCode.trim();
    const existing =
      await this.onetAdminRepository.findSfiaMappingById(mappingId);

    if (!existing || existing.onetSocCode !== cleanSoc) {
      throw new InterviewAIException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        `Không tìm thấy ánh xạ SFIA với id "${mappingId}" thuộc nghề "${cleanSoc}".`,
      );
    }

    if (
      typeof dto.targetSfiaLevel === 'number' &&
      dto.targetSfiaLevel !== existing.targetSfiaLevel
    ) {
      // Validate unique constraint on level change
      const conflict = await this.onetAdminRepository.findSfiaMappingByUnique(
        cleanSoc,
        existing.sfiaSkillCode,
        dto.targetSfiaLevel,
      );
      if (conflict && conflict.id !== mappingId) {
        throw new InterviewAIException(
          ErrorCode.CONFLICT,
          HttpStatus.CONFLICT,
          `Ánh xạ cho kỹ năng ${existing.sfiaSkillCode} cấp độ ${dto.targetSfiaLevel} đã tồn tại trong nghề này.`,
        );
      }
    }

    const updated = await this.onetAdminRepository.updateSfiaMapping(
      mappingId,
      dto.targetSfiaLevel,
      dto.defaultWeight,
      dto.isCore,
      dto.source,
    );

    let skillName = updated.sfiaSkillCode;
    let skillCategory = 'Software Engineering';
    let minLevel = 1;
    let maxLevel = 7;

    if (this.sfiaFacade) {
      try {
        const skill = await this.sfiaFacade.getSkillByCode(
          updated.sfiaSkillCode,
        );
        if (skill) {
          skillName = skill.name;
          skillCategory = skill.categoryCode || skillCategory;
          minLevel = skill.minLevel;
          maxLevel = skill.maxLevel;
        }
      } catch {
        // ignore facade failure
      }
    }

    return {
      id: updated.id,
      onetSocCode: updated.onetSocCode,
      sfiaSkillCode: updated.sfiaSkillCode,
      skillName,
      skillCategory,
      targetSfiaLevel: updated.targetSfiaLevel,
      defaultWeight: updated.defaultWeight,
      isCore: updated.isCore,
      source: updated.source,
      minLevel,
      maxLevel,
      createdAt: updated.createdAt?.toISOString(),
    };
  }

  /**
   * 14. Xóa ánh xạ SFIA
   */
  async deleteSfiaMapping(
    socCode: string,
    mappingId: string,
  ): Promise<{ success: boolean; message: string }> {
    const cleanSoc = socCode.trim();
    const existing =
      await this.onetAdminRepository.findSfiaMappingById(mappingId);

    if (!existing || existing.onetSocCode !== cleanSoc) {
      throw new InterviewAIException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        `Không tìm thấy ánh xạ SFIA với id "${mappingId}".`,
      );
    }

    await this.onetAdminRepository.deleteSfiaMapping(mappingId);
    return {
      success: true,
      message: `Đã xóa ánh xạ kỹ năng ${existing.sfiaSkillCode} khỏi nghề ${cleanSoc} thành công.`,
    };
  }

  /**
   * 15. Khôi phục ánh xạ SFIA về mặc định
   */
  async resetSfiaMappings(socCode: string): Promise<OnetSfiaMappingItemDto[]> {
    const cleanSoc = socCode.trim();
    return this.getOccupationSfiaMappings(cleanSoc);
  }

  /**
   * 16. Lấy toàn bộ thư viện kỹ năng SFIA 9 cho Combobox gợi ý
   */
  async getSfiaLibrary(): Promise<SfiaLibrarySkillDto[]> {
    if (!this.sfiaFacade) {
      return [];
    }

    try {
      const skills = await this.sfiaFacade.getAllSkills();
      return skills.map((s) => ({
        code: s.code,
        name: s.name,
        category: s.categoryCode || 'Software Engineering',
        categoryCode: s.categoryCode || 'SWEN',
        minLevel: s.minLevel,
        maxLevel: s.maxLevel,
        description: s.overallDescription || '',
        levels: Array.from({ length: s.maxLevel - s.minLevel + 1 }, (_, i) => ({
          level: s.minLevel + i,
          description: `Cấp độ ${s.minLevel + i} theo chuẩn SFIA 9`,
        })),
      }));
    } catch (error) {
      this.logger.error(
        `Error querying SFIA library: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }
}
