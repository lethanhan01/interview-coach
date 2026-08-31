import { Module } from '@nestjs/common';
import { SfiaTaxonomyService } from './sfia-taxonomy.service';
import { SfiaMappingService } from './sfia-mapping.service';

@Module({
  providers: [SfiaTaxonomyService, SfiaMappingService],
  exports: [SfiaTaxonomyService, SfiaMappingService],
})
export class SfiaModule {}
