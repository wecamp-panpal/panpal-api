import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger(bootstrap.name);

  const port = process.env.API_SERVICE_PORT ?? 3000;
  const global_prefix = '/api';
  const name = 'PanPal API';

  app.setGlobalPrefix(global_prefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // app.enableCors();
  app.enableCors({
  origin: 'http://localhost:5173', 
  credentials: true,
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
