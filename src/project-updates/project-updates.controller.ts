import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectUpdatesService } from './project-updates.service';
import { CreateProjectUpdateDto } from './dto/create-update.dto';
import { UpdateProjectUpdateDto } from './dto/update-update.dto';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';

@ApiTags('Project Updates')
@ApiBearerAuth()
@Controller()
export class ProjectUpdatesController {
  constructor(private readonly projectUpdatesService: ProjectUpdatesService) {}

  @Post('projects/:projectId/updates')
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentAdmin('id') adminId: string,
    @Body() dto: CreateProjectUpdateDto,
  ) {
    return this.projectUpdatesService.create(projectId, adminId, dto);
  }

  @Get('projects/:projectId/updates')
  findAllForProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectUpdatesService.findAllForProject(projectId);
  }

  @Patch('updates/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectUpdateDto) {
    return this.projectUpdatesService.update(id, dto);
  }

  @Delete('updates/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectUpdatesService.remove(id);
  }
}
