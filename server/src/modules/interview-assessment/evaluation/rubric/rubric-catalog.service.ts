import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { CONTEXT_PACK_DATA, type ContextPackId } from './context-pack.data';

@Injectable()
export class RubricCatalogService {
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
    return '9.0.0';
  }
}
