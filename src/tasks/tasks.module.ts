import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ActivityModule } from '../activity/activity.module';
import { MilestonesModule } from '../milestones/milestones.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ActivityModule, MilestonesModule, ProjectsModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
