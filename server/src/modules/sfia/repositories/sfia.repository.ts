import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ISfiaRepository } from '../domain/sfia-repository.interface';
import {
  SfiaSkillRawRow,
  SfiaLevelRawRow,
} from './types/sfia-raw-row.types';

@Injectable()
export class SfiaRepository implements ISfiaRepository {
  private readonly logger = new Logger(SfiaRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx || this.prisma;
  }

  async loadAllRawSkills(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaSkillRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<SfiaSkillRawRow[]>`
        SELECT 
          s.code,
          s.name,
          COALESCE(sc.category_code, '') AS "categoryCode",
          s.subcategory_code AS "subcategoryCode",
          COALESCE(s.overall_description, '') AS "overallDescription",
          s.min_level AS "minLevel",
          s.max_level AS "maxLevel"
        FROM sfia.skills s
        LEFT JOIN sfia.subcategories sc ON s.subcategory_code = sc.code
        ORDER BY s.code ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA skills: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async loadAllRawLevels(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaLevelRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<SfiaLevelRawRow[]>`
        SELECT 
          level_id AS "levelId",
          name,
          COALESCE(essence, '') AS essence,
          COALESCE(description, '') AS description
        FROM sfia.levels
        ORDER BY level_id ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA levels: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
