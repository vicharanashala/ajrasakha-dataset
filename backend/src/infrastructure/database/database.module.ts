import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

const DEFAULT_MONGODB_URI =
  'mongodb+srv://lpulga167_db_user:AlYI819Ba8Md1ly7@chatbot.icehz1c.mongodb.net/?appName=chatbot';
const DEFAULT_MONGODB_DB_NAME = 'ajraskha-dataset';

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
        const uri =
          config.get<string>('MONGODB_URI') ??
          `${DEFAULT_MONGODB_URI.replace(/\?.*$/, '')}/${DEFAULT_MONGODB_DB_NAME}?appName=chatbot`;
        console.log('MongoDB URI configured:', uri ? 'SET' : 'NOT SET');
        return {
          uri,
          dbName:
            config.get<string>('MONGODB_DB_NAME') ?? DEFAULT_MONGODB_DB_NAME,
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
