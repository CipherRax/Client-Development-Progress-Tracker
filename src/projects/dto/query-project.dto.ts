import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ProjectHealth, ProjectStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryProjectDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectHealth })
  @IsOptional()
  @IsEnum(ProjectHealth)
  health?: ProjectHealth;

  @ApiPropertyOptional({ description: 'Filter archived projects: true | false' })
  @IsOptional()
  @IsBooleanString()
  archived?: string;

  @ApiPropertyOptional({ description: 'Filter completed projects: true | false' })
  @IsOptional()
  @IsBooleanString()
  completed?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDateTo?: string;
}
