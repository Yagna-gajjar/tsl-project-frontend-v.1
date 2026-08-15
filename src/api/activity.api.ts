import type { Activity } from '@/types/activity'
import { request, toQueryString, type SortOrder } from './helper';
import type { Response } from '@/types/response';

export interface ActivityQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sorting?: SortOrder;
  search?: string;
  activityName?: string;
  activity?: string;
  activityType?: string;
}

const ACTIVITY_BASE = import.meta.env.VITE_APP_API_URL + '/activity';

export function getActivities(
  params: ActivityQuery = {}
): Promise<Response<Activity[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 1000,
    sortBy: params.sortBy ?? "activityId",
    sorting: params.sorting ?? params.sorting ?? "ASC",
    search: params.search ?? params.activityName,
    activityName: params.activityName ?? undefined,
    activity: params.activity ?? undefined,
    activityType: params.activityType ?? undefined,
  });

  return request<Response<Activity[]>>(`${ACTIVITY_BASE}${qs}`);
}



export function getActivityById(id: number): Promise<Response<Activity>> {
  return request<Response<Activity>>(`${ACTIVITY_BASE}/${id}`);
}

export function createActivity(payload: Activity): Promise<Response<Activity>> {
  return request<Response<Activity>>(ACTIVITY_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateActivity(
  id: number,
  payload: Partial<Activity>
): Promise<Response<Activity>> {
  return request<Response<Activity>>(`${ACTIVITY_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteActivity(id: number): Promise<Response<Activity>> {
  return request<Response<Activity>>(`${ACTIVITY_BASE}/${id}`, {
    method: "DELETE",
  });
}
