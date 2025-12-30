"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
	Calendar, Users, Clock, MapPin, Loader2, AlertCircle, Search, User,
} from "lucide-react"

// API and Types
import { getBatch } from "@/api/batch.api"
import type { Enrollment as EnrollmentData } from "@/types/enrollment"
import type { Batch } from "@/types/batch"

// UI Components
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface BatchTabProps {
	data?: EnrollmentData
	onUpdate: (data: Partial<EnrollmentData>) => void
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function BatchTab({ data, onUpdate }: BatchTabProps) {
	const [batches, setBatches] = useState<Batch[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedBatchId, setSelectedBatchId] = useState<number | undefined>(data?.batch?.batchId)

	// 1. Memoized API Params (Prevents re-fetch on selection)
	const apiParams = useMemo(() => {
		const activityId = data?.course?.activityId || data?.activityId;
		const entityId = data?.course?.entityId || data?.academyEntityId;
		const patternStr = data?.attendingPattern;
		const startTime = data?.startTime;

		if (!activityId || !entityId || !patternStr || !startTime) return null;

		const [hours, minutes] = String(startTime).split(":").map(Number);
		const sessionMins = data?.course?.sessionMinutes || 0;
		const totalMinutes = hours * 60 + minutes + sessionMins;
		const endHours = Math.floor(totalMinutes / 60) % 24;
		const endMins = totalMinutes % 60;
		const formattedEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;

		return {
			activityId: Number(activityId),
			entityId: Number(entityId),
			daysPattern: String(patternStr),
			startTime: String(startTime),
			endTime: formattedEndTime
		};
	}, [data?.course?.activityId, data?.activityId, data?.course?.entityId, data?.academyEntityId, data?.attendingPattern, data?.startTime, data?.course?.sessionMinutes]);

	// 2. API Fetching
	useEffect(() => {
		if (!apiParams) return;
		const fetchAvailableBatches = async () => {
			setIsLoading(true);
			try {
				const res = await getBatch({ ...apiParams, limit: 1000 });
				if (res?.success) setBatches(res.data || []);
			} catch (err) {
				toast({ title: "Error", description: "Failed to fetch batches", variant: "destructive" });
			} finally {
				setIsLoading(false);
			}
		};
		fetchAvailableBatches();
	}, [apiParams]);

	// 3. Local Search
	const filteredBatches = useMemo(() => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) return batches;
		return batches.filter(b =>
			b.batchName.toLowerCase().includes(query) ||
			b.coachName?.toLowerCase().includes(query) ||
			b.areaName?.toLowerCase().includes(query)
		);
	}, [batches, searchQuery]);

	const handleSelect = (batch: Batch) => {
		setSelectedBatchId(batch.batchId);
		onUpdate({ batch });
	};

	function convertTo12HourFormat(time: string) {
		if (!time) return "";
		const [hours, minutes] = time.split(':');
		let hour = parseInt(hours, 10);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		hour = hour % 12 || 12;
		return `${hour}:${minutes} ${ampm}`;
	}

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 h-full flex flex-col">
			<header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10 p-3 rounded-xl border">
				<div className="flex items-center gap-4">
					<div className="bg-primary/10 p-2 rounded-full">
						<Calendar className="w-5 h-5 text-primary" />
					</div>
					<div>
						<h2 className="text-xl font-bold leading-none mb-1">Select Batch</h2>
						<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
							{convertTo12HourFormat(data?.startTime || "")} • Pattern: {data?.attendingPattern}
						</p>
					</div>
				</div>

				<div className="relative w-full sm:w-64">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search Name or Coach..."
						className="pl-9 h-10 bg-background border-primary/20 focus-visible:ring-primary"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</header>

			<div className="flex-1 relative min-h-[400px]">
				{isLoading ? (
					<div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10 rounded-xl">
						<Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
						<p className="text-sm font-bold animate-pulse">Syncing catalog...</p>
					</div>
				) : filteredBatches.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[550px] pr-1">
						<AnimatePresence mode="popLayout">
							{filteredBatches.map((batch, index) => {
								const isSelected = selectedBatchId === batch.batchId;
								const isFull = Number(batch.activeMemberCount) >= batch.maxCapacity;
								const activeDays = WEEK_DAYS.filter((_, i) => (batch.daysPattern as string)?.includes(String(i + 1))).join(", ");

								return (
									<motion.div
										key={batch.batchId}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.03 }}
										layout
									>
										<Card
											onClick={() => !isFull && handleSelect(batch)}
											className={cn(
												"relative p-4 cursor-pointer transition-all border-2 flex flex-col gap-3 group shadow-sm",
												isSelected
													? "border-primary bg-primary/5 ring-1 ring-primary/10 shadow-md"
													: "hover:border-primary/40 border-border bg-card",
												isFull && "opacity-60 grayscale-[0.5] cursor-not-allowed bg-muted"
											)}
										>
											{/* HEADER: Name & Occupancy */}
											<div className="flex justify-between items-start">
												<div className="min-w-0 flex-1">
													<h4 className="font-black text-base truncate dark:text-slate-100 group-hover:text-primary transition-colors">
														{batch.batchName}
													</h4>
												</div>
												<div className="text-right shrink-0">
													<div className="flex items-center gap-1.5 text-sm font-black text-foreground/80">
														<Users size={14} className="text-primary" />
														{batch.activeMemberCount}/{batch.maxCapacity}
													</div>
													<p className="text-[9px] font-bold text-muted-foreground uppercase">Joined</p>
												</div>
											</div>

											{/* CENTER: High Contrast Days & Time */}
											<div className="bg-muted/30 dark:bg-slate-800/50 p-2.5 rounded-lg border border-border/50">
												<div className="flex items-center gap-2 mb-1.5 text-primary">
													<Clock size={14} />
													<span className="font-mono font-black text-sm">
														{convertTo12HourFormat(batch.startTime)} - {convertTo12HourFormat(batch.endTime)}
													</span>
												</div>
												<div className="text-[11px] font-bold text-foreground/70 tracking-tight">
													{activeDays}
												</div>
											</div>

											{/* FOOTER: Coach & Area */}
											<div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-border/80 text-[11px] font-semibold">
												<div className="flex items-center gap-2 truncate text-muted-foreground">
													<User size={13} className="shrink-0 text-foreground/40" />
													<span className="truncate">{batch.coachName || "No Coach"}</span>
												</div>
												<div className="flex items-center gap-2 justify-end truncate text-muted-foreground">
													<MapPin size={13} className="shrink-0 text-foreground/40" />
													<span className="truncate">{batch.areaName || "Main Area"}</span>
												</div>
											</div>
											{/* 
											{isSelected && (
												<div className="absolute top-2 right-2">
													<CheckCircle2 className="w-5 h-5 text-primary fill-primary/10 animate-in zoom-in duration-300" />
												</div>
											)} */}
										</Card>
									</motion.div>
								)
							})}
						</AnimatePresence>
					</div>
				) : (
					<div className="h-full flex flex-col items-center justify-center p-12 text-center bg-muted/5 rounded-3xl border-2 border-dashed">
						<AlertCircle className="w-16 h-16 mb-4 text-muted-foreground opacity-20" />
						<h3 className="text-xl font-bold">No Batches Found</h3>
						<p className="text-sm text-muted-foreground max-w-xs mt-2">
							{searchQuery ? `No schedules match "${searchQuery}"` : "Please adjust your time or pattern requirements."}
						</p>
					</div>
				)}
			</div>
		</motion.div>
	)
}