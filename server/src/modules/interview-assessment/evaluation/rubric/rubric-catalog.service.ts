import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { CONTEXT_PACK_DATA, type ContextPackId } from './context-pack.data';

@Injectable()
export class RubricCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  ensureContextPack(id: ContextPackId): void {
    if (!CONTEXT_PACK_DATA.some((pack) => pack.id === id)) {
      throw new InterviewAIException(
        ErrorCode.RUBRIC_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
        `Unsupported context pack: ${id}`,
      );
    }
  }

  async ensureActiveRubricVersion(id: ContextPackId): Promise<string> {
    this.ensureContextPack(id);

    const version = await this.prisma.rubricVersion.findFirst({
      where: { contextPackId: id, status: 'active' },
      orderBy: { publishedAt: 'desc' },
      select: { id: true },
    });
    if (!version) {
      throw new InterviewAIException(
        ErrorCode.RUBRIC_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        `No active rubric version for context pack: ${id}`,
      );
    }
    return version.id;
  }
}
