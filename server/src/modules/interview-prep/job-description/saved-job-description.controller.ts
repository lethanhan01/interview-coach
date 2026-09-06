import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles, CurrentUser } from '@core/common/decorators';
import { SaveJobDescriptionDto } from './dto/save-job-description.dto';
import { SavedJobDescriptionService } from './saved-job-description.service';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';

@Controller('saved-job-descriptions')
@Roles(UserRole.candidate)
@ApiTags('Saved Job Descriptions')
@ApiCookieAuth('cookieAuth')
export class SavedJobDescriptionController {
  constructor(
    private readonly savedJobDescriptionService: SavedJobDescriptionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List saved job descriptions' })
  @ApiOkResponse({ description: 'Saved job descriptions.' })
  @ApiCommonErrors(401)
  async findAll(@CurrentUser('id') userId: string) {
    return {
      items: await this.savedJobDescriptionService.findAll(userId),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Save a job description' })
  @ApiCreatedResponse({ description: 'Saved job description.' })
  @ApiCommonErrors(400, 401)
  async save(
    @Body() dto: SaveJobDescriptionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.savedJobDescriptionService.save(userId, dto);
  }
}
