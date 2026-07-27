import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

async function bootstrap() {
  console.log('=== APP STARTING ===');
  console.log('PORT:', process.env.PORT);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
  console.log('Timestamp:', new Date().toISOString());

  let app: NestExpressApplication;
  try {
    console.log('[1/4] Creating NestJS application...');
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
    });
    console.log('[2/4] App module created successfully');
  } catch (error) {
    console.error('Failed to create app:', error);
    process.exit(1);
    return;
  }

  const configService = app.get(ConfigService);

  // Enable CORS
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
  const frontendDistPath = join(__dirname, '..', 'frontend', 'dist');
  console.log('Frontend dist path:', frontendDistPath);

  if (process.env.NODE_ENV === 'production') {
    try {
      // In production, serve static files
      app.useStaticAssets(frontendDistPath, {
        prefix: '/',
      });
      console.log('Static assets configured');

      // SPA fallback
      app.use((req: any, res: any, next: any) => {
        if (req.path.startsWith('/api')) {
          next();
          return;
        }
        res.sendFile(join(frontendDistPath, 'index.html'));
      });
      console.log('SPA fallback configured');
    } catch (error) {
      console.warn('Static assets setup error (non-fatal):', error);
    }
  }

  // Enable validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = parseInt(process.env.PORT || '8080', 10);
  console.log('[3/4] Starting server on port:', port);

  // Listen on all interfaces for Cloud Run
  await app.listen(port, '0.0.0.0');

  // Get the actual URL
  const serverUrl = app.getHttpServer().address();
  console.log('[4/4] === APP RUNNING ON', serverUrl, '===');
  console.log('Cloud Run health check ready - listening on port', port);
  console.log('Startup completed at:', new Date().toISOString());
}
bootstrap();
