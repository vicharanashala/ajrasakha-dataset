import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

// Startup timeout to prevent hanging
const STARTUP_TIMEOUT = 30000; // 30 seconds

async function bootstrap() {
  console.log('=== APP STARTING ===');
  console.log('PORT:', process.env.PORT);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
  
  // Create app with timeout
  const createAppPromise = NestFactory.create<NestExpressApplication>(AppModule);
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('App creation timed out after 30 seconds')), STARTUP_TIMEOUT);
  });
  
  let app: NestExpressApplication;
  try {
    app = await Promise.race([createAppPromise, timeoutPromise]) as NestExpressApplication;
    console.log('App module created successfully');
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
    // In production, serve static files
    app.useStaticAssets(frontendDistPath, {
      prefix: '/',
    });

    // SPA fallback
    app.use((req: any, res: any, next: any) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(join(frontendDistPath, 'index.html'));
    });
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
  console.log('Starting server on port:', port);
  
  await app.listen(port);
  console.log(`=== APP RUNNING ON http://localhost:${port} ===`);
}
bootstrap();
