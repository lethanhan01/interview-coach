import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { REPORT_QUEUE } from '../common/constants/queue.constants';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: REPORT_QUEUE })],
  providers: [ReportService],
  controllers: [ReportController],
  exports: [ReportService],
})
export class ReportModule {}
