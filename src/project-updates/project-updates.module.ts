import { Module } from '@nestjs/common';
import { ProjectUpdatesService } from './project-updates.service';
import { ProjectUpdatesController } from './project-updates.controller';
import { ActivityModule } from '../activity/activity.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ActivityModule, ProjectsModule],
  controllers: [ProjectUpdatesController],
  providers: [ProjectUpdatesService],
  exports: [ProjectUpdatesService],
})
export class ProjectUpdatesModule {}
