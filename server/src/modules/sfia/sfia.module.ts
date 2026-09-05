import { Module } from '@nestjs/common';
import { PrismaModule } from '@infra/database/prisma/prisma.module';
import { SFIA_FACADE_TOKEN } from './contracts/sfia.facade.interface';
import { SfiaService } from './sfia.service';
import { SfiaFacade } from './sfia.facade';

@Module({
  imports: [PrismaModule],
  providers: [
    SfiaService,
    SfiaFacade,
    {
      provide: SFIA_FACADE_TOKEN,
      useExisting: SfiaFacade,
    },
  ],
  exports: [SFIA_FACADE_TOKEN, SfiaFacade, SfiaService],
})
export class SfiaModule {}
