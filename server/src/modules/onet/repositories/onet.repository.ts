import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { IOnetRepository } from '../domain/onet-repository.interface';
import { OnetOccupationDto, OnetTechDto } from '../contracts/onet.dto';
import {
  OnetOccupationRawRow,
  OnetTechRawRow,
} from './types/onet-raw-row.types';

@Injectable()
export class OnetRepository implements IOnetRepository {
  private readonly logger = new Logger(OnetRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx || this.prisma;
  }

  async findExactOccupationByTitle(
    query: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetOccupationDto | null> {
    try {
      const records = await this.getClient(tx).$queryRaw<
        OnetOccupationRawRow[]
      >`
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

      return records.length > 0 ? this.mapOccupationRow(records[0]) : null;
    } catch (error) {
      this.logger.error(
        `Error querying exact occupation for "${query}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async findFuzzyAlternateTitles(
    query: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetOccupationDto | null> {
    try {
      const records = await this.getClient(tx).$queryRaw<
        OnetOccupationRawRow[]
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

      return records.length > 0 ? this.mapOccupationRow(records[0]) : null;
    } catch (error) {
      this.logger.error(
        `Error querying fuzzy alternate titles for "${query}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async findFuzzyOccupationData(
    query: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetOccupationDto | null> {
    try {
      const records = await this.getClient(tx).$queryRaw<
        OnetOccupationRawRow[]
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

      return records.length > 0 ? this.mapOccupationRow(records[0]) : null;
    } catch (error) {
      this.logger.error(
        `Error querying fuzzy occupation data for "${query}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getOccupationBySocCode(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetOccupationDto | null> {
    try {
      const records = await this.getClient(tx).$queryRaw<
        OnetOccupationRawRow[]
      >`
        SELECT 
          onetsoc_code AS "socCode",
          title,
          description,
          title AS "matchedTitle",
          1.0::float AS "similarityScore"
        FROM onet.occupation_data
        WHERE onetsoc_code = ${socCode}
        LIMIT 1;
      `;

      return records.length > 0 ? this.mapOccupationRow(records[0]) : null;
    } catch (error) {
      this.logger.error(
        `Error querying occupation by socCode "${socCode}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getToolsAndTechnology(
    socCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetTechDto[]> {
    try {
      const records = await this.getClient(tx).$queryRaw<OnetTechRawRow[]>`
        SELECT 
          workplace_example AS "example",
          (hot_technology = 'Y') AS "isHotTechnology",
          (in_demand = 'Y') AS "inDemand"
        FROM onet.software_skills
        WHERE onetsoc_code = ${socCode}
        ORDER BY (hot_technology = 'Y') DESC, workplace_example ASC;
      `;

      return records.map((item) => ({
        example: item.example,
        isHotTechnology: Boolean(item.isHotTechnology),
        inDemand: Boolean(item.inDemand),
      }));
    } catch (error) {
      this.logger.error(
        `Error querying tools & tech for socCode "${socCode}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getDefaultOccupations(
    limit: number,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetOccupationDto[]> {
    try {
      const records = await this.getClient(tx).$queryRaw<
        OnetOccupationRawRow[]
      >`
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
        LIMIT ${limit};
      `;

      return records.map((r) => this.mapOccupationRow(r));
    } catch (error) {
      this.logger.error(
        `Error querying default occupations: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async searchOccupationsWithScores(
    searchTerm: string,
    likePattern: string,
    limit: number,
    tx?: Prisma.TransactionClient,
  ): Promise<OnetOccupationDto[]> {
    try {
      const records = await this.getClient(tx).$queryRaw<
        OnetOccupationRawRow[]
      >`
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
        LIMIT ${limit};
      `;

      return records.map((r) => this.mapOccupationRow(r));
    } catch (error) {
      this.logger.error(
        `Error querying search occupations with scores: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private mapOccupationRow(row: OnetOccupationRawRow): OnetOccupationDto {
    return {
      socCode: row.socCode,
      title: row.title,
      description: row.description,
      matchedTitle: row.matchedTitle,
      similarityScore: Number(row.similarityScore) || 0,
    };
  }
}
