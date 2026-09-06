import { Controller, Get, Patch, Body } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles, CurrentUser } from '@core/common/decorators';
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
  async getProfile(@CurrentUser() userOrReq: any) {
    const userId = userOrReq?.user?.id ?? userOrReq?.id ?? userOrReq;
    return this.candidateProfileService.getProfile(userId);
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
    @CurrentUser() userOrReq: any,
  ) {
    const userId = userOrReq?.user?.id ?? userOrReq?.id ?? userOrReq;
    return this.candidateProfileService.upsertProfile(userId, dto);
  }
}
