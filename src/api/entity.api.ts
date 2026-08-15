import type { Entity } from "@/types/entity";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface EntityQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  entityName?: string;
  entityType?: string;
  legalStatus?: string;
  membershipMasterId?: number;
  hideSuspensionDate?: boolean;
  includeEnumCase?: number[];
}

const ENTITY_BASE = import.meta.env.VITE_APP_API_URL + "/entity";

export function getEntities(
  params: EntityQuery = {},
): Promise<Response<Entity[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "entityId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? params.entityName,
    entityName: params.entityName ?? undefined,
    entityType: params.entityType ?? undefined,
    legalStatus: params.legalStatus ?? undefined,
    membershipMasterId: params.membershipMasterId,
    hideSuspensionDate: params.hideSuspensionDate,
    includeEnumCase: params.includeEnumCase ?? undefined,
  });

  return request<Response<Entity[]>>(`${ENTITY_BASE}${qs}`);
}

export function getAcademies(
  params: EntityQuery = {},
): Promise<Response<Entity[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "entityId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? params.entityName,
    entityName: params.entityName ?? undefined,
    entityType: params.entityType ?? undefined,
    legalStatus: params.legalStatus ?? undefined,
    membershipMasterId: params.membershipMasterId,
    hideSuspensionDate: params.hideSuspensionDate,
    includeEnumCase: params.includeEnumCase ?? undefined,
  });

  return request<Response<Entity[]>>(`${ENTITY_BASE}/academies${qs}`);
}

export function getEntityById(id: number): Promise<Response<Entity>> {
  return request<Response<Entity>>(`${ENTITY_BASE}/${id}`);
}

export function getEntityByFilter(
  entityType: string,
): Promise<Response<Entity>> {
  return request<Response<Entity>>(
    `${ENTITY_BASE}/filtered?entityType=${entityType}`,
  );
}

export function createEntity(
  payload: Omit<Entity, "entityId" | "createdAt" | "updatedAt">,
): Promise<Response<Entity>> {
  return request<Response<Entity>>(ENTITY_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEntity(
  id: number,
  payload: Partial<Entity>,
): Promise<Response<Entity>> {
  return request<Response<Entity>>(`${ENTITY_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteEntity(id: number): Promise<Response> {
  return request<Response>(`${ENTITY_BASE}/${id}`, {
    method: "DELETE",
  });
}
