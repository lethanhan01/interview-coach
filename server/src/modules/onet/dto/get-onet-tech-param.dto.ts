import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class GetOnetTechParamDto {
  @ApiProperty({
    description: 'Mã chức danh nghề nghiệp O*NET SOC chuẩn',
    example: '15-1252.00',
  })
  @IsString()
  @Matches(/^\d{2}-\d{4}\.\d{2}$/, {
    message:
      'socCode phải đúng định dạng mã O*NET SOC chuẩn (ví dụ: 15-1252.00)',
  })
  socCode: string;
}
