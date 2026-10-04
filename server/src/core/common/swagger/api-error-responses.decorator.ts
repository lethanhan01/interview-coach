import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from './api-error-response.dto';

export function ApiCommonErrors(...statuses: number[]) {
  return applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        type: ApiErrorResponseDto,
        description: HttpStatus[status],
      }),
    ),
  );
}
