import type { Transaction } from "@/types/transaction";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface TransactionsQuery {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: SortOrder;
	search?: string;
	transactionType?: string;
	crEntityId?: number;
	drEntityId?: number;
	status?: string;
	startDate?: string;
	endDate?: string;
	transactionDate?: string | Date;
}

const TRANSACTION_BASE = import.meta.env.VITE_APP_API_URL + "/transaction";

export function getTransactions(params: TransactionsQuery = {}): Promise<Response<Transaction[]>> {
	const qs = toQueryString({
		page: params.page ?? 1,
		limit: params.limit ?? 10,
		sortBy: params.sortBy ?? "transactionId",
		sortOrder: params.sortOrder ?? "DESC",
		search: params.search,
		transactionType: params.transactionType,
		crEntityId: params.crEntityId,
		drEntityId: params.drEntityId,
		transactionDate: params.transactionDate,
		status: params.status,
		startDate: params.startDate,
		endDate: params.endDate,
	});

	return request<Response<Transaction[]>>(`${TRANSACTION_BASE}${qs}`);
}


export function getTransactionById(id: number | string): Promise<Response<Transaction>> {
	return request<Response<Transaction>>(`${TRANSACTION_BASE}/${id}`);
}

export function createTransaction(payload: Transaction): Promise<Response> {
	return request<Response>(TRANSACTION_BASE, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function updateTransaction(id: number | string, payload: Partial<Transaction>): Promise<Response> {
	return request<Response>(`${TRANSACTION_BASE}/${id}`, {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export function deleteTransaction(id: number | string): Promise<Response> {
	return request<Response>(`${TRANSACTION_BASE}/${id}`, {
		method: "DELETE",
	});
}

export function getLedgerEntriesByAccount(accountId: number): Promise<Response<Transaction[]>> {
	return request<Response<Transaction[]>>(`${TRANSACTION_BASE}/ledger/${accountId}`);
}