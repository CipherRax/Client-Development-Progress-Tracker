import { Module } from '@nestjs/common';
import { ChangeRequestsService } from './change-requests.service';
import { ChangeRequestsController } from './change-requests.controller';
import { ActivityModule } from '../activity/activity.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ActivityModule, ProjectsModule],
  controllers: [ChangeRequestsController],
  providers: [ChangeRequestsService],
  exports: [ChangeRequestsService],
})
export class ChangeRequestsModule {}
