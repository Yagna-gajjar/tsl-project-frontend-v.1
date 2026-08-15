import type { CoachMember } from "@/types/coachMember";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface CoachMemberQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  entityId?: number;
  accountId?: number;
  memberId?: number;
  memberFirstName?: string;
  activity?: string;
  activityQualification?: string;
  currentlyIntreset?: string;
}

// NOTE: adjust this path to whatever route the coachMember.controller.js
// functions are actually mounted on.
const COACH_MEMBER_BASE = import.meta.env.VITE_APP_API_URL + "/coach-member";

export function getCoachMembers(
  params: CoachMemberQuery = {},
): Promise<Response<CoachMember[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "coachSkillId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    entityId: params.entityId ?? undefined,
    accountId: params.accountId ?? undefined,
    memberId: params.memberId ?? undefined,
    memberFirstName: params.memberFirstName ?? undefined,
    activity: params.activity ?? undefined,
    activityQualification: params.activityQualification ?? undefined,
    currentlyIntreset: params.currentlyIntreset ?? undefined,
  });

  return request<Response<CoachMember[]>>(`${COACH_MEMBER_BASE}${qs}`);
}

export function getCoachMemberById(id: number): Promise<Response<CoachMember>> {
  return request<Response<CoachMember>>(`${COACH_MEMBER_BASE}/${id}`);
}
