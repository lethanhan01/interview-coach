import { Module } from '@nestjs/common';
import { SessionModule } from './session/session.module';
import { TurnModule } from './turn/turn.module';

@Module({
  imports: [SessionModule, TurnModule],
  exports: [SessionModule, TurnModule],
})
export class InterviewLiveModule {}
