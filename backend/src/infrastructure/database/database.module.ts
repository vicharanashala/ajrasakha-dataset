import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

/**
 * Global MongoDB connection module. The connection is initialised once for the
 * whole application; feature modules register their own schemas via
 * `MongooseModule.forFeature([...])` and re-use this connection.
 */
@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI');
        const dbName = config.get<string>('MONGODB_DB_NAME');

        if (!uri) {
          throw new Error('MONGODB_URI environment variable is required');
        }
        if (!dbName) {
          throw new Error('MONGODB_DB_NAME environment variable is required');
        }

        console.log('MongoDB URI configured: SET');
        console.log('MongoDB Database:', dbName);

        return {
          uri,
          dbName,
          serverSelectionTimeoutMS: 30000, // 30 seconds - longer for Cloud Run
          connectTimeoutMS: 30000, // 30 seconds - longer for Cloud Run
          socketTimeoutMS: 45000,
          retryWrites: true,
          retryAttempts: 3,
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
