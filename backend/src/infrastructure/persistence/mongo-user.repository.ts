import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import type { User, CreateUserProps } from '../../domain/entities/user.entity';
import {
  UserEntity,
  UserEntityDocument,
} from '../database/schemas/user.schema';

type MongoUpdate = {
  $set?: Record<string, unknown>;
  $unset?: Record<string, 1>;
};

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserEntityDocument>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.userModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async create(props: CreateUserProps): Promise<User> {
    const created = await this.userModel.create({
      email: props.email.toLowerCase(),
      passwordHash: props.passwordHash,
      isVerified: props.isVerified ?? false,
      firstName: props.firstName,
      lastName: props.lastName,
      googleId: props.googleId,
      avatar: props.avatar,
      authProvider: props.authProvider,
    });
    return this.toEntity(created);
  }

  async update(id: string, props: Partial<User>): Promise<User | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const update: MongoUpdate = { $set: {}, $unset: {} };
    for (const [key, value] of Object.entries(props)) {
      // Skip fields that are owned by Mongoose or derived from `_id`
      if (key === 'id' || key === 'createdAt') continue;
      if (value === undefined) {
        update.$unset![key] = 1;
      } else {
        update.$set![key] = value;
      }
    }

    if (
      Object.keys(update.$set ?? {}).length === 0 &&
      Object.keys(update.$unset ?? {}).length === 0
    ) {
      // Nothing left to apply; just return the current state
      return this.findById(id);
    }

    const updated = await this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();

    return updated ? this.toEntity(updated) : null;
  }

  private toEntity(doc: UserEntityDocument): User {
    const plain = doc.toObject({ virtuals: true }) as UserEntity & {
      _id: Types.ObjectId;
      id?: string;
    };
    return {
      id: plain.id ?? plain._id.toString(),
      email: plain.email,
      passwordHash: plain.passwordHash,
      isVerified: plain.isVerified,
      firstName: plain.firstName ?? undefined,
      lastName: plain.lastName ?? undefined,
      state: plain.state ?? undefined,
      otp: plain.otp ?? undefined,
      otpExpiresAt: plain.otpExpiresAt ?? undefined,
      googleId: plain.googleId ?? undefined,
      avatar: plain.avatar ?? undefined,
      authProvider: (plain.authProvider as 'email' | 'google') ?? undefined,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }
}
