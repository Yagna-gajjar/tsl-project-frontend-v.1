export interface BatchConnection {
  batchConnectionId: number;
  mainBatchId?: number | null;
  preBatch?: number | null;
  postBatch?: number | null;
  startDate?: string | null; // ISO date string "YYYY-MM-DD"
  endDate?: string | null; // ISO date string
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;

  // optional denormalized names for UI display
  mainBatchName?: string;
  preBatchName?: string;
  postBatchName?: string;
}
