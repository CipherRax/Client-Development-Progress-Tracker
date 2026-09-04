import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PublicService } from './public.service';
import { ClientAccessGuard } from './guards/client-access.guard';
import { ClientProject } from './decorators/client-project.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ContactMessageDto } from './dto/contact-message.dto';
import { Project } from '@prisma/client';

@ApiTags('Public Client API')
@ApiSecurity('client-access-token')
@Public() // bypasses the admin JWT guard; ClientAccessGuard below is the real gate
@UseGuards(ClientAccessGuard)
@Controller('public/project')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get()
  getDashboard(@ClientProject() project: Project) {
    return this.publicService.getDashboard(project);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('contact')
  submitContact(@ClientProject() project: Project, @Body() dto: ContactMessageDto) {
    return this.publicService.submitContactMessage(project, dto);
  }
}
