import { Prisma } from '@prisma/client';
import { OnetOccupationDto, OnetTechDto } from '../contracts/onet.dto';

export const ONET_REPOSITORY_TOKEN = Symbol('IOnetRepository');

export interface IOnetRepository {
  /**
   * Khớp chính xác tên chuẩn (case-insensitive) trên bảng onet.occupation_data
   */
  findExactOccupationByTitle(
    query: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetOccupationDto | null>;

  /**
   * Tìm kiếm mờ pg_trgm trên 54K alternate job titles (onet.job_titles JOIN onet.occupation_data)
   */
  findFuzzyAlternateTitles(
    query: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetOccupationDto | null>;

  /**
   * Tìm kiếm mờ pg_trgm fallback trên onet.occupation_data.title
   */
  findFuzzyOccupationData(
    query: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetOccupationDto | null>;

  /**
   * Lấy thông tin chức danh O*NET theo mã SOC chuẩn (ví dụ '15-1252.00')
   */
  getOccupationBySocCode(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetOccupationDto | null>;

  /**
   * Lấy danh sách công cụ và công nghệ phần mềm theo mã SOC
   */
  getToolsAndTechnology(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetTechDto[]>;

  /**
   * Lấy danh sách chức danh IT mặc định khi query rỗng
   */
  getDefaultOccupations(
    limit: number,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetOccupationDto[]>;

  /**
   * Tìm kiếm danh sách nghề nghiệp kết hợp pg_trgm trên cả job_titles và occupation_data, deduplicate theo socCode
   */
  searchOccupationsWithScores(
    searchTerm: string,
    likePattern: string,
    limit: number,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetOccupationDto[]>;
}
