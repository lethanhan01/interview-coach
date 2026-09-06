import { Injectable } from '@nestjs/common';
import { CandidateProfileService } from '../candidate-profile.service';
import { CandidateProfileResponseDto } from '../dto/candidate-profile-response.dto';
import { ICandidateProfileFacade } from './candidate-profile.facade.interface';

@Injectable()
export class CandidateProfileFacade implements ICandidateProfileFacade {
  constructor(
    private readonly candidateProfileService: CandidateProfileService,
  ) {}

  getCandidateProfile(userId: string): Promise<CandidateProfileResponseDto> {
    return this.candidateProfileService.getProfile(userId);
  }
}
