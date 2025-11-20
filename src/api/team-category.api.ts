import type { TeamCategory } from "@/types/teamCategory";
import { request, toQueryString, type SortOrder } from "./helper";

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

// GET
export function getTeamCategories(params: TeamCategoriesQuery = {}): Promise<TeamCategory[]> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    sortBy: params.sortBy ?? 'teamCategoryId',
    sortOrder: params.sortOrder ?? 'ASC',
    search: params.search,
    categoryName: params.categoryName,
    shortName: params.shortName,
    access: params.access
  });

  return request<TeamCategory[]>(`${TEAM_CATEGORY_BASE}${qs}`);
}

// GET BY ID
export function getTeamCategoriesByID(id: number): Promise<TeamCategory> {
    return request<TeamCategory>(`${TEAM_CATEGORY_BASE}/${id}`)
}

// POST
export function createTeamCategories(payload: TeamCategory): Promise<TeamCategory> {
    return request<TeamCategory>(TEAM_CATEGORY_BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

// PUT
export function editTeamCategories(id: number,payload: Partial<TeamCategory>): Promise<TeamCategory> {
    return request<TeamCategory>(`${TEAM_CATEGORY_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    })
}
 
// DELETE
export function deleteTeamCategories(id: number): Promise<TeamCategory> {
    return request<TeamCategory>(`${TEAM_CATEGORY_BASE}/${id}`, {
        method: 'DELETE'
    })
}
