import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChangeRequestsService } from './change-requests.service';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { UpdateChangeRequestDto } from './dto/update-change-request.dto';
import { RejectChangeRequestDto } from './dto/reject-change-request.dto';
import { QueryChangeRequestDto } from './dto/query-change-request.dto';

@ApiTags('Change Requests')
@ApiBearerAuth()
@Controller()
export class ChangeRequestsController {
  constructor(private readonly changeRequestsService: ChangeRequestsService) {}

  @Post('projects/:projectId/change-requests')
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateChangeRequestDto,
  ) {
    return this.changeRequestsService.create(projectId, dto);
  }

  @Get('projects/:projectId/change-requests')
  findAllForProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: QueryChangeRequestDto,
  ) {
    return this.changeRequestsService.findAllForProject(projectId, query);
  }

  @Get('change-requests/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.changeRequestsService.findOne(id);
  }

  @Patch('change-requests/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateChangeRequestDto) {
    return this.changeRequestsService.update(id, dto);
  }

  @Post('change-requests/:id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.changeRequestsService.approve(id);
  }

  @Post('change-requests/:id/reject')
  reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectChangeRequestDto) {
    return this.changeRequestsService.reject(id, dto);
  }

  @Post('change-requests/:id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.changeRequestsService.cancel(id);
  }
}
