import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/http-exception.config';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose', 'debug'],
  });
  const configService = app.get(ConfigService);
  const logger = new Logger(bootstrap.name);

  const port = process.env.API_SERVICE_PORT ?? 3000;
  const global_prefix = '/api';
  const name = 'PanPal API';
  const nodeEnv = configService.getOrThrow<string>('NODE_ENV');

  app.setGlobalPrefix(global_prefix);
  
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS?.split(',') ?? [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://panpal-eta.vercel.app',
    nodeEnv === 'production'
      ? configService.getOrThrow<string>('FE_PRODUCTION_URL')
      : undefined,
  ]
)
  .filter((o): o is string => Boolean(o)); // ✅ type guard: chỉ còn string

app.enableCors({
  origin: allowedOrigins,  // lúc này TS hiểu là string[]
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Cross-Origin-Opener-Policy'],
} satisfies CorsOptions);
  // Enable compression
  app.use(compression());
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(configService));

  // Rate limiting is configured in app.module.ts via APP_GUARD

  // Increase payload size limits for file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));


  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });

  const config = new DocumentBuilder()
    .setTitle(name)
    .setDescription('The PanPal API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port, async () => {
    const server_url = (await app.getUrl()).replace('[::1]', 'localhost');
    logger.log(`------- ${name} --------`);
    logger.log(`Server is running on ${server_url}`);
    logger.log(`APIs is running on ${server_url + global_prefix}`);
    logger.log(`Swagger docs is running on ${server_url}/docs`);
  });
}
bootstrap();
