import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GenerateClientAccessDto {
  @ApiPropertyOptional({ description: 'Optional expiry date/time for the access link (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
