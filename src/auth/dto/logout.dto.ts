import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'If omitted, all active sessions for this admin are revoked.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
