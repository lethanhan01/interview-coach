import { Prisma } from '@prisma/client';
import {
  SfiaSkillRawRow,
  SfiaLevelRawRow,
  SfiaSkillLevelRawRow,
} from '../repositories/types/sfia-raw-row.types';

export const SFIA_REPOSITORY_TOKEN = Symbol('ISfiaRepository');

export interface ISfiaRepository {
  /**
   * Lấy toàn bộ danh sách kỹ năng SFIA từ bảng sfia.skills kèm category từ sfia.subcategories
   */
  loadAllRawSkills(tx?: Prisma.TransactionClient): Promise<SfiaSkillRawRow[]>;

  /**
   * Lấy toàn bộ 7 cấp độ SFIA từ bảng sfia.levels
   */
  loadAllRawLevels(tx?: Prisma.TransactionClient): Promise<SfiaLevelRawRow[]>;

  /**
   * Lấy toàn bộ mô tả chi tiết từng cấp độ của từng kỹ năng từ sfia.skill_levels
   */
  loadAllRawSkillLevels?(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaSkillLevelRawRow[]>;
}
