import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS for frontend communication
  const corsOrigins =
    configService.get<string>('CORS_ORIGINS') ?? 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Serve static files from frontend/dist
  app.useStaticAssets(join(__dirname, '..', 'frontend', 'dist'), {
    prefix: '/',
  });

  // SPA fallback: serve index.html for all non-API routes
  const frontendDistPath = join(__dirname, '..', 'frontend', 'dist');
  app.use((req: any, res: any, next: any) => {
    // Let API routes through, serve index.html for SPA routes
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(join(frontendDistPath, 'index.html'));
  });

  // Enable validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 8080);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 8080}`,
  );
}
bootstrap();
