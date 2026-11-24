import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { createValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 4000);
  const frontendUrl = configService.get<string>('app.frontendUrl', 'http://localhost:3000');
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

  // Security Middlewares
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: nodeEnv === 'production',
  }));

  // CORS Configuration
  app.enableCors({
    origin: [
      frontendUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      /\.vercel\.app$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation
  app.useGlobalPipes(createValidationPipe());

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hotel Management System API')
    .setDescription('Modular Monolithic REST API for Hotel Management Software (Single Admin Role)')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Bearer token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Hotel Management API Documentation',
  });

  await app.listen(port, '0.0.0.0');
  logger.log(`Hotel Management Backend running on: http://0.0.0.0:${port}/api/v1`);
  logger.log(`Swagger Documentation available at: http://localhost:${port}/api/docs`);
  logger.log(`Health Check endpoint: http://localhost:${port}/api/v1/health`);
}

bootstrap();
