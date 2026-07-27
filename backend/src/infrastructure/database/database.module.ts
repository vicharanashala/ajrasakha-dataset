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
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGODB_URI') ??
          `${DEFAULT_MONGODB_URI.replace(/\?.*$/, '')}/${DEFAULT_MONGODB_DB_NAME}?appName=chatbot`,
        dbName:
          config.get<string>('MONGODB_DB_NAME') ?? DEFAULT_MONGODB_DB_NAME,
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
