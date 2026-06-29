import { Module } from '@nestjs/common';
import { SavedJobDescriptionController } from './saved-job-description.controller';
import { SavedJobDescriptionService } from './saved-job-description.service';

@Module({
  controllers: [SavedJobDescriptionController],
  providers: [SavedJobDescriptionService],
  exports: [SavedJobDescriptionService],
})
export class SavedJobDescriptionModule {}
