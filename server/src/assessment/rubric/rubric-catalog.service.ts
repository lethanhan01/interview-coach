import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CONTEXT_PACK_DATA, type ContextPackId } from './context-pack.data';

@Injectable()
export class RubricCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureContextPack(id: ContextPackId): Promise<void> {
    if (!CONTEXT_PACK_DATA.some((pack) => pack.id === id)) {
      throw new Error(`Unsupported context pack: ${id}`);
    }
  }

  async ensureActiveRubricVersion(id: ContextPackId): Promise<string> {
    await this.ensureContextPack(id);

    const version = await this.prisma.rubricVersion.findFirst({
      where: { contextPackId: id, status: 'active' },
      orderBy: { publishedAt: 'desc' },
      select: { id: true },
    });
    if (!version) {
      throw new Error(`No active rubric version for context pack: ${id}`);
    }
    return version.id;
  }
}
