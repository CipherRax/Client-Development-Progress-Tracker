import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { ChangeProjectStatusDto } from './dto/change-status.dto';
import { ChangeProjectHealthDto } from './dto/change-health.dto';
import { PauseProjectDto } from './dto/pause-project.dto';
import { CompleteProjectDto } from './dto/complete-project.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryProjectDto) {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Patch(':id/status')
  changeStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeProjectStatusDto) {
    return this.projectsService.changeStatus(id, dto);
  }

  @Patch(':id/health')
  changeHealth(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeProjectHealthDto) {
    return this.projectsService.changeHealth(id, dto);
  }

  @Post(':id/pause')
  pause(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PauseProjectDto) {
    return this.projectsService.pause(id, dto);
  }

  @Post(':id/resume')
  resume(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.resume(id);
  }

  @Post(':id/complete')
  complete(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CompleteProjectDto) {
    return this.projectsService.complete(id, dto);
  }

  @Post(':id/archive')
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.archive(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.remove(id);
  }
}
