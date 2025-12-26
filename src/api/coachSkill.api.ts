import type { CoachSkill } from "@/types/coachSkill";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface CoachSkillQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  memberId?: number;
  activityId?: number;
  experience?: string;
  memberFirstName?: string;
  activityName?: string;
  currentlyInterest?: string;
  currentlyInTeam?: string;
  status?: string;
}

const COACH_SKILL_BASE = import.meta.env.VITE_APP_API_URL + "/coach-skill";

export function getCoachSkills(
  params: CoachSkillQuery = {}
): Promise<Response<CoachSkill[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "coachSkillId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    memberId: params.memberId ?? undefined,
    activityId: params.activityId ?? undefined,
    experience: params.experience ?? undefined,
    memberFirstName: params.memberFirstName ?? undefined,
    activityName: params.activityName ?? undefined,
    currentlyInterest: params.currentlyInterest ?? undefined,
    currentlyInTeam: params.currentlyInTeam ?? undefined,
    status: params.status ?? undefined,
  });

  return request<Response<CoachSkill[]>>(`${COACH_SKILL_BASE}${qs}`);
}

export function getCoachSkill(id: number): Promise<Response<CoachSkill>> {
  return request<Response<CoachSkill>>(`${COACH_SKILL_BASE}/${id}`);
}

export function createCoachSkill(
  payload: Omit<
    CoachSkill,
    | "coachSkillId"
    | "createdAt"
    | "updatedAt"
    | "memberFirstName"
    | "memberLastName"
    | "activityName"
  >
): Promise<Response<CoachSkill>> {
  return request<Response<CoachSkill>>(COACH_SKILL_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCoachSkill(
  id: number,
  payload: Partial<
    Omit<
      CoachSkill,
      | "coachSkillId"
      | "createdAt"
      | "updatedAt"
      | "memberFirstName"
      | "memberLastName"
      | "activityName"
    >
  >
): Promise<Response<CoachSkill>> {
  return request<Response<CoachSkill>>(`${COACH_SKILL_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCoachSkill(id: number): Promise<Response<CoachSkill>> {
  return request<Response<CoachSkill>>(`${COACH_SKILL_BASE}/${id}`, {
    method: "DELETE",
  });
}