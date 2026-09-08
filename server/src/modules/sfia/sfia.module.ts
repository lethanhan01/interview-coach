import { Module } from '@nestjs/common';
import { PrismaModule } from '@infra/database/prisma/prisma.module';
import { SFIA_FACADE_TOKEN } from './contracts/sfia.facade.interface';
import { SFIA_REPOSITORY_TOKEN } from './domain/sfia-repository.interface';
import { SfiaRepository } from './repositories/sfia.repository';
import { SfiaService } from './sfia.service';
import { SfiaFacade } from './sfia.facade';

@Module({
  imports: [PrismaModule],
  providers: [
    SfiaRepository,
    {
      provide: SFIA_REPOSITORY_TOKEN,
      useExisting: SfiaRepository,
    },
    SfiaService,
    SfiaFacade,
    {
      provide: SFIA_FACADE_TOKEN,
      useExisting: SfiaFacade,
    },
  ],
  exports: [SFIA_FACADE_TOKEN, SFIA_REPOSITORY_TOKEN, SfiaFacade, SfiaService],
})
export class SfiaModule {}
