export interface BatchConnection {
  batchConnectionId: number;
  mainBatchId?: number | null;
  preBatch?: number | null;
  postBatch?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;

  mainBatchName?: string;
  preBatchName?: string;
  postBatchName?: string;
}
