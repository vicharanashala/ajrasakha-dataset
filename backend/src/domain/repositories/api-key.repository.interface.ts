export interface ApiKey {
  id: string;
  userId: string;
  key: string;
  name?: string;
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyRepository {
  create(props: { userId: string; key: string; name?: string; expiresAt?: Date }): Promise<ApiKey>;
  findByKey(key: string): Promise<ApiKey | null>;
  findByUserId(userId: string): Promise<ApiKey[]>;
  updateLastUsed(id: string): Promise<void>;
  revoke(id: string): Promise<void>;
}