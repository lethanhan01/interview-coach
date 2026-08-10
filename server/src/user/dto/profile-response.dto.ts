import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class ProfileDetailsResponseDto {
  @ApiPropertyOptional() personality?: string | null;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  education?: Prisma.JsonValue | null;
  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  workExperience?: Prisma.JsonValue | null;
  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  projects?: Prisma.JsonValue | null;
  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  technicalSkills?: Prisma.JsonValue | null;
  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  certifications?: Prisma.JsonValue | null;
  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  awards?: Prisma.JsonValue | null;
}

export class ProfileResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional() firstname: string | null;
  @ApiPropertyOptional() lastname: string | null;
  @ApiPropertyOptional({ type: ProfileDetailsResponseDto, nullable: true })
  profile: ProfileDetailsResponseDto | null;
}
