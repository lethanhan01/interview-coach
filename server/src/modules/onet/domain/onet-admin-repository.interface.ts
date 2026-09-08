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
}
