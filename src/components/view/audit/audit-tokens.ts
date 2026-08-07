import type { AuditOperation } from "@/types/audit";

// Operation colour is the only saturated ink on the page. It appears on the
// rail node and a hairline edge, never as a filled row, so a screen full of
// events still reads calmly and a cluster of deletions stands out instantly.
export interface OperationToken {
	label: string;
	dot: string;
	edge: string;
	text: string;
	bar: string;
}

export const OPERATION_TOKENS: Record<AuditOperation, OperationToken> = {
	INSERT: {
		label: "created",
		dot: "bg-teal-500",
		edge: "bg-teal-500/60",
		text: "text-teal-600 dark:text-teal-400",
		bar: "bg-teal-500",
	},
	UPDATE: {
		label: "updated",
		dot: "bg-amber-500",
		edge: "bg-amber-500/60",
		text: "text-amber-600 dark:text-amber-400",
		bar: "bg-amber-500",
	},
	DELETE: {
		label: "deleted",
		dot: "bg-rose-500",
		edge: "bg-rose-500/60",
		text: "text-rose-600 dark:text-rose-400",
		bar: "bg-rose-500",
	},
	TRUNCATE: {
		label: "wiped",
		dot: "bg-red-600",
		edge: "bg-red-600/70",
		text: "text-red-600 dark:text-red-400",
		bar: "bg-red-600",
	},
};

export const OPERATION_ORDER: AuditOperation[] = [
	"INSERT",
	"UPDATE",
	"DELETE",
	"TRUNCATE",
];

export const MONO = "font-mono tabular-nums";

export function operationToken(op: AuditOperation): OperationToken {
	return OPERATION_TOKENS[op] ?? OPERATION_TOKENS.UPDATE;
}

// A change made outside the app is inherently more suspicious than one made
// through it, so the two sources never share an ink.
export function sourceToken(source: string) {
	return source === "direct"
		? {
				label: "direct SQL",
				text: "text-violet-600 dark:text-violet-400",
				dot: "bg-violet-500",
			}
		: {
				label: "via app",
				text: "text-muted-foreground",
				dot: "bg-muted-foreground/50",
			};
}

export function actorName(log: {
	actorSource: string;
	appUserName: string | null;
	appUserId: number | null;
	dbRole: string;
}): string {
	if (log.actorSource === "app") {
		return log.appUserName ?? `user ${log.appUserId ?? "?"}`;
	}
	return log.dbRole;
}
