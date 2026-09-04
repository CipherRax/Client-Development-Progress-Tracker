import { PartialType } from '@nestjs/swagger';
import { CreateProjectUpdateDto } from './create-update.dto';

export class UpdateProjectUpdateDto extends PartialType(CreateProjectUpdateDto) {}
