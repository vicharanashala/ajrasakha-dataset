import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthUseCases } from '../../application/use-cases/auth.use-case';
import { MongoUserRepository } from '../../infrastructure/persistence/mongo-user.repository';
import { OtpService } from '../../infrastructure/services/otp.service';
import { EmailService } from '../../infrastructure/services/email.service';
import {
  UserEntity,
  UserSchema,
} from '../../infrastructure/database/schemas/user.schema';
import { USER_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthUseCases,
    { provide: USER_REPOSITORY, useClass: MongoUserRepository },
    OtpService,
    EmailService,
  ],
})
export class AuthModule {}
