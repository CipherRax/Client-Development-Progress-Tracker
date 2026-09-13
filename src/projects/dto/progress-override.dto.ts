import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ProgressOverrideDto {
  @ApiProperty({ description: 'Manual progress percentage (0-100) that replaces automatic calculation.' })
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage: number;

  @ApiProperty({ required: false, description: 'Optional reason recorded in the activity history.' })
  @IsOptional()
  @IsString()
  reason?: string;
}