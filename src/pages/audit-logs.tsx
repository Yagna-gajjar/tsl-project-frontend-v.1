import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { AlertTriangle, Database, RefreshCw, ShieldOff, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getSelectedDb } from "@/api/helper";
import { getAuditLogs, getAuditMeta, getAuditStats } from "@/api/audit.api";
import { usePermissions } from "@/hooks/use-permissions";
import AuditFilterBar, {
	rangeToFrom,
	type RangeId,
} from "@/components/view/audit/audit-filter-bar";
import {
	AuditEvent,
	AuditTransaction,
} from "@/components/view/audit/audit-event";
import {
	MONO,
	OPERATION_ORDER,
	operationToken,
} from "@/components/view/audit/audit-tokens";
import type {
	AuditFilters,
	AuditLog,
	AuditMeta,
	AuditStats,
} from "@/types/audit";

const PAGE_SIZE = 60;
const LIVE_INTERVAL_MS = 5000;

type StreamItem =
	| { kind: "single"; log: AuditLog }
	| { kind: "tx"; logs: AuditLog[] };

// Rows written by one statement share a txId and arrive contiguously, so a
// single pass collapses them into one entry.
function buildStream(logs: AuditLog[]): StreamItem[] {
	const out: StreamItem[] = [];
	let i = 0;
	while (i < logs.length) {
		const current = logs[i];
		if (!current.txId) {
			out.push({ kind: "single", log: current });
			i += 1;
			continue;
		}
		let j = i + 1;
		while (j < logs.length && logs[j].txId === current.txId) j += 1;
		const slice = logs.slice(i, j);
		out.push(
			slice.length > 1
				? { kind: "tx", logs: slice }
				: { kind: "single", log: current },
		);
		i = j;
	}
	return out;
}

function dayLabel(iso: string): string {
	const d = new Date(iso);
	if (isToday(d)) return "Today";
	if (isYesterday(d)) return "Yesterday";
	return format(d, "EEEE d MMMM yyyy");
}

function EmptyPanel({
	icon: Icon,
	title,
	children,
}: {
	icon: React.ElementType;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
			<Icon className="mb-3 h-6 w-6 text-muted-foreground" />
			<h3 className="text-sm font-semibold">{title}</h3>
			<div className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
				{children}
			</div>
		</div>
	);
}

