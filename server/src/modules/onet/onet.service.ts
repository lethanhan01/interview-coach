import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { OnetOccupationDto, OnetTechDto } from './contracts/onet.dto';

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

export function normalizeVietnameseJobTitle(title: string): string {
  const norm = removeVietnameseTones(title);

  // Bảng ánh xạ các vị trí CNTT phổ biến từ tiếng Việt sang tiếng Anh
  if (/\b(kiem thu|tester|qa|qc)\b/i.test(norm)) {
    return 'Software Quality Assurance Analysts and Testers';
  }
  if (
    /\b(lap trinh vien|ky su phan mem|phat trien phan mem|developer|programmer)\b/i.test(
      norm,
    )
  ) {
    return 'Software Developers';
  }
  if (/\b(du lieu|database|csdl|data engineer|dba)\b/i.test(norm)) {
    return 'Database Architects';
  }
  if (
    /\b(quan tri he thong|ky su he thong|devops|quan tri mang|sysadmin)\b/i.test(
      norm,
    )
  ) {
    return 'Network and Computer Systems Administrators';
  }
  if (
    /\b(an toan thong tin|an ninh mang|bao mat|cyber security)\b/i.test(norm)
  ) {
    return 'Information Security Analysts';
  }
  if (/\b(phan tich nghiep vu|business analyst|ba)\b/i.test(norm)) {
    return 'Management Analysts';
  }
  if (/\b(quan ly du an|quan tri du an|project manager|pm)\b/i.test(norm)) {
    return 'Computer and Information Systems Managers';
  }
  if (/\b(kien truc su|architect)\b/i.test(norm)) {
    return 'Computer Systems Architects';
  }

  return title;
}

