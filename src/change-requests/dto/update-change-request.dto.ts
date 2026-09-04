import { PartialType } from '@nestjs/swagger';
import { CreateChangeRequestDto } from './create-change-request.dto';

// Only allow editing while still PENDING; status transitions go through
// dedicated approve/reject/cancel endpoints.
export class UpdateChangeRequestDto extends PartialType(CreateChangeRequestDto) {}
