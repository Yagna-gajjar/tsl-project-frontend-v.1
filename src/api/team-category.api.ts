import type { TeamCategory } from "@/types/teamCategory";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface TeamCategoriesQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: SortOrder;
    search?: string;
    categoryName?: string;
    shortName?: string;
    access?: string;
}

const TEAM_CATEGORY_BASE = import.meta.env.VITE_APP_API_URL + '/team-category';

export function getTeamCategories(params: TeamCategoriesQuery = {}): Promise<Response<TeamCategory[]>> {
    const qs = toQueryString({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        sortBy: params.sortBy ?? 'teamCategoryId',
        sortOrder: params.sortOrder ?? 'ASC',
        search: params.search,
        categoryName: params.categoryName,
        shortName: params.shortName,
        access: params.access
    });

    return request<Response<TeamCategory[]>>(`${TEAM_CATEGORY_BASE}${qs}`);
}

export function getTeamCategoriesByID(id: number): Promise<Response<TeamCategory>> {
    return request<Response<TeamCategory>>(`${TEAM_CATEGORY_BASE}/${id}`)
}

export function createTeamCategories(payload: TeamCategory): Promise<Response<TeamCategory>> {
    return request < Response<TeamCategory>>(TEAM_CATEGORY_BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function editTeamCategories(id: number, payload: Partial<TeamCategory>): Promise<Response<TeamCategory>> {
    return request < Response<TeamCategory>>(`${TEAM_CATEGORY_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    })
}

export function deleteTeamCategories(id: number): Promise<Response> {
    return request<Response>(`${TEAM_CATEGORY_BASE}/${id}`, {
        method: 'DELETE'
    })
}
