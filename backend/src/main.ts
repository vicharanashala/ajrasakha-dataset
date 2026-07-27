import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('=== APP STARTING ===');
    console.log('PORT:', process.env.PORT);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    console.log('Creating NestJS app...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    console.log('App module created successfully');
    
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

    // Enable validation pipe for DTOs
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const port = parseInt(process.env.PORT || '8080', 10);
    console.log('Listening on port:', port);
    await app.listen(port);
    console.log(`=== APP RUNNING ON http://localhost:${port} ===`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
