import { Module } from '@nestjs/common';
import { PrismaModule } from '@infra/database/prisma/prisma.module';
import { ONET_FACADE_TOKEN } from './contracts/onet.facade.interface';
import { OnetService } from './onet.service';
import { OnetFacade } from './onet.facade';

@Module({
  imports: [PrismaModule],
  providers: [
    OnetService,
    OnetFacade,
    {
      provide: ONET_FACADE_TOKEN,
      useExisting: OnetFacade,
    },
  ],
  exports: [ONET_FACADE_TOKEN, OnetFacade, OnetService],
})
export class OnetModule {}
