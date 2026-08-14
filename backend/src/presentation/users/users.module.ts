import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UserUseCase } from '../../application/use-cases/user.use-case';
import { MongoUserRepository } from '../../infrastructure/persistence/mongo-user.repository';
import {
  UserEntity,
  UserSchema,
} from '../../infrastructure/database/schemas/user.schema';
import { USER_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    UserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: MongoUserRepository,
    },
  ],
  exports: [UserUseCase],
})
export class UsersModule {}
