import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApiKeyEntity, ApiKeyEntityDocument } from '../database/schemas/api-key.schema';

type ApiKey = {
  id: string;
  userId: string;
  key: string;
  name?: string;
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

interface ApiKeyRepository {
  create(props: { userId: string; key: string; name?: string; expiresAt?: Date }): Promise<ApiKey>;
  findByKey(key: string): Promise<ApiKey | null>;
  findByUserId(userId: string): Promise<ApiKey[]>;
  updateLastUsed(id: string): Promise<void>;
  revoke(id: string): Promise<void>;
}

@Injectable()
export class MongoApiKeyRepository implements ApiKeyRepository {
  constructor(
    @InjectModel(ApiKeyEntity.name)
    private readonly apiKeyModel: Model<ApiKeyEntityDocument>,
  ) {}

  async create(props: {
    userId: string;
    key: string;
    name?: string;
    expiresAt?: Date;
  }): Promise<ApiKey> {
    const created = await this.apiKeyModel.create({
      userId: new Types.ObjectId(props.userId),
      key: props.key,
      name: props.name,
      expiresAt: props.expiresAt,
      isActive: true,
    });
    return this.toEntity(created);
  }

  async findByKey(key: string): Promise<ApiKey | null> {
    const doc = await this.apiKeyModel.findOne({ key }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<ApiKey[]> {
    const docs = await this.apiKeyModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.apiKeyModel
      .findByIdAndUpdate(id, { lastUsedAt: new Date() })
      .exec();
  }

  async revoke(id: string): Promise<void> {
    await this.apiKeyModel
      .findByIdAndUpdate(id, { isActive: false })
      .exec();
  }

  private toEntity(doc: ApiKeyEntityDocument): ApiKey {
    const plain = doc.toObject({ virtuals: true }) as ApiKeyEntity & {
      _id: Types.ObjectId;
    };
    return {
      id: (doc as any).id ?? plain._id.toString(),
      userId:
        typeof plain.userId === 'string'
          ? plain.userId
          : (plain.userId as Types.ObjectId).toString(),
      key: plain.key,
      name: plain.name,
      isActive: plain.isActive,
      lastUsedAt: plain.lastUsedAt,
      expiresAt: plain.expiresAt,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }
}