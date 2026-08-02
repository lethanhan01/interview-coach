import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SaveJobDescriptionDto } from './dto/save-job-description.dto';
import { SavedJobDescriptionService } from './saved-job-description.service';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '../common/swagger/api-error-responses.decorator';

@Controller('saved-job-descriptions')
@ApiTags('Saved Job Descriptions')
@ApiCookieAuth('cookieAuth')
export class SavedJobDescriptionController {
  constructor(
    private readonly savedJobDescriptionService: SavedJobDescriptionService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List saved job descriptions' })
  @ApiOkResponse({ description: 'Saved job descriptions.' })
  @ApiCommonErrors(401)
  async findAll(@Req() req: { user: { id: string } }) {
    return {
      items: await this.savedJobDescriptionService.findAll(req.user.id),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save a job description' })
  @ApiCreatedResponse({ description: 'Saved job description.' })
  @ApiCommonErrors(400, 401)
  async save(
    @Body() dto: SaveJobDescriptionDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.savedJobDescriptionService.save(req.user.id, dto);
  }
}
