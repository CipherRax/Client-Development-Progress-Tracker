import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsUUID } from 'class-validator';

export class ReorderMilestonesDto {
  @ApiProperty({
    type: [String],
    description: 'Milestone IDs in the desired display order.',
  })
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  orderedMilestoneIds: string[];
}
