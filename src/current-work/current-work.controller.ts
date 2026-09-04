import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentWorkService } from './current-work.service';
import { SetCurrentWorkDto } from './dto/set-current-work.dto';

@ApiTags('Current Work')
@ApiBearerAuth()
@Controller('projects/:projectId/current-work')
export class CurrentWorkController {
  constructor(private readonly currentWorkService: CurrentWorkService) {}

  @Put()
  set(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() dto: SetCurrentWorkDto) {
    return this.currentWorkService.set(projectId, dto);
  }

  @Get()
  getActive(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.currentWorkService.getActive(projectId);
  }

  @Delete()
  clear(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.currentWorkService.clear(projectId);
  }
}
