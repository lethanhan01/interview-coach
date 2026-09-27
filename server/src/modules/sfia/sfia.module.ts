import { Module } from '@nestjs/common';
import { PrismaModule } from '@infra/database/prisma/prisma.module';
import { SFIA_FACADE_TOKEN } from './contracts/sfia.facade.interface';
import { SFIA_REPOSITORY_TOKEN } from './domain/sfia-repository.interface';
import { SFIA_ADMIN_REPOSITORY_TOKEN } from './domain/sfia-admin-repository.interface';
import { SfiaRepository } from './repositories/sfia.repository';
import { SfiaAdminRepository } from './repositories/sfia-admin.repository';
import { SfiaService } from './sfia.service';
import { SfiaAdminService } from './sfia-admin.service';
import { SfiaFacade } from './sfia.facade';
import { SfiaAdminController } from './sfia-admin.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SfiaAdminController],
  providers: [
    // --- Public SFIA repository ---
    SfiaRepository,
    {
      provide: SFIA_REPOSITORY_TOKEN,
      useExisting: SfiaRepository,
    },
    // --- Admin SFIA repository ---
    SfiaAdminRepository,
    {
      provide: SFIA_ADMIN_REPOSITORY_TOKEN,
      useExisting: SfiaAdminRepository,
    },
    // --- Services ---
    SfiaService,
    SfiaAdminService,
    // --- Facade ---
    SfiaFacade,
    {
      provide: SFIA_FACADE_TOKEN,
      useExisting: SfiaFacade,
    },
  ],
  exports: [
    SFIA_FACADE_TOKEN,
    SFIA_REPOSITORY_TOKEN,
    SFIA_ADMIN_REPOSITORY_TOKEN,
    SfiaFacade,
    SfiaService,
    SfiaAdminService,
  ],
})
export class SfiaModule {}
