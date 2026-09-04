import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './database/prisma.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { MilestonesModule } from './milestones/milestones.module';
import { TasksModule } from './tasks/tasks.module';
import { ChangeRequestsModule } from './change-requests/change-requests.module';
import { ProjectUpdatesModule } from './project-updates/project-updates.module';
import { CurrentWorkModule } from './current-work/current-work.module';
import { ActivityModule } from './activity/activity.module';
import { ClientAccessModule } from './client-access/client-access.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('rateLimit.ttl')! * 1000,
            limit: config.get<number>('rateLimit.limit')!,
          },
        ],
      }),
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    ClientsModule,
    ProjectsModule,
    MilestonesModule,
    TasksModule,
    ChangeRequestsModule,
    ProjectUpdatesModule,
    CurrentWorkModule,
    ActivityModule,
    ClientAccessModule,
    PublicModule,
  ],
  providers: [
    // Order matters: rate limiting first, then auth (registered inside AuthModule).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
