import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('corsOrigin'),
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Client Development Progress Tracker API')
    .setDescription(
      'Developer-controlled client progress portal. Admins manage projects internally; ' +
        'clients view read-only progress dashboards through secure tokenized links.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'admin-jwt')
    .addApiKey(
      { type: 'apiKey', name: 'x-client-access-token', in: 'header' },
      'client-access-token',
    )
    .addTag('Authentication')
    .addTag('Profile')
    .addTag('Clients')
    .addTag('Projects')
    .addTag('Milestones')
    .addTag('Tasks')
    .addTag('Change Requests')
    .addTag('Project Updates')
    .addTag('Current Work')
    .addTag('Project Activity')
    .addTag('Client Access')
    .addTag('Public Client API')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('port')!;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
  logger.log(`Swagger docs available at /api/docs`);
}

bootstrap();
