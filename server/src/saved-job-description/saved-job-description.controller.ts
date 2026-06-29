import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SaveJobDescriptionDto } from './dto/save-job-description.dto';
import { SavedJobDescriptionService } from './saved-job-description.service';

@Controller('saved-job-descriptions')
export class SavedJobDescriptionController {
  constructor(
    private readonly savedJobDescriptionService: SavedJobDescriptionService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: { user: { id: string } }) {
    return {
      items: await this.savedJobDescriptionService.findAll(req.user.id),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async save(
    @Body() dto: SaveJobDescriptionDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.savedJobDescriptionService.save(req.user.id, dto);
  }
}
