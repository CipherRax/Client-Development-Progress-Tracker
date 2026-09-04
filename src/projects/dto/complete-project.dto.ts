import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteProjectDto {
  @ApiPropertyOptional({
    description:
      'Force completion even if incomplete milestones remain. Requires a reason and is recorded in the audit history.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
