import { Module } from '@nestjs/common';
import { CurrentWorkService } from './current-work.service';
import { CurrentWorkController } from './current-work.controller';
import { ActivityModule } from '../activity/activity.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ActivityModule, ProjectsModule],
  controllers: [CurrentWorkController],
  providers: [CurrentWorkService],
  exports: [CurrentWorkService],
})
export class CurrentWorkModule {}
