import type { BatchConnection } from "@/types/batchConnection";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

const BASE = import.meta.env.VITE_APP_API_URL + "/batch-connection";

export interface BatchConnectionQuery {
  page?: number;
  limit?: number;
  search?: string;
  mainBatchId?: number;
  preBatch?: number;
  postBatch?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export function getBatchConnections(
  params: BatchConnectionQuery = {}
): Promise<Response<BatchConnection[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "batchConnectionId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    mainBatchId: params.mainBatchId ?? undefined,
    preBatch: params.preBatch ?? undefined,
    postBatch: params.postBatch ?? undefined,
    startDate: params.startDate ?? undefined,
    endDate: params.endDate ?? undefined,
  });
  return request<Response<BatchConnection[]>>(`${BASE}${qs}`);
}

export function getBatchConnectionById(
  id: number
): Promise<Response<BatchConnection>> {
  return request<Response<BatchConnection>>(`${BASE}/${id}`);
}

export function createBatchConnection(
  payload: Omit<
    BatchConnection,
    "batchConnectionId" | "createdAt" | "updatedAt"
  >
): Promise<Response<BatchConnection>> {
  return request<Response<BatchConnection>>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBatchConnection(
  id: number,
  payload: Partial<BatchConnection>
): Promise<Response<BatchConnection>> {
  return request<Response<BatchConnection>>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteBatchConnection(
  id: number
): Promise<Response<BatchConnection>> {
  return request<Response<BatchConnection>>(`${BASE}/${id}`, {
    method: "DELETE",
  });
}
