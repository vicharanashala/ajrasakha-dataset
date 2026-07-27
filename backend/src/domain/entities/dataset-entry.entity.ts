export interface DatasetEntry {
  id: string;
  ownerId?: string;
  title: string;
  description?: string;
  payload?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDatasetEntryProps {
  ownerId?: string;
  title: string;
  description?: string;
  payload?: Record<string, unknown>;
}
