import type { DebitNote } from "@/types/debitNote";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface DebitNoteQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  memberName?: string;
  academyName?: string;
  coachName?: string;
  debitNoteType?: string;
  debitNoteRemarks?: string;
}


const DEBITNOTE_BASE = import.meta.env.VITE_APP_API_URL + "/debit-note";

export function getDebitNotes(
  params: DebitNoteQuery = {}
): Promise<Response<DebitNote[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "academyId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? params.academyName,
    memberName: params.memberName ?? undefined,
    academyName: params.academyName ?? undefined,
    coachName: params.coachName ?? undefined,
    debitNoteType: params.debitNoteType ?? undefined,
    debitNoteRemarks: params.debitNoteRemarks ?? undefined,
  });

  return request<Response<DebitNote[]>>(`${DEBITNOTE_BASE}${qs}`);
}


export function getDebitNoteById(id: number): Promise<Response<DebitNote>> {
  return request<Response<DebitNote>>(`${DEBITNOTE_BASE}/${id}`);
}

export function createDebitNote(
  payload: DebitNote 
): Promise<Response> {
  return request<Response>(DEBITNOTE_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}