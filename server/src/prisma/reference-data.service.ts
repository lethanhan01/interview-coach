import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CONTEXT_PACK_DATA, ContextPackId } from './context-pack.data';

@Injectable()
export class ReferenceDataService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReferenceDataService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureContextPacks();
  }

  async ensureContextPack(id: ContextPackId): Promise<void> {
    await Promise.resolve();
    const pack = CONTEXT_PACK_DATA.find((item) => item.id === id);
    if (!pack) {
      throw new Error(`Unsupported context pack: ${id}`);
    }
  }

  async ensureContextPacks(): Promise<void> {
    for (const pack of CONTEXT_PACK_DATA) {
      await this.ensureContextPack(pack.id);
    }

    for (const pack of CONTEXT_PACK_DATA) {
      for (const legacyId of pack.legacyIds) {
        await this.prisma.interviewSession.updateMany({
          where: { contextPackId: legacyId },
          data: { contextPackId: pack.id },
        });
        await this.prisma.questionBank.updateMany({
          where: { contextPackId: legacyId },
          data: { contextPackId: pack.id },
        });
      }
    }

    this.logger.log('Context pack constants are ready');
  }
}
