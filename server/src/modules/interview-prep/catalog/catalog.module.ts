import { Module } from '@nestjs/common';
import { SfiaModule } from '@modules/sfia/sfia.module';
import { CatalogController } from './catalog.controller';
import { InterviewOptionsCatalogService } from './interview-options-catalog.service';

@Module({
  imports: [SfiaModule],
  controllers: [CatalogController],
  providers: [InterviewOptionsCatalogService],
  exports: [InterviewOptionsCatalogService],
})
export class CatalogModule {}
