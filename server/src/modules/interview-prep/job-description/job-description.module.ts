import { Module } from '@nestjs/common';
import { PrismaModule } from '@infra/database/prisma/prisma.module';
import { OnetModule } from '@modules/onet/onet.module';
import { SavedJobDescriptionController } from './saved-job-description.controller';
import { SavedJobDescriptionService } from './saved-job-description.service';

@Module({
  imports: [PrismaModule, OnetModule],
  controllers: [SavedJobDescriptionController],
  providers: [SavedJobDescriptionService],
  exports: [SavedJobDescriptionService],
})
export class JobDescriptionModule {}
export { JobDescriptionModule as SavedJobDescriptionModule };
