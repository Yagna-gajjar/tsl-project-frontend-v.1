export type AuditOperation = "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE";
export type AuditSource = "app" | "direct";

export interface AuditLog {
	logId: number;
	changedAt: string;
	eventName: string;
	tableName: string;
	operation: AuditOperation;
	rowPk: string | null;
	actorSource: AuditSource;
	appUserId: number | null;
	appUserName: string | null;
	appUserRole: string | null;
	dbRole: string;
	clientAddr: string | null;
	appName: string | null;
	oldData: Record<string, unknown> | null;
	newData: Record<string, unknown> | null;
	changedCols: string[] | null;
	txId: string | null;
}

export interface AuditActor {
	actorSource: AuditSource;
	appUserId: number | null;
	appUserName: string | null;
	appUserRole: string | null;
	dbRole: string;
}

export interface AuditMeta {
	tables: string[];
	actors: AuditActor[];
	latestId: string | null;
	latestAt: string | null;
}

export interface AuditStats {
	total: number;
	byOperation: Record<AuditOperation, number>;
}

export interface AuditFilters {
	from?: string;
	to?: string;
	operations?: AuditOperation[];
	tables?: string[];
	sources?: AuditSource[];
	appUserIds?: number[];
	dbRoles?: string[];
	txId?: string;
	q?: string;
}

export interface AuditResponse<T> {
	success: boolean;
	installed?: boolean;
	message?: string;
	data: T;
	hasMore?: boolean;
}
