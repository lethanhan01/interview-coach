import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { CandidateProfileService } from './candidate-profile.service';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { CandidateProfileResponseDto } from './dto/candidate-profile-response.dto';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';

@Controller('candidate-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.candidate)
@ApiTags('Candidate Profile')
@ApiCookieAuth('cookieAuth')
export class CandidateProfileController {
  constructor(
    private readonly candidateProfileService: CandidateProfileService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current candidate profile' })
  @ApiOkResponse({
    description: 'Current candidate profile.',
    type: CandidateProfileResponseDto,
  })
  @ApiCommonErrors(401, 403, 404)
  async getProfile(@Req() req: { user: { id: string } }) {
    return this.candidateProfileService.getProfile(req.user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Create or update current candidate profile' })
  @ApiOkResponse({
    description: 'Updated candidate profile.',
    type: CandidateProfileResponseDto,
  })
  @ApiCommonErrors(400, 401, 403, 404)
  async updateProfile(
    @Body() dto: UpdateCandidateProfileDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.candidateProfileService.upsertProfile(req.user.id, dto);
  }
}
