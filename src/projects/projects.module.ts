import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProgressCalculationService } from './services/progress-calculation.service';
import { TimelineCalculationService } from './services/timeline-calculation.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ActivityModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProgressCalculationService, TimelineCalculationService],
  exports: [ProjectsService, ProgressCalculationService, TimelineCalculationService],
})
export class ProjectsModule {}
