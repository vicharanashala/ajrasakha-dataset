import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthUseCases } from '../../application/use-cases/auth.use-case';
import { MongoUserRepository } from '../../infrastructure/persistence/mongo-user.repository';
import { OtpService } from '../../infrastructure/services/otp.service';
import { EmailService } from '../../infrastructure/services/email.service';
import { JwtService } from '../../infrastructure/auth/jwt.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { GoogleStrategy } from '../../infrastructure/auth/google.strategy';
import { GoogleAuthGuard } from '../../infrastructure/auth/google-auth.guard';
import {
  UserEntity,
  UserSchema,
} from '../../infrastructure/database/schemas/user.schema';
import { USER_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [
    AuthUseCases,
    { provide: USER_REPOSITORY, useClass: MongoUserRepository },
    OtpService,
    EmailService,
    JwtService,
    JwtAuthGuard,
    GoogleStrategy,
    GoogleAuthGuard,
  ],
  exports: [JwtService, JwtAuthGuard, GoogleAuthGuard],
})
export class AuthModule {}
