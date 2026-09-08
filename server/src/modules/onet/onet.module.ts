import { Module } from '@nestjs/common';
import { PrismaModule } from '@infra/database/prisma/prisma.module';
import { ONET_FACADE_TOKEN } from './contracts/onet.facade.interface';
import { ONET_REPOSITORY_TOKEN } from './domain/onet-repository.interface';
import { ONET_ADMIN_REPOSITORY_TOKEN } from './domain/onet-admin-repository.interface';
import { OnetRepository } from './repositories/onet.repository';
import { OnetAdminRepository } from './repositories/onet-admin.repository';
import { OnetService } from './onet.service';
import { OnetAdminService } from './onet-admin.service';
import { OnetFacade } from './onet.facade';
import { OnetController } from './onet.controller';

@Module({
  imports: [PrismaModule],
  controllers: [OnetController],
  providers: [
    OnetRepository,
    {
      provide: ONET_REPOSITORY_TOKEN,
      useExisting: OnetRepository,
    },
    OnetAdminRepository,
    {
      provide: ONET_ADMIN_REPOSITORY_TOKEN,
      useExisting: OnetAdminRepository,
    },
    OnetService,
    OnetAdminService,
    OnetFacade,
    {
      provide: ONET_FACADE_TOKEN,
      useExisting: OnetFacade,
    },
  ],
  exports: [
    ONET_FACADE_TOKEN,
    ONET_REPOSITORY_TOKEN,
    ONET_ADMIN_REPOSITORY_TOKEN,
    OnetFacade,
    OnetService,
    OnetAdminService,
  ],
})
export class OnetModule {}
