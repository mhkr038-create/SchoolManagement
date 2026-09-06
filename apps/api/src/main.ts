import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;
  const corsOrigin = configService.get<string>('cors.origin') || 'http://localhost:5173';

  // Security & Middleware
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-School-Id']
  });

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation & Serialization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );

  // Global Exception & Envelope Interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 School ERP API Server running at http://0.0.0.0:${port}/api/v1 (Global Network & LAN Enabled)`);
}

bootstrap();
