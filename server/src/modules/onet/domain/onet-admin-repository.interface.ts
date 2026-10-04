import { Prisma } from '@prisma/client';
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
} from '../repositories/types/onet-raw-row.types';

export const ONET_ADMIN_REPOSITORY_TOKEN = Symbol('IOnetAdminRepository');

export interface IOnetAdminRepository {
  getSystemSummary(
    tx?: Prisma.TransactionClient,
  ): Promise<OnetAdminSummaryStatsRaw>;

  getMajorGroupsDistribution(
    tx?: Prisma.TransactionClient,
  ): Promise<SocMajorGroupRawRow[]>;

  searchSidebarOccupations(
    groupCode?: string,
    mappedOnly?: boolean,
    search?: string,
    limit?: number,
    tx?: Prisma.TransactionClient,
  ): Promise<SidebarOccupationRawRow[]>;

  getTopOccupations(
    search?: string,
    sortBy?: 'interviews' | 'jds' | 'mappings',
    limit?: number,
    tx?: Prisma.TransactionClient,
  ): Promise<TopOccupationRawRow[]>;

  getSfiaSkillCoverage(
    limit: number,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaSkillCoverageRawRow[]>;

  getOccupationBaseDetail(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationDetailBaseRawRow | null>;

  getOccupationJobZone(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationJobZoneRawRow | null>;

  getOccupationStatsCounts(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationStatsCountsRawRow>;

  getOccupationTechSkills(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationTechSkillRawRow[]>;

  getOccupationTasks(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationTaskRawRow[]>;

  getAlternateTitlesCount(
    socCode: string,
    search?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number>;

  getAlternateTitlesPaginated(
    socCode: string,
    search: string | undefined,
    limit: number,
    offset: number,
    tx?: Prisma.TransactionClient,
  ): Promise<string[]>;

  getOccupationSfiaMappings(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationSfiaMappingRawRow[]>;

  findSfiaMappingById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationSfiaMappingRawRow | null>;

  findSfiaMappingByUnique(
    socCode: string,
    sfiaSkillCode: string,
    targetSfiaLevel: number,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationSfiaMappingRawRow | null>;

  createSfiaMapping(
    socCode: string,
    sfiaSkillCode: string,
    targetSfiaLevel: number,
    defaultWeight: number,
    isCore: boolean,
    source?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationSfiaMappingRawRow>;

  updateSfiaMapping(
    id: string,
    targetSfiaLevel?: number,
    defaultWeight?: number,
    isCore?: boolean,
    source?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OccupationSfiaMappingRawRow>;

  deleteSfiaMapping(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean>;

  deleteOccupationMappings(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number>;
}
