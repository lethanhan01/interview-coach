import { CandidateProfileResponseDto } from '../dto/candidate-profile-response.dto';

export const CANDIDATE_PROFILE_FACADE_TOKEN = Symbol('ICandidateProfileFacade');

export interface ICandidateProfileFacade {
  getCandidateProfile(userId: string): Promise<CandidateProfileResponseDto>;
}