@Injectable()
export class OnetService {
  private readonly logger = new Logger(OnetService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tìm kiếm chức danh công việc O*NET tương thích nhất dựa trên tiêu đề công việc (Job Title).
   * Hỗ trợ chuẩn hóa chức danh tiếng Việt sang tiếng Anh trước khi tìm kiếm.
   * Sử dụng pg_trgm fuzzy matching trên bảng onet.job_titles (54K alternate titles)
   * và fallback sang onet.occupation_data.
   */
  async findOccupationByTitle(
    title: string,
  ): Promise<OnetOccupationDto | null> {
    if (!title || typeof title !== 'string') {
      return null;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return null;
    }

    const translatedTitle = normalizeVietnameseJobTitle(cleanTitle);
    const searchQueries =
      translatedTitle !== cleanTitle
        ? [translatedTitle, cleanTitle]
        : [cleanTitle];

    try {
      // 1. Khớp chính xác tên chuẩn (Exact case-insensitive match on occupation_data)
      for (const query of searchQueries) {
        const exactMatches = await this.prisma.$queryRaw<OnetOccupationDto[]>`
          SELECT 
            onetsoc_code AS "socCode",
            title,
            description,
            title AS "matchedTitle",
            1.0::float AS "similarityScore"
          FROM onet.occupation_data
          WHERE LOWER(title) = LOWER(${query})
          LIMIT 1;
        `;

        if (exactMatches.length > 0) {
          return exactMatches[0];
        }
      }

      // 2. Tìm kiếm mờ thông qua 54K alternate job titles (Trigram GIN search + word_similarity)
      for (const query of searchQueries) {
        const fuzzyAlternateMatches = await this.prisma.$queryRaw<
          OnetOccupationDto[]
        >`
          SELECT 
            jt.onetsoc_code AS "socCode",
            occ.title,
            occ.description,
            jt.job_title AS "matchedTitle",
            GREATEST(
              similarity(jt.job_title, ${query}),
              word_similarity(${query}, jt.job_title)
            )::float AS "similarityScore"
          FROM onet.job_titles jt
          JOIN onet.occupation_data occ ON jt.onetsoc_code = occ.onetsoc_code
          WHERE 
            jt.job_title % ${query} 
            OR ${query} <% jt.job_title
            OR word_similarity(${query}, jt.job_title) >= 0.4
            OR similarity(jt.job_title, ${query}) >= 0.25
          ORDER BY "similarityScore" DESC
          LIMIT 1;
        `;

        if (fuzzyAlternateMatches.length > 0) {
          return fuzzyAlternateMatches[0];
        }
      }

      // 3. Fallback: Tìm kiếm mờ trực tiếp trên onet.occupation_data.title
      for (const query of searchQueries) {
        const fallbackMatches = await this.prisma.$queryRaw<
          OnetOccupationDto[]
        >`
          SELECT 
            occ.onetsoc_code AS "socCode",
            occ.title,
            occ.description,
            occ.title AS "matchedTitle",
            similarity(occ.title, ${query})::float AS "similarityScore"
          FROM onet.occupation_data occ
          WHERE occ.title % ${query} OR similarity(occ.title, ${query}) >= 0.20
          ORDER BY "similarityScore" DESC
          LIMIT 1;
        `;

        if (fallbackMatches.length > 0) {
          return fallbackMatches[0];
        }
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
  async getOccupationBySocCode(
    socCode: string,
  ): Promise<OnetOccupationDto | null> {
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

  /**
   * Tìm kiếm danh sách chức danh O*NET tương thích.
   * Hỗ trợ tìm kiếm mờ pg_trgm trên cả 54K alternate titles và canonical titles.
   * Deduplicate theo SOC Code: mỗi mã SOC chỉ trả về 1 bản ghi tốt nhất.
   * Nếu query rỗng, trả về danh sách 10 chức danh IT phổ biến.
   */
  async searchOccupations(
    query?: string,
    limit = 10,
  ): Promise<OnetOccupationDto[]> {
    const cleanLimit = Math.max(1, Math.min(50, limit || 10));
    const cleanQuery = typeof query === 'string' ? query.trim() : '';

    if (!cleanQuery) {
      try {
        const topOccupations = await this.prisma.$queryRaw<OnetOccupationDto[]>`
          SELECT 
            onetsoc_code AS "socCode",
            title,
            description,
            title AS "matchedTitle",
            1.0::float AS "similarityScore"
          FROM onet.occupation_data
          WHERE onetsoc_code IN (
            '15-1252.00', '15-1253.00', '15-1244.00', '15-1243.00', '15-1212.00',
            '15-1251.00', '15-1241.00', '15-1299.08', '11-3021.00', '15-1232.00'
          )
          ORDER BY title ASC
          LIMIT ${cleanLimit};
        `;
        return topOccupations;
      } catch (error) {
        this.logger.error(
          `Error querying default O*NET occupations: ${error instanceof Error ? error.message : String(error)}`,
        );
        return [];
      }
    }

    const translatedTitle = normalizeVietnameseJobTitle(cleanQuery);
    const searchTerm = translatedTitle.trim() || cleanQuery;
    const likePattern = `%${searchTerm}%`;

    try {
      const records = await this.prisma.$queryRaw<OnetOccupationDto[]>`
        SELECT 
          "socCode",
          title,
          description,
          "matchedTitle",
          "similarityScore"
        FROM (
          SELECT DISTINCT ON (sub."socCode")
            sub."socCode",
            sub.title,
            sub.description,
            sub."matchedTitle",
            sub."similarityScore"
          FROM (
            SELECT 
              jt.onetsoc_code AS "socCode",
              occ.title,
              occ.description,
              jt.job_title AS "matchedTitle",
              GREATEST(
                similarity(jt.job_title, ${searchTerm}),
                word_similarity(${searchTerm}, jt.job_title),
                CASE WHEN jt.job_title ILIKE ${likePattern} THEN 0.35 ELSE 0 END
              )::float AS "similarityScore"
            FROM onet.job_titles jt
            JOIN onet.occupation_data occ ON jt.onetsoc_code = occ.onetsoc_code
            WHERE 
              jt.job_title % ${searchTerm} 
              OR ${searchTerm} <% jt.job_title
              OR word_similarity(${searchTerm}, jt.job_title) >= 0.25
              OR similarity(jt.job_title, ${searchTerm}) >= 0.2
              OR jt.job_title ILIKE ${likePattern}

            UNION ALL

            SELECT 
              occ.onetsoc_code AS "socCode",
              occ.title,
              occ.description,
              occ.title AS "matchedTitle",
              GREATEST(
                similarity(occ.title, ${searchTerm}),
                word_similarity(${searchTerm}, occ.title),
                CASE WHEN occ.title ILIKE ${likePattern} THEN 0.40 ELSE 0 END
              )::float AS "similarityScore"
            FROM onet.occupation_data occ
            WHERE 
              occ.title % ${searchTerm}
              OR ${searchTerm} <% occ.title
              OR word_similarity(${searchTerm}, occ.title) >= 0.25
              OR similarity(occ.title, ${searchTerm}) >= 0.2
              OR occ.title ILIKE ${likePattern}
          ) sub
          ORDER BY sub."socCode", sub."similarityScore" DESC
        ) deduplicated
        ORDER BY "similarityScore" DESC
        LIMIT ${cleanLimit};
      `;

      return records;
    } catch (error) {
      this.logger.error(
        `Error searching O*NET occupations for query "${cleanQuery}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }
}
