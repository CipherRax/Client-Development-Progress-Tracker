import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientAccessService } from './client-access.service';
import { GenerateClientAccessDto } from './dto/generate-client-access.dto';

@ApiTags('Client Access')
@ApiBearerAuth()
@Controller('projects/:projectId/client-access')
export class ClientAccessController {
  constructor(private readonly clientAccessService: ClientAccessService) {}

  @Post()
  generate(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: GenerateClientAccessDto,
  ) {
    return this.clientAccessService.generate(projectId, dto);
  }

  @Get()
  list(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.clientAccessService.list(projectId);
  }

  @Post('revoke')
  revoke(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.clientAccessService.revoke(projectId);
  }

  @Post('regenerate')
  regenerate(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: GenerateClientAccessDto,
  ) {
    return this.clientAccessService.regenerate(projectId, dto);
  }
}
