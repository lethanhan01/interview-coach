import { Module } from '@nestjs/common';
import { PrismaModule } from '@infra/database/prisma/prisma.module';
import { SfiaModule } from '@modules/sfia/sfia.module';
import { AiModule } from '@infra/ai/ai.module';
import { HybridMappingService } from './hybrid-mapping.service';

@Module({
  imports: [PrismaModule, SfiaModule, AiModule],
  providers: [HybridMappingService],
  exports: [HybridMappingService],
})
export class TaxonomyModule {}
