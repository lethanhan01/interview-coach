import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ContextPackService,
  type ContextPackType,
} from './context-pack.service';
import type { SessionType } from '../ai/pipelines/interview-pipeline.interface';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '../common/swagger/api-error-responses.decorator';

@Controller('rubrics')
@ApiTags('Rubrics')
@ApiCookieAuth('cookieAuth')
export class RubricController {
  constructor(private readonly contextPackService: ContextPackService) {}

  @Get(':contextPackId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the active scoring rubric for a context pack' })
  @ApiParam({ name: 'contextPackId', enum: ['VN', 'Western'] })
  @ApiQuery({
    name: 'sessionType',
    required: false,
    enum: ['hr', 'technical', 'mixed'],
    example: 'mixed',
  })
  @ApiOkResponse({ description: 'Active rubric and weighted dimensions.' })
  @ApiCommonErrors(400, 401, 404)
  async getActiveRubric(
    @Param('contextPackId') contextPackId: ContextPackType,
    @Query('sessionType') sessionType: SessionType = 'mixed',
  ) {
    const config = await this.contextPackService.getContextPack(contextPackId);
    const behavioral = {
      label: 'Tiêu chí hành vi',
      categoryWeightPct:
        sessionType === 'hr'
          ? 100
          : Math.round((config.scoringWeights.behavioral_weight ?? 0) * 100),
      dimensions: config.behavioralDimensions.map((dimension) => ({
        code: dimension.id,
        nameVi: dimension.name,
        weightPct: Math.round(dimension.weight * 100),
      })),
    };
    const technical = {
      label: 'Tiêu chí kỹ thuật',
      categoryWeightPct:
        sessionType === 'technical'
          ? 100
          : Math.round((config.scoringWeights.technical_weight ?? 0) * 100),
      dimensions: config.technicalDimensions.map((dimension) => ({
        code: dimension.id,
        nameVi: dimension.name,
        weightPct: Math.round(dimension.weight * 100),
      })),
    };
    const categories =
      sessionType === 'hr'
        ? [behavioral]
        : sessionType === 'technical'
          ? [technical]
          : [behavioral, technical];

    return {
      contextPackId,
      sessionType,
      categories,
      hint: buildRubricHint(categories, sessionType),
    };
  }
}

function buildRubricHint(
  categories: {
    label: string;
    categoryWeightPct: number;
    dimensions: { code: string; nameVi: string; weightPct: number }[];
  }[],
  sessionType: SessionType,
): string {
  if (sessionType === 'mixed') {
    return categories
      .map((category) => `${category.label} ${category.categoryWeightPct}%`)
      .join(' + ');
  }

  const category = categories[0];
  return `${category.label}: ${category.dimensions
    .map(
      (dimension) =>
        `${dimension.code} ${dimension.nameVi} (${dimension.weightPct}%)`,
    )
    .join(' · ')}`;
}
