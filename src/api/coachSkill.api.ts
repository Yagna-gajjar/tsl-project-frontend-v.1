import type { CoachSkill } from "@/types/coachSkill";
import { request, toQueryString, type SortOrder } from "./helper";

export interface CoachSkillQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  coachId?: number;
  activityId?: number;
  experience?: string;
  coachFirstName?: string;
  activityName?: string;
  currentInterest?: string;
  currentlyInTeam?: string;
}

const COACH_SKILL_BASE = import.meta.env.VITE_APP_API_URL + "/coach-skill";

export function getCoachSkills(
  params: CoachSkillQuery = {}
): Promise<CoachSkill[]> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "coachSkillId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    coachId: params.coachId ?? undefined,
    activityId: params.activityId ?? undefined,
    experience: params.experience ?? undefined,
    coachFirstName: params.coachFirstName ?? undefined,
    activityName: params.activityName ?? undefined,
    currentInterest: params.currentInterest ?? undefined,
    currentlyInTeam: params.currentlyInTeam ?? undefined,
  });

  console.log(params);
  

  return request<CoachSkill[]>(`${COACH_SKILL_BASE}${qs}`);
}

export function getCoachSkillById(id: number): Promise<CoachSkill> {
  return request<CoachSkill>(`${COACH_SKILL_BASE}/${id}`);
}

export function createCoachSkill(
  payload: Omit<CoachSkill, "coachSkillId" | "createdAt" | "updatedAt">
): Promise<CoachSkill> {
  return request<CoachSkill>(COACH_SKILL_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCoachSkill(
  id: number,
  payload: Partial<Omit<CoachSkill, "coachSkillId" | "createdAt" | "updatedAt">>
): Promise<CoachSkill> {
  return request<CoachSkill>(`${COACH_SKILL_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCoachSkill(id: number): Promise<CoachSkill> {
  return request<CoachSkill>(`${COACH_SKILL_BASE}/${id}`, {
    method: "DELETE",
  });
}
