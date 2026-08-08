import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ChevronRight, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MONO, actorName, operationToken, sourceToken } from "./audit-tokens";
import type { AuditLog } from "@/types/audit";

function formatValue(value: unknown): string {
	if (value === null || value === undefined) return "null";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

function Value({ value, muted }: { value: unknown; muted?: boolean }) {
	const empty = value === null || value === undefined || value === "";
	return (
		<span
			className={cn(
				"break-all",
				MONO,
				empty && "italic text-muted-foreground/60",
				muted && "text-muted-foreground line-through decoration-muted-foreground/40",
			)}
		>
			{empty ? "empty" : formatValue(value)}
		</span>
	);
}

function Detail({ log }: { log: AuditLog }) {
	if (log.operation === "TRUNCATE") {
		return (
			<p className="px-3 py-3 text-xs text-muted-foreground">
				Every row in <span className={MONO}>{log.tableName}</span> was removed by
				a single statement. Row-level values are not recoverable from this entry.
			</p>
		);
	}

	if (log.operation === "UPDATE") {
		const cols = log.changedCols ?? [];
		if (!cols.length) {
			return (
				<p className="px-3 py-3 text-xs text-muted-foreground">
					The row was rewritten with identical values.
				</p>
			);
		}
		return (
			<div className="divide-y divide-border/60">
				{cols.map((col) => (
					<div
						key={col}
						className="grid grid-cols-1 gap-1 px-3 py-2 text-xs sm:grid-cols-[minmax(0,10rem)_1fr]"
					>
						<div className={cn("truncate font-medium", MONO)}>{col}</div>
						<div className="flex min-w-0 flex-wrap items-baseline gap-2">
							<Value value={log.oldData?.[col]} muted />
							<CornerDownRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
							<Value value={log.newData?.[col]} />
						</div>
					</div>
				))}
			</div>
		);
	}

	const row = log.operation === "DELETE" ? log.oldData : log.newData;
	const entries = Object.entries(row ?? {});

	if (!entries.length) {
		return (
			<p className="px-3 py-3 text-xs text-muted-foreground">
				No column values were recorded for this entry.
			</p>
		);
	}

	return (
		<div className="divide-y divide-border/60">
			{entries.map(([key, value]) => (
				<div
					key={key}
					className="grid grid-cols-1 gap-1 px-3 py-2 text-xs sm:grid-cols-[minmax(0,10rem)_1fr]"
				>
					<div className={cn("truncate font-medium", MONO)}>{key}</div>
					<div className="min-w-0">
						<Value value={value} />
					</div>
				</div>
			))}
		</div>
	);
}

interface AuditEventProps {
	log: AuditLog;
	isNew?: boolean;
	nested?: boolean;
}

export function AuditEvent({ log, isNew, nested }: AuditEventProps) {
	const [open, setOpen] = useState(false);
	const token = operationToken(log.operation);
	const source = sourceToken(log.actorSource);
	const changed = log.changedCols ?? [];

	return (
		<div className="flex gap-3">
			{!nested && (
				<div className="w-[86px] shrink-0 pt-2.5 text-right">
					<div className={cn("text-xs leading-none text-foreground/80", MONO)}>
						{format(new Date(log.changedAt), "HH:mm:ss")}
					</div>
					<div className="mt-1 text-[10px] leading-none text-muted-foreground">
						{formatDistanceToNowStrict(new Date(log.changedAt), {
							addSuffix: true,
						})}
					</div>
				</div>
			)}

			{!nested && (
				<div className="relative flex w-4 shrink-0 justify-center">
					<div className="absolute inset-y-0 w-px bg-border" />
					<div
						className={cn(
							"relative mt-[11px] h-2.5 w-2.5 rounded-full ring-4 ring-background",
							token.dot,
						)}
					/>
				</div>
			)}

			<motion.div
				initial={isNew ? { opacity: 0, y: -6 } : false}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.22 }}
				className="min-w-0 flex-1 pb-2"
			>
				<div
					className={cn(
						"relative overflow-hidden rounded-lg border bg-card transition-colors",
						isNew && "border-primary/40",
					)}
				>
					<span
						className={cn("absolute inset-y-0 left-0 w-[3px]", token.edge)}
						aria-hidden
					/>

					<button
						type="button"
						onClick={() => setOpen((v) => !v)}
						aria-expanded={open}
						className="w-full px-3 py-2 pl-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
					>
						<div className="flex items-baseline gap-2">
							<span className={cn("text-sm font-semibold", MONO, token.text)}>
								{log.eventName}
							</span>
							{log.rowPk && (
								<span
									className={cn(
										"truncate text-xs text-muted-foreground",
										MONO,
									)}
								>
									{log.rowPk}
								</span>
							)}
							<ChevronRight
								className={cn(
									"ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
									open && "rotate-90",
								)}
							/>
						</div>

						<div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
							<span className="font-medium text-foreground/90">
								{actorName(log)}
							</span>
							{log.appUserRole && (
								<span className="text-muted-foreground">
									· {log.appUserRole}
								</span>
							)}
							<span className={source.text}>· {source.label}</span>
							{log.clientAddr && (
								<span className={cn("text-muted-foreground", MONO)}>
									· {log.clientAddr}
								</span>
							)}
							{nested && (
								<span className={cn("text-muted-foreground", MONO)}>
									· {format(new Date(log.changedAt), "HH:mm:ss")}
								</span>
							)}
						</div>

						{log.operation === "UPDATE" && changed.length > 0 && (
							<div className="mt-1.5 flex flex-wrap gap-1">
								{changed.slice(0, 6).map((col) => (
									<span
										key={col}
										className={cn(
											"rounded bg-muted px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground",
											MONO,
										)}
									>
										{col}
									</span>
								))}
								{changed.length > 6 && (
									<span className="text-[10px] text-muted-foreground">
										+{changed.length - 6} more
									</span>
								)}
							</div>
						)}
					</button>

					<AnimatePresence initial={false}>
						{open && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.18 }}
								className="overflow-hidden border-t bg-muted/30"
							>
								<Detail log={log} />
								<div className="flex flex-wrap gap-x-4 gap-y-1 border-t px-3 py-2 text-[10px] text-muted-foreground">
									<span className={MONO}>entry #{log.logId}</span>
									{log.txId && <span className={MONO}>tx {log.txId}</span>}
									<span className={MONO}>role {log.dbRole}</span>
									{log.appName && <span className={MONO}>{log.appName}</span>}
									<span className={MONO}>
										{format(new Date(log.changedAt), "d MMM yyyy HH:mm:ss")}
									</span>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</motion.div>
		</div>
	);
}

