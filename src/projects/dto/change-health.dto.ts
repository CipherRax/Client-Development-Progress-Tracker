import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProjectHealth } from '@prisma/client';

export class ChangeProjectHealthDto {
  @ApiProperty({ enum: ProjectHealth })
  @IsEnum(ProjectHealth)
  health: ProjectHealth;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
