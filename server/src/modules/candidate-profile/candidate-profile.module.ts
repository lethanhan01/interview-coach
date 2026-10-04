import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user/user.module';
import { CandidateProfileController } from './candidate-profile.controller';
import { CandidateProfileService } from './candidate-profile.service';
import { CandidateProfileFacade } from './contracts/candidate-profile-facade.service';
import { CANDIDATE_PROFILE_FACADE_TOKEN } from './contracts/candidate-profile.facade.interface';

@Module({
  imports: [UserModule],
  controllers: [CandidateProfileController],
  providers: [
    CandidateProfileService,
    CandidateProfileFacade,
    {
      provide: CANDIDATE_PROFILE_FACADE_TOKEN,
      useExisting: CandidateProfileFacade,
    },
  ],
  exports: [
    CANDIDATE_PROFILE_FACADE_TOKEN,
    CandidateProfileFacade,
    CandidateProfileService,
  ],
})
export class CandidateProfileModule {}
