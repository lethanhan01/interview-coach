import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnetOccupationDto, OnetTechDto } from './contracts/onet.dto';
import { ONET_REPOSITORY_TOKEN } from './domain/onet-repository.interface';
import type { IOnetRepository } from './domain/onet-repository.interface';

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

  constructor(
    @Inject(ONET_REPOSITORY_TOKEN)
    private readonly onetRepository: IOnetRepository,
  ) {}

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
        const exactMatch =
          await this.onetRepository.findExactOccupationByTitle(query);
        if (exactMatch) {
          return exactMatch;
        }
      }

      // 2. Tìm kiếm mờ thông qua 54K alternate job titles (Trigram GIN search + word_similarity)
      for (const query of searchQueries) {
        const fuzzyAlternateMatch =
          await this.onetRepository.findFuzzyAlternateTitles(query);
        if (fuzzyAlternateMatch) {
          return fuzzyAlternateMatch;
        }
      }

      // 3. Fallback: Tìm kiếm mờ trực tiếp trên onet.occupation_data.title
      for (const query of searchQueries) {
        const fallbackMatch =
          await this.onetRepository.findFuzzyOccupationData(query);
        if (fallbackMatch) {
          return fallbackMatch;
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
      return await this.onetRepository.getOccupationBySocCode(cleanSoc);
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
      return await this.onetRepository.getToolsAndTechnology(cleanSoc);
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
        return await this.onetRepository.getDefaultOccupations(cleanLimit);
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
      return await this.onetRepository.searchOccupationsWithScores(
        searchTerm,
        likePattern,
        cleanLimit,
      );
    } catch (error) {
      this.logger.error(
        `Error searching O*NET occupations for query "${cleanQuery}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }
}
