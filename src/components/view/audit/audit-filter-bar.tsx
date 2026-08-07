import { useMemo, useState } from "react";
import { Check, ChevronDown, Clock, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MONO, OPERATION_ORDER, operationToken } from "./audit-tokens";
import type {
	AuditFilters,
	AuditMeta,
	AuditOperation,
	AuditSource,
} from "@/types/audit";

export const RANGE_PRESETS = [
	{ id: "15m", label: "15 min", minutes: 15 },
	{ id: "1h", label: "1 hour", minutes: 60 },
	{ id: "24h", label: "24 hours", minutes: 60 * 24 },
	{ id: "7d", label: "7 days", minutes: 60 * 24 * 7 },
	{ id: "30d", label: "30 days", minutes: 60 * 24 * 30 },
	{ id: "all", label: "All time", minutes: 0 },
] as const;

export type RangeId = (typeof RANGE_PRESETS)[number]["id"] | "custom";

export function rangeToFrom(id: RangeId): string | undefined {
	const preset = RANGE_PRESETS.find((p) => p.id === id);
	if (!preset || preset.minutes === 0) return undefined;
	return new Date(Date.now() - preset.minutes * 60_000).toISOString();
}

function toLocalInput(iso?: string) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
		d.getHours(),
	)}:${pad(d.getMinutes())}`;
}

interface OptionRowProps {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}

function OptionRow({ active, onClick, children }: OptionRowProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
				"hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				active && "bg-accent/60",
			)}
		>
			<span
				className={cn(
					"flex h-4 w-4 shrink-0 items-center justify-center rounded border",
					active
						? "border-primary bg-primary text-primary-foreground"
						: "border-border",
				)}
			>
				{active && <Check className="h-3 w-3" />}
			</span>
			<span className="min-w-0 flex-1 truncate">{children}</span>
		</button>
	);
}

interface FilterPopoverProps {
	label: string;
	count: number;
	children: React.ReactNode;
	width?: string;
}

function FilterPopover({ label, count, children, width }: FilterPopoverProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className={cn(
						"h-9 gap-1.5 border-dashed text-xs font-medium",
						count > 0 && "border-solid border-primary/40 bg-primary/5",
					)}
				>
					{label}
					{count > 0 && (
						<span
							className={cn(
								"rounded bg-primary/15 px-1.5 py-0.5 text-[10px] leading-none text-primary",
								MONO,
							)}
						>
							{count}
						</span>
					)}
					<ChevronDown className="h-3.5 w-3.5 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className={cn("p-2", width ?? "w-56")}>
				{children}
			</PopoverContent>
		</Popover>
	);
}

interface AuditFilterBarProps {
	filters: AuditFilters;
	meta: AuditMeta | null;
	rangeId: RangeId;
	onRangeChange: (id: RangeId, from?: string, to?: string) => void;
	onChange: (next: AuditFilters) => void;
	onReset: () => void;
}

export default function AuditFilterBar({
	filters,
	meta,
	rangeId,
	onRangeChange,
	onChange,
	onReset,
}: AuditFilterBarProps) {
	const [tableQuery, setTableQuery] = useState("");

	const tables = useMemo(() => {
		const all = meta?.tables ?? [];
		if (!tableQuery.trim()) return all;
		const q = tableQuery.toLowerCase();
		return all.filter((t) => t.toLowerCase().includes(q));
	}, [meta, tableQuery]);

	const appActors = useMemo(
		() =>
			(meta?.actors ?? []).filter(
				(a) => a.actorSource === "app" && a.appUserId !== null,
			),
		[meta],
	);

	const dbActors = useMemo(() => {
		const seen = new Set<string>();
		return (meta?.actors ?? []).filter((a) => {
			if (a.actorSource !== "direct" || seen.has(a.dbRole)) return false;
			seen.add(a.dbRole);
			return true;
		});
	}, [meta]);

	const toggle = <T,>(list: T[] | undefined, value: T): T[] => {
		const current = list ?? [];
		return current.includes(value)
			? current.filter((v) => v !== value)
			: [...current, value];
	};

	const activeCount =
		(filters.operations?.length ?? 0) +
		(filters.tables?.length ?? 0) +
		(filters.sources?.length ?? 0) +
		(filters.appUserIds?.length ?? 0) +
		(filters.dbRoles?.length ?? 0) +
		(filters.q ? 1 : 0) +
		(rangeId !== "24h" ? 1 : 0);

	const rangeLabel =
		rangeId === "custom"
			? "Custom range"
			: (RANGE_PRESETS.find((p) => p.id === rangeId)?.label ?? "24 hours");

	return (
		<div className="flex flex-wrap items-center gap-2">
			<div className="relative min-w-[200px] flex-1 sm:max-w-xs">
				<Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={filters.q ?? ""}
					onChange={(e) => onChange({ ...filters, q: e.target.value })}
					placeholder="Search values, keys, people…"
					className={cn("h-9 pl-8 text-xs", MONO)}
					aria-label="Search the audit trail"
				/>
			</div>

			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className={cn(
							"h-9 gap-1.5 text-xs font-medium",
							rangeId !== "24h" && "border-primary/40 bg-primary/5",
						)}
					>
						<Clock className="h-3.5 w-3.5 opacity-60" />
						{rangeLabel}
						<ChevronDown className="h-3.5 w-3.5 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-64 p-2">
					<div className="space-y-1">
						{RANGE_PRESETS.map((preset) => (
							<OptionRow
								key={preset.id}
								active={rangeId === preset.id}
								onClick={() => onRangeChange(preset.id)}
							>
								{preset.label}
							</OptionRow>
						))}
					</div>
					<Separator className="my-2" />
					<div className="space-y-2 px-1 pb-1">
						<p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
							Custom range
						</p>
						<label className="block space-y-1">
							<span className="text-[11px] text-muted-foreground">From</span>
							<Input
								type="datetime-local"
								value={toLocalInput(filters.from)}
								onChange={(e) =>
									onRangeChange(
										"custom",
										e.target.value
											? new Date(e.target.value).toISOString()
											: undefined,
										filters.to,
									)
								}
								className="h-8 text-xs"
							/>
						</label>
						<label className="block space-y-1">
							<span className="text-[11px] text-muted-foreground">To</span>
							<Input
								type="datetime-local"
								value={toLocalInput(filters.to)}
								onChange={(e) =>
									onRangeChange(
										"custom",
										filters.from,
										e.target.value
											? new Date(e.target.value).toISOString()
											: undefined,
									)
								}
								className="h-8 text-xs"
							/>
						</label>
					</div>
				</PopoverContent>
			</Popover>

			<FilterPopover label="Operation" count={filters.operations?.length ?? 0}>
				<div className="space-y-1">
					{OPERATION_ORDER.map((op) => {
						const token = operationToken(op);
						return (
							<OptionRow
								key={op}
								active={filters.operations?.includes(op) ?? false}
								onClick={() =>
									onChange({
										...filters,
										operations: toggle<AuditOperation>(filters.operations, op),
									})
								}
							>
								<span className="flex items-center gap-2">
									<span className={cn("h-2 w-2 rounded-full", token.dot)} />
									<span className={cn("text-xs", MONO)}>{token.label}</span>
								</span>
							</OptionRow>
						);
					})}
				</div>
			</FilterPopover>

			<FilterPopover label="Table" count={filters.tables?.length ?? 0} width="w-64">
				<Input
					value={tableQuery}
					onChange={(e) => setTableQuery(e.target.value)}
					placeholder="Find a table…"
					className="mb-2 h-8 text-xs"
				/>
				<div className="max-h-56 space-y-1 overflow-y-auto">
					{tables.length === 0 && (
						<p className="px-2 py-4 text-center text-xs text-muted-foreground">
							No tables recorded yet.
						</p>
					)}
					{tables.map((table) => (
						<OptionRow
							key={table}
							active={filters.tables?.includes(table) ?? false}
							onClick={() =>
								onChange({
									...filters,
									tables: toggle<string>(filters.tables, table),
								})
							}
						>
							<span className={cn("text-xs", MONO)}>{table}</span>
						</OptionRow>
					))}
				</div>
			</FilterPopover>

			<FilterPopover
				label="Who"
				count={
					(filters.appUserIds?.length ?? 0) + (filters.dbRoles?.length ?? 0)
				}
				width="w-64"
			>
				<div className="max-h-64 space-y-1 overflow-y-auto">
					{appActors.length > 0 && (
						<p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
							Through the app
						</p>
					)}
					{appActors.map((actor) => (
						<OptionRow
							key={`app-${actor.appUserId}`}
							active={filters.appUserIds?.includes(actor.appUserId!) ?? false}
							onClick={() =>
								onChange({
									...filters,
									appUserIds: toggle<number>(
										filters.appUserIds,
										actor.appUserId!,
									),
								})
							}
						>
							<span className="text-xs">
								{actor.appUserName ?? `user ${actor.appUserId}`}
								{actor.appUserRole && (
									<span className="ml-1 text-muted-foreground">
										· {actor.appUserRole}
									</span>
								)}
							</span>
						</OptionRow>
					))}

					{dbActors.length > 0 && (
						<p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
							Direct SQL
						</p>
					)}
					{dbActors.map((actor) => (
						<OptionRow
							key={`db-${actor.dbRole}`}
							active={filters.dbRoles?.includes(actor.dbRole) ?? false}
							onClick={() =>
								onChange({
									...filters,
									dbRoles: toggle<string>(filters.dbRoles, actor.dbRole),
								})
							}
						>
							<span className={cn("text-xs", MONO)}>{actor.dbRole}</span>
						</OptionRow>
					))}

					{appActors.length === 0 && dbActors.length === 0 && (
						<p className="px-2 py-4 text-center text-xs text-muted-foreground">
							Nobody has changed anything yet.
						</p>
					)}
				</div>
			</FilterPopover>

			<FilterPopover label="Source" count={filters.sources?.length ?? 0}>
				<div className="space-y-1">
					{(["app", "direct"] as AuditSource[]).map((source) => (
						<OptionRow
							key={source}
							active={filters.sources?.includes(source) ?? false}
							onClick={() =>
								onChange({
									...filters,
									sources: toggle<AuditSource>(filters.sources, source),
								})
							}
						>
							<span className="text-xs">
								{source === "app" ? "Through the app" : "Direct SQL client"}
							</span>
						</OptionRow>
					))}
				</div>
			</FilterPopover>

			{activeCount > 0 && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onReset}
					className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
				>
					<X className="h-3.5 w-3.5" />
					Clear
				</Button>
			)}
		</div>
	);
}