export default function AuditLogsPage() {
	const { can } = usePermissions();
	const allowed = can("Audit");

	const [rangeId, setRangeId] = useState<RangeId>("24h");
	const [filters, setFilters] = useState<AuditFilters>(() => ({
		from: rangeToFrom("24h"),
	}));
	const [applied, setApplied] = useState<AuditFilters>(filters);

	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [meta, setMeta] = useState<AuditMeta | null>(null);
	const [stats, setStats] = useState<AuditStats | null>(null);
	const [installed, setInstalled] = useState(true);
	const [notice, setNotice] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(false);

	const [live, setLive] = useState(false);
	const [atTop, setAtTop] = useState(true);
	const [newIds, setNewIds] = useState<Set<number>>(new Set());

	const streamRef = useRef<HTMLDivElement | null>(null);
	const newestIdRef = useRef<number | null>(null);

	useEffect(() => {
		newestIdRef.current = logs.length ? logs[0].logId : null;
	}, [logs]);

	// Debounce so typing in the search box does not fire a query per keystroke.
	useEffect(() => {
		const t = setTimeout(() => setApplied(filters), 300);
		return () => clearTimeout(t);
	}, [filters]);

	const load = useCallback(
		async (next: AuditFilters) => {
			setLoading(true);
			setError(null);
			const [logRes, statRes] = await Promise.all([
				getAuditLogs(next, { limit: PAGE_SIZE }),
				getAuditStats(next),
			]);

			if (!logRes.success) {
				setError(logRes.message ?? "Could not read the audit log.");
				setLoading(false);
				return;
			}

			if (logRes.installed === false) {
				setInstalled(false);
				setNotice(logRes.message ?? null);
				setLogs([]);
				setLoading(false);
				return;
			}

			setInstalled(true);
			setNotice(null);
			setLogs(Array.isArray(logRes.data) ? logRes.data : []);
			setHasMore(Boolean(logRes.hasMore));
			if (statRes.success && statRes.installed !== false) {
				setStats(statRes.data);
			}
			setLoading(false);
		},
		[],
	);

	useEffect(() => {
		void load(applied);
	}, [applied, load]);

	useEffect(() => {
		let active = true;
		void getAuditMeta().then((res) => {
			if (!active || !res.success) return;
			if (res.installed === false) setInstalled(false);
			else setMeta(res.data);
		});
		return () => {
			active = false;
		};
	}, []);

	// Live tail. Only runs while the tab is visible and the reader is at the top,
	// so new entries never shove the row being read out from under the cursor.
	useEffect(() => {
		if (!live || !atTop || !installed) return;

		let cancelled = false;
		const tick = async () => {
			if (document.visibilityState !== "visible") return;

			const afterId = newestIdRef.current;
			if (!afterId) {
				void load(applied);
				return;
			}

			const res = await getAuditLogs(applied, { afterId, limit: PAGE_SIZE });
			if (cancelled || !res.success || res.installed === false) return;
			const fresh = Array.isArray(res.data) ? res.data : [];
			if (!fresh.length) return;

			setLogs((prev) => [...fresh, ...prev]);
			setNewIds(new Set(fresh.map((l) => l.logId)));
			void getAuditStats(applied).then((s) => {
				if (!cancelled && s.success && s.installed !== false) setStats(s.data);
			});
		};

		const id = setInterval(() => void tick(), LIVE_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearInterval(id);
		};
	}, [live, atTop, installed, applied, load]);

	// Let the arrival highlight fade rather than sticking to the row forever.
	useEffect(() => {
		if (!newIds.size) return;
		const t = setTimeout(() => setNewIds(new Set()), 2500);
		return () => clearTimeout(t);
	}, [newIds]);

	const loadOlder = async () => {
		const oldest = logs[logs.length - 1];
		if (!oldest) return;
		setLoadingMore(true);
		const res = await getAuditLogs(applied, {
			beforeId: oldest.logId,
			limit: PAGE_SIZE,
		});
		if (res.success && res.installed !== false && Array.isArray(res.data)) {
			setLogs((prev) => [...prev, ...res.data]);
			setHasMore(Boolean(res.hasMore));
		}
		setLoadingMore(false);
	};

	const handleRange = (id: RangeId, from?: string, to?: string) => {
		setRangeId(id);
		if (id === "custom") {
			setFilters((f) => ({ ...f, from, to }));
			return;
		}
		setFilters((f) => ({ ...f, from: rangeToFrom(id), to: undefined }));
	};

	const reset = () => {
		setRangeId("24h");
		setFilters({ from: rangeToFrom("24h") });
	};

	const stream = useMemo(() => buildStream(logs), [logs]);
	const database = getSelectedDb();
	const total = stats?.total ?? 0;

	if (!allowed) {
		return (
			<div className="mx-auto max-w-2xl py-16">
				<EmptyPanel icon={ShieldOff} title="Audit trail is restricted">
					Only a superadmin can read the audit trail, because it exposes the
					before and after values of every table — including the record of the
					admins themselves.
				</EmptyPanel>
			</div>
		);
	}

	return (
		<div className="mx-auto flex h-[calc(100vh-5.5rem)] max-w-6xl flex-col gap-4">
			<header className="shrink-0 space-y-3">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0">
						<div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
							<Database className="h-3 w-3" />
							<span className={MONO}>{database ?? "default database"}</span>
						</div>
						<h1 className="mt-1 text-2xl font-semibold tracking-tight">
							Audit trail
						</h1>
						<p className="mt-0.5 text-sm text-muted-foreground">
							Every change to every table, newest first.
						</p>
					</div>

					<div className="flex items-center gap-2">
						<label
							className={cn(
								"flex h-9 cursor-pointer select-none items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors",
								live
									? "border-primary/50 bg-primary/5"
									: "border-border hover:bg-accent",
							)}
						>
							<Radio
								className={cn(
									"h-3.5 w-3.5",
									live ? "text-primary" : "text-muted-foreground",
								)}
							/>
							<span>Live</span>
							<Switch
								checked={live}
								onCheckedChange={setLive}
								aria-label="Stream new entries as they happen"
							/>
						</label>

						<Button
							variant="outline"
							size="sm"
							className="h-9 gap-1.5 text-xs"
							onClick={() => void load(applied)}
							disabled={loading}
						>
							<RefreshCw
								className={cn("h-3.5 w-3.5", loading && "animate-spin")}
							/>
							Refresh
						</Button>
					</div>
				</div>

				{live && !atTop && (
					<p className="text-xs text-muted-foreground">
						Live paused while you read. Scroll back to the top to resume.
					</p>
				)}

				{installed && stats && total > 0 && (
					<div className="space-y-1.5">
						<div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
							{OPERATION_ORDER.map((op) => {
								const count = stats.byOperation[op] ?? 0;
								if (!count) return null;
								return (
									<div
										key={op}
										className={operationToken(op).bar}
										style={{ width: `${(count / total) * 100}%` }}
									/>
								);
							})}
						</div>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
							<span>
								<span className={cn("font-medium text-foreground", MONO)}>
									{total.toLocaleString()}
								</span>{" "}
								changes in view
							</span>
							{OPERATION_ORDER.map((op) => {
								const count = stats.byOperation[op] ?? 0;
								if (!count) return null;
								const token = operationToken(op);
								return (
									<span key={op} className="flex items-center gap-1.5">
										<span className={cn("h-2 w-2 rounded-full", token.dot)} />
										<span className={cn("text-foreground/80", MONO)}>
											{count.toLocaleString()}
										</span>
										{token.label}
									</span>
								);
							})}
						</div>
					</div>
				)}

				{installed && (
					<AuditFilterBar
						filters={filters}
						meta={meta}
						rangeId={rangeId}
						onRangeChange={handleRange}
						onChange={setFilters}
						onReset={reset}
					/>
				)}
			</header>

			<div
				ref={streamRef}
				onScroll={(e) => setAtTop(e.currentTarget.scrollTop < 40)}
				className="min-h-0 flex-1 overflow-y-auto pr-1"
			>
				{!installed && (
					<EmptyPanel icon={AlertTriangle} title="Audit logging is not installed">
						{notice ??
							"This database has no audit schema yet."}{" "}
						Run{" "}
						<code className={cn("rounded bg-muted px-1 py-0.5", MONO)}>
							audit-log.sql
						</code>{" "}
						against it, then refresh. Recording starts from that moment — it
						cannot describe changes made before it was installed.
					</EmptyPanel>
				)}

				{installed && error && (
					<EmptyPanel icon={AlertTriangle} title="Could not load the audit trail">
						{error}
					</EmptyPanel>
				)}

				{installed && !error && loading && (
					<div className="space-y-2">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="flex gap-3">
								<Skeleton className="h-10 w-[86px] shrink-0" />
								<Skeleton className="h-10 flex-1" />
							</div>
						))}
					</div>
				)}

				{installed && !error && !loading && stream.length === 0 && (
					<EmptyPanel icon={Database} title="Nothing matches these filters">
						No changes were recorded in this window. Widen the time range, or
						clear the filters to see the whole trail.
					</EmptyPanel>
				)}

				{installed && !error && !loading && stream.length > 0 && (
					<div>
						{stream.map((item, index) => {
							const head = item.kind === "single" ? item.log : item.logs[0];
							const prev =
								index === 0
									? null
									: stream[index - 1].kind === "single"
										? (stream[index - 1] as { log: AuditLog }).log
										: (stream[index - 1] as { logs: AuditLog[] }).logs[0];
							const showDay =
								!prev ||
								dayLabel(prev.changedAt) !== dayLabel(head.changedAt);

							return (
								<div key={head.logId}>
									{showDay && (
										<div className="flex items-center gap-3 py-3 first:pt-0">
											<span className="w-[86px] shrink-0" />
											<span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
												{dayLabel(head.changedAt)}
											</span>
											<span className="h-px flex-1 bg-border" />
										</div>
									)}
									{item.kind === "single" ? (
										<AuditEvent
											log={item.log}
											isNew={newIds.has(item.log.logId)}
										/>
									) : (
										<AuditTransaction
											logs={item.logs}
											isNew={newIds.has(item.logs[0].logId)}
										/>
									)}
								</div>
							);
						})}

						{hasMore && (
							<div className="flex justify-center py-4 pl-[110px]">
								<Button
									variant="outline"
									size="sm"
									className="text-xs"
									onClick={() => void loadOlder()}
									disabled={loadingMore}
								>
									{loadingMore ? "Loading…" : "Load older entries"}
								</Button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
