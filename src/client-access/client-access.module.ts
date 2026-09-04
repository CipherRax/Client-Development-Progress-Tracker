import { Module } from '@nestjs/common';
import { ClientAccessService } from './client-access.service';
import { ClientAccessController } from './client-access.controller';
import { ActivityModule } from '../activity/activity.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ActivityModule, ProjectsModule],
  controllers: [ClientAccessController],
  providers: [ClientAccessService],
  exports: [ClientAccessService],
})
export class ClientAccessModule {}
