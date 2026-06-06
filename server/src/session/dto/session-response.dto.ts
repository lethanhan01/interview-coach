export class SessionResponseDto {
  id: string;
  status: string;
  sessionType: string;
  contextPackId: string;
  numQuestions: number;
  jobDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}
