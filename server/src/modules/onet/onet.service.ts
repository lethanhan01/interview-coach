import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { OnetOccupationDto, OnetTechDto } from './contracts/onet.dto';

@Injectable()
export class OnetService {
  private readonly logger = new Logger(OnetService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tìm kiếm chức danh công việc O*NET tương thích nhất dựa trên tiêu đề công việc (Job Title).
   * Sử dụng pg_trgm fuzzy matching trên bảng onet.job_titles (54K alternate titles)
   * và fallback sang onet.occupation_data.
   */
  async findOccupationByTitle(title: string): Promise<OnetOccupationDto | null> {
    if (!title || typeof title !== 'string') {
      return null;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return null;
    }

    try {
      // 1. Khớp chính xác tên chuẩn (Exact case-insensitive match on occupation_data)
      const exactMatches = await this.prisma.$queryRaw<OnetOccupationDto[]>`
        SELECT 
          onetsoc_code AS "socCode",
          title,
          description,
          title AS "matchedTitle",
          1.0::float AS "similarityScore"
        FROM onet.occupation_data
        WHERE LOWER(title) = LOWER(${cleanTitle})
        LIMIT 1;
      `;

      if (exactMatches.length > 0) {
        return exactMatches[0];
      }

      // 2. Tìm kiếm mờ thông qua 54K alternate job titles (Trigram GIN search + word_similarity)
      const fuzzyAlternateMatches = await this.prisma.$queryRaw<OnetOccupationDto[]>`
        SELECT 
          jt.onetsoc_code AS "socCode",
          occ.title,
          occ.description,
          jt.job_title AS "matchedTitle",
          GREATEST(
            similarity(jt.job_title, ${cleanTitle}),
            word_similarity(${cleanTitle}, jt.job_title)
          )::float AS "similarityScore"
        FROM onet.job_titles jt
        JOIN onet.occupation_data occ ON jt.onetsoc_code = occ.onetsoc_code
        WHERE 
          jt.job_title % ${cleanTitle} 
          OR ${cleanTitle} <% jt.job_title
          OR word_similarity(${cleanTitle}, jt.job_title) >= 0.4
          OR similarity(jt.job_title, ${cleanTitle}) >= 0.25
        ORDER BY "similarityScore" DESC
        LIMIT 1;
      `;

      if (fuzzyAlternateMatches.length > 0) {
        return fuzzyAlternateMatches[0];
      }

      // 3. Fallback: Tìm kiếm mờ trực tiếp trên onet.occupation_data.title
      const fallbackMatches = await this.prisma.$queryRaw<OnetOccupationDto[]>`
        SELECT 
          occ.onetsoc_code AS "socCode",
          occ.title,
          occ.description,
          occ.title AS "matchedTitle",
          similarity(occ.title, ${cleanTitle})::float AS "similarityScore"
        FROM onet.occupation_data occ
        WHERE occ.title % ${cleanTitle} OR similarity(occ.title, ${cleanTitle}) >= 0.20
        ORDER BY "similarityScore" DESC
        LIMIT 1;
      `;

      if (fallbackMatches.length > 0) {
        return fallbackMatches[0];
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error finding O*NET occupation for title "${cleanTitle}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Lấy thông tin chức danh O*NET theo mã SOC chuẩn (ví dụ '15-1252.00').
   */
  async getOccupationBySocCode(socCode: string): Promise<OnetOccupationDto | null> {
    if (!socCode || typeof socCode !== 'string') {
      return null;
    }

    const cleanSoc = socCode.trim();
    if (!cleanSoc) {
      return null;
    }

    try {
      const records = await this.prisma.$queryRaw<OnetOccupationDto[]>`
        SELECT 
          onetsoc_code AS "socCode",
          title,
          description,
          title AS "matchedTitle",
          1.0::float AS "similarityScore"
        FROM onet.occupation_data
        WHERE onetsoc_code = ${cleanSoc}
        LIMIT 1;
      `;

      return records.length > 0 ? records[0] : null;
    } catch (error) {
      this.logger.error(
        `Error querying O*NET occupation by socCode "${cleanSoc}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Lấy danh sách công nghệ và công cụ phần mềm (Tools & Technology) gắn với mã SOC.
   * Ưu tiên các Hot Technologies xếp lên trước.
   */
  async getToolsAndTechnology(socCode: string): Promise<OnetTechDto[]> {
    if (!socCode || typeof socCode !== 'string') {
      return [];
    }

    const cleanSoc = socCode.trim();
    if (!cleanSoc) {
      return [];
    }

    try {
      const rawTech = await this.prisma.$queryRaw<
        Array<{
          example: string;
          isHotTechnology: boolean;
          inDemand: boolean;
        }>
      >`
        SELECT 
          workplace_example AS "example",
          (hot_technology = 'Y') AS "isHotTechnology",
          (in_demand = 'Y') AS "inDemand"
        FROM onet.software_skills
        WHERE onetsoc_code = ${cleanSoc}
        ORDER BY (hot_technology = 'Y') DESC, workplace_example ASC;
      `;

      return rawTech.map((item) => ({
        example: item.example,
        isHotTechnology: Boolean(item.isHotTechnology),
        inDemand: Boolean(item.inDemand),
      }));
    } catch (error) {
      this.logger.error(
        `Error querying O*NET tools & tech for socCode "${cleanSoc}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }
}
