import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { User, CreateUserProps } from '../../domain/entities/user.entity';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase();
    return this.users.find((user) => user.email === normalized) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) || null;
  }

  async create(props: CreateUserProps): Promise<User> {
    const now = new Date();
    const user: User = {
      id: this.generateId(),
      email: props.email.toLowerCase(),
      passwordHash: props.passwordHash,
      isVerified: props.isVerified ?? false,
      firstName: props.firstName,
      lastName: props.lastName,
      googleId: props.googleId,
      avatar: props.avatar,
      authProvider: props.authProvider,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return user;
  }

  async update(id: string, props: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return null;

    const updatedUser: User = {
      ...this.users[index],
      ...props,
      id: this.users[index].id,
      email: this.users[index].email,
      updatedAt: new Date(),
    };
    this.users[index] = updatedUser;
    return updatedUser;
  }

  count(): Promise<number> {
    return Promise.resolve(this.users.length);
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
