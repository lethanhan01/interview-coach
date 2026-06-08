import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ReferenceDataService } from './reference-data.service';

@Global()
@Module({
  providers: [PrismaService, ReferenceDataService],
  exports: [PrismaService, ReferenceDataService],
})
export class PrismaModule {}
