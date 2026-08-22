import { User, CreateUserProps } from '../entities/user.entity';

/** Minimal user shape exposed to the review system's dataset-list metrics endpoint. */
export interface DatasetUserListItem {
  name: string;
  email: string;
  createdAt: Date;
}

export interface PaginatedDatasetUsers {
  data: DatasetUserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(props: CreateUserProps): Promise<User>;
  update(id: string, props: Partial<User>): Promise<User | null>;
  /** Total number of users, unfiltered. */
  count(): Promise<number>;
  /** Unfiltered, minimal-field paginated list — used by the dataset-list metrics endpoint. */
  findListBasic(page: number, limit: number): Promise<PaginatedDatasetUsers>;
}
