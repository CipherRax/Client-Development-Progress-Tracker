import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { UpdateMilestoneStatusDto } from './dto/update-milestone-status.dto';
import { ReorderMilestonesDto } from './dto/reorder-milestones.dto';

@ApiTags('Milestones')
@ApiBearerAuth()
@Controller()
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post('projects/:projectId/milestones')
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.milestonesService.create(projectId, dto);
  }

  @Get('projects/:projectId/milestones')
  findAllForProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.milestonesService.findAllForProject(projectId);
  }

  @Patch('projects/:projectId/milestones/reorder')
  reorder(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: ReorderMilestonesDto,
  ) {
    return this.milestonesService.reorder(projectId, dto);
  }

  @Get('milestones/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.milestonesService.findOne(id);
  }

  @Patch('milestones/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMilestoneDto) {
    return this.milestonesService.update(id, dto);
  }

  @Patch('milestones/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMilestoneStatusDto,
  ) {
    return this.milestonesService.updateStatus(id, dto);
  }

  @Delete('milestones/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.milestonesService.remove(id);
  }
}
