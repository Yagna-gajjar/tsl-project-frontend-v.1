import { request } from "./helper";
import type {
	AuditFilters,
	AuditLog,
	AuditMeta,
	AuditResponse,
	AuditStats,
} from "@/types/audit";

const AUDIT_BASE = import.meta.env.VITE_APP_API_URL + "/audit";

function toQuery(filters: AuditFilters, extra: Record<string, unknown> = {}) {
	const params = new URLSearchParams();

	const append = (key: string, value: unknown) => {
		if (value === undefined || value === null || value === "") return;
		if (Array.isArray(value)) {
			if (!value.length) return;
			params.append(key, value.join(","));
			return;
		}
		params.append(key, String(value));
	};

	append("from", filters.from);
	append("to", filters.to);
	append("operations", filters.operations);
	append("tables", filters.tables);
	append("sources", filters.sources);
	append("appUserIds", filters.appUserIds);
	append("dbRoles", filters.dbRoles);
	append("txId", filters.txId);
	append("q", filters.q);

	for (const [key, value] of Object.entries(extra)) append(key, value);

	const s = params.toString();
	return s ? `?${s}` : "";
}

export function getAuditLogs(
	filters: AuditFilters,
	options: { limit?: number; afterId?: number; beforeId?: number } = {},
): Promise<AuditResponse<AuditLog[]>> {
	return request<AuditResponse<AuditLog[]>>(
		`${AUDIT_BASE}/logs${toQuery(filters, options)}`,
	);
}

export function getAuditStats(
	filters: AuditFilters,
): Promise<AuditResponse<AuditStats>> {
	return request<AuditResponse<AuditStats>>(
		`${AUDIT_BASE}/stats${toQuery(filters)}`,
	);
}

export function getAuditMeta(): Promise<AuditResponse<AuditMeta>> {
	return request<AuditResponse<AuditMeta>>(`${AUDIT_BASE}/meta`);
}
