import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('Project Activity')
@ApiBearerAuth()
@Controller('projects/:projectId/activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  findForProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.activityService.findForProject(projectId, query);
  }
}
