export class SessionResponseDto {
  id: string;
  status: string;
  sessionType: string;
  contextPackId: string;
  savedJobDescriptionId?: string | null;
  numQuestions: number;
  jobDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}
