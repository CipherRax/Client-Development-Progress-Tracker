import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ChangeRequestStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryChangeRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ChangeRequestStatus })
  @IsOptional()
  @IsEnum(ChangeRequestStatus)
  status?: ChangeRequestStatus;
}
