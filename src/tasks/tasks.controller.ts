import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('milestones/:milestoneId/tasks')
  create(@Param('milestoneId', ParseUUIDPipe) milestoneId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(milestoneId, dto);
  }

  @Get('milestones/:milestoneId/tasks')
  findAllForMilestone(@Param('milestoneId', ParseUUIDPipe) milestoneId: string) {
    return this.tasksService.findAllForMilestone(milestoneId);
  }

  @Get('tasks/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch('tasks/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Patch('tasks/:id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.tasksService.updateStatus(id, dto);
  }

  @Delete('tasks/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id);
  }
}
