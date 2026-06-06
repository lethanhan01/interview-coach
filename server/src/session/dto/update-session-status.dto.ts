import { IsEnum } from 'class-validator';

export class UpdateSessionStatusDto {
  @IsEnum(['active', 'completed'])
  status: 'active' | 'completed';
}