interface AuditTransactionProps {
	logs: AuditLog[];
	isNew?: boolean;
}

// The signature of this page. A bulk delete is ONE act by ONE person, not 400
// unrelated rows, so events sharing a transaction id are bracketed on the rail
// and summarised as a single entry that can be opened.
export function AuditTransaction({ logs, isNew }: AuditTransactionProps) {
	const [open, setOpen] = useState(false);
	const head = logs[0];
	const token = operationToken(head.operation);
	const source = sourceToken(head.actorSource);

	const byEvent = new Map<string, number>();
	for (const log of logs) {
		byEvent.set(log.eventName, (byEvent.get(log.eventName) ?? 0) + 1);
	}
	const breakdown = [...byEvent.entries()].sort((a, b) => b[1] - a[1]);

	return (
		<div className="flex gap-3">
			<div className="w-[86px] shrink-0 pt-2.5 text-right">
				<div className={cn("text-xs leading-none text-foreground/80", MONO)}>
					{format(new Date(head.changedAt), "HH:mm:ss")}
				</div>
				<div className="mt-1 text-[10px] leading-none text-muted-foreground">
					{formatDistanceToNowStrict(new Date(head.changedAt), {
						addSuffix: true,
					})}
				</div>
			</div>

			<div className={cn("relative flex w-4 shrink-0 justify-center", token.text)}>
				<div className="absolute inset-y-0 w-px bg-border" />
				<div
					className="absolute inset-y-2 left-1/2 w-2 rounded-l-sm border-y-2 border-l-2 border-current opacity-80"
					aria-hidden
				/>
			</div>

			<motion.div
				initial={isNew ? { opacity: 0, y: -6 } : false}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.22 }}
				className="min-w-0 flex-1 pb-2"
			>
				<div className="relative overflow-hidden rounded-lg border bg-card">
					<span
						className={cn("absolute inset-y-0 left-0 w-[3px]", token.edge)}
						aria-hidden
					/>

					<button
						type="button"
						onClick={() => setOpen((v) => !v)}
						aria-expanded={open}
						className="w-full px-3 py-2 pl-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
					>
						<div className="flex items-baseline gap-2">
							<span className="text-sm font-semibold text-foreground">
								One transaction
							</span>
							<span className={cn("text-sm", MONO, token.text)}>
								{logs.length} rows
							</span>
							<ChevronRight
								className={cn(
									"ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
									open && "rotate-90",
								)}
							/>
						</div>

						<div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
							<span className="font-medium text-foreground/90">
								{actorName(head)}
							</span>
							{head.appUserRole && (
								<span className="text-muted-foreground">
									· {head.appUserRole}
								</span>
							)}
							<span className={source.text}>· {source.label}</span>
							{head.clientAddr && (
								<span className={cn("text-muted-foreground", MONO)}>
									· {head.clientAddr}
								</span>
							)}
						</div>

						<div className="mt-1.5 flex flex-wrap gap-1">
							{breakdown.slice(0, 4).map(([name, count]) => (
								<span
									key={name}
									className={cn(
										"rounded bg-muted px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground",
										MONO,
									)}
								>
									{name} × {count}
								</span>
							))}
							{breakdown.length > 4 && (
								<span className="text-[10px] text-muted-foreground">
									+{breakdown.length - 4} more tables
								</span>
							)}
						</div>
					</button>

					<AnimatePresence initial={false}>
						{open && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.18 }}
								className="overflow-hidden border-t bg-muted/30"
							>
								<div className="space-y-1 p-2">
									{logs.slice(0, 50).map((log) => (
										<AuditEvent key={log.logId} log={log} nested />
									))}
									{logs.length > 50 && (
										<p className="px-2 py-2 text-xs text-muted-foreground">
											Showing the first 50 of {logs.length} rows. Filter by
											table to narrow this down.
										</p>
									)}
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</motion.div>
		</div>
	);
}
