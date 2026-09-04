import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class ChangeProjectStatusDto {
  @ApiProperty({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
