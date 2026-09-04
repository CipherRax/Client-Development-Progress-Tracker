import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { ClientAccessGuard } from './guards/client-access.guard';
import { ActivityModule } from '../activity/activity.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ActivityModule, ProjectsModule],
  controllers: [PublicController],
  providers: [PublicService, ClientAccessGuard],
})
export class PublicModule {}
