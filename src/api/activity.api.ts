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
    activityType?: string;
}

const ACTIVITY_BASE = import.meta.env.VITE_APP_API_URL + '/activity';

export function getActivities(params: ActivityQuery = {}): Promise<Response<Activity>> {
    const qs = toQueryString({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        sortBy: params.sortBy ?? 'activityId',
        sorting: params.sorting ?? (params.sorting ?? 'ASC'),
        search: params.search ?? params.activityName,
        activityName: params.activityName ?? undefined,
        activityType: params.activityType ?? undefined,
    });

    return request<Response<Activity>>(`${ACTIVITY_BASE}${qs}`);
}

export function getActivityById(id: number): Promise<Response> {
    return request<Response>(`${ACTIVITY_BASE}/${id}`)
}

export function createActivity(payload: Activity): Promise<Response> {
    return request<Response>(ACTIVITY_BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function editActivity(id: number, payload: Partial<Activity>): Promise<Response> {
    return request<Response>(`${ACTIVITY_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    })
}

export function deleteActivity(id: number): Promise<Response> {
    return request<Response>(`${ACTIVITY_BASE}/${id}`, {
        method: 'DELETE',
    })
}
