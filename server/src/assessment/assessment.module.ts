import { Module } from '@nestjs/common';
import { RubricCatalogService } from './rubric/rubric-catalog.service';

@Module({
  providers: [RubricCatalogService],
  exports: [RubricCatalogService],
})
export class AssessmentModule {}
