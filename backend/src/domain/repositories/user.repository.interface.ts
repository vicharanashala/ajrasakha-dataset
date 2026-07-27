import { User, CreateUserProps } from '../entities/user.entity';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(props: CreateUserProps): Promise<User>;
  update(id: string, props: Partial<User>): Promise<User | null>;
}