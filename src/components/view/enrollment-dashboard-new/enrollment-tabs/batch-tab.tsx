"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
	Calendar, Users, Clock, MapPin,
	CheckCircle2, Loader2, AlertCircle, Search
} from "lucide-react"

// API and Types
import { getBatch } from "@/api/batch.api"
import type { Enrollment as EnrollmentData } from "@/types/enrollment"
import type { Batch } from "@/types/batch"

// UI Components
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BatchTabProps {
	data?: EnrollmentData
	onUpdate: (data: Partial<EnrollmentData>) => void
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function BatchTab({ data, onUpdate }: BatchTabProps) {
	const [batches, setBatches] = useState<Batch[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")

	// We initialize this from props, but keep it local to avoid trigger loops
	const [selectedBatchId, setSelectedBatchId] = useState<number | undefined>(data?.batch?.batchId)

	// 1. Memoized API Parameters to avoid unnecessary re-renders
	const apiParams = useMemo(() => {
		const activityId = data?.course?.activityId || data?.activityId;
		const entityId = data?.course?.entityId || data?.academyEntityId;
		const patternStr = data?.attendingPattern;
		const startTime = data?.startTime;

		if (!activityId || !entityId || !patternStr || !startTime) return null;

		// Calculate formatted end time
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
	}, [
		data?.course?.activityId,
		data?.activityId,
		data?.course?.entityId,
		data?.academyEntityId,
		data?.attendingPattern,
		data?.startTime,
		data?.course?.sessionMinutes
	]);

	// 2. Fetch Batches - ONLY triggers when API parameters change
	useEffect(() => {
		if (!apiParams) return;

		const fetchAvailableBatches = async () => {
			setIsLoading(true);
			try {
				const res = await getBatch({
					...apiParams,
					limit: 1000,
				});
				if (res?.success) {
					setBatches(res.data || []);
				}
			} catch (err) {
				toast({ title: "Error", description: "Failed to fetch batches", variant: "destructive" });
			} finally {
				setIsLoading(false);
			}
		};

		fetchAvailableBatches();
	}, [apiParams]); // SelectedBatchId is NOT a dependency here

	// 3. Local Search Filter (Does not hit API)
	const filteredBatches = useMemo(() => {
		if (!searchQuery.trim()) return batches;
		const query = searchQuery.toLowerCase();
		return batches.filter(b =>
			b.batchName.toLowerCase().includes(query) ||
			b.entityName?.toLowerCase().includes(query)
		);
	}, [batches, searchQuery]);

	const handleSelect = (batch: Batch) => {
		setSelectedBatchId(batch.batchId);
		onUpdate({ batch });
	};

	function convertTo12HourFormat(time: any) {
		const [hours, minutes] = time.split(':'); // Split the time into hours and minutes
		let hour = parseInt(hours, 10);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		hour = hour % 12; // Convert to 12-hour format
		hour = hour ? hour : 12; // Handle the 12-hour case for midnight and noon
		return `${hour}:${minutes} ${ampm}`;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="space-y-4 h-full flex flex-col"
		>
			<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div className="space-y-1">
					<h2 className="text-2xl font-bold flex items-center gap-2 dark:text-slate-100">
						<Calendar className="w-6 h-6 text-primary" />
						Select Batch
					</h2>
					<p className="text-xs text-muted-foreground">
						Schedule: <span className="font-bold text-foreground">{convertTo12HourFormat(data?.startTime)}</span> | Pattern: <span className="font-bold text-foreground">{data?.attendingPattern}</span>
					</p>
				</div>

				{/* Local Search Bar */}
				<div className="relative w-full md:w-72">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search batches..."
						className="pl-9 bg-muted/20"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</header>

			{/* Main Content Area */}
			<div className="flex-1 min-h-[400px] relative">
				{isLoading ? (
					<div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10 rounded-xl">
						<Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
						<p className="text-sm font-medium animate-pulse">Syncing schedules...</p>
					</div>
				) : filteredBatches.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto pr-2 max-h-[520px] custom-scrollbar pb-4">
						<AnimatePresence mode="popLayout">
							{filteredBatches.map((batch, index) => {
								const isSelected = selectedBatchId === batch.batchId;
								const capacityReached = Number(batch.activeMemberCount) >= batch.maxCapacity;

								return (
									<motion.div
										key={batch.batchId}
										initial={{ opacity: 0, scale: 0.98 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
										layout
									>
										<Card
											onClick={() => !capacityReached && handleSelect(batch)}
											className={cn(
												"relative p-3 cursor-pointer transition-all border-2 group",
												isSelected
													? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
													: "hover:border-primary/40 border-border bg-card",
												capacityReached && "opacity-50 grayscale cursor-not-allowed"
											)}
										>
											<div className="flex justify-between items-start mb-2">
												<div className="space-y-0.5 min-w-0">
													<h4 className="font-bold text-sm flex items-center gap-1.5 dark:text-slate-200 truncate">
														{batch.batchName}
														{isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
													</h4>
													<div className="flex justify-between pt-1 border-t border-muted/30">
														{WEEK_DAYS
															.map((day, i) => ({
																day,
																index: i + 1,
																isActive: String(batch.daysPattern)?.includes(String(i + 1)),
															}))
															.filter(d => d.isActive) // ✅ only active days
															.map(({ day, index }) => (
																<div key={index} className="flex flex-col items-center">
																	<span className="text-[7px] font-bold uppercase text-primary">
																		{day[0]}
																	</span>
																	<div className="w-1 h-1 rounded-full mt-0.5 bg-primary shadow-[0_0_3px_rgba(var(--primary),1)]" />
																</div>
															))}
													</div>
												</div>
												<Badge variant={capacityReached ? "destructive" : "outline"} className="text-[8px] h-4 px-1 shrink-0 font-black">
													{capacityReached ? "FULL" : batch.batchType}
												</Badge>
											</div>

											<div className="grid grid-cols-2 gap-2 mb-2 border-t border-dashed pt-2">
												<div className="space-y-0">
													<p className="text-[8px] font-black uppercase text-muted-foreground opacity-60">Timing</p>
													<div className="flex items-center gap-1 text-[11px] font-mono font-bold text-primary">
														<Clock className="w-3 h-3" />
														{convertTo12HourFormat(batch.startTime).replace(':00 ', ' ')} - {convertTo12HourFormat(batch.endTime).replace(':00 ', ' ')}
													</div>
												</div>
												<div className="space-y-0 text-right">
													<p className="text-[8px] font-black uppercase text-muted-foreground opacity-60">Occupancy</p>
													<div className="flex items-center justify-end gap-1 text-[11px] font-bold">
														<Users className="w-3 h-3 text-muted-foreground" />
														{batch.activeMemberCount}/{batch.maxCapacity}
													</div>
												</div>
											</div>

											{/* Weekly Days visualization - Compact Version */}
											{/* <div className="flex justify-between pt-1 border-t border-muted/30">
												{WEEK_DAYS.map((day, i) => {
													const isActive = String(batch.daysPattern)?.includes(String(i + 1));
													return (
														<div key={day} className="flex flex-col items-center">
															<span className={cn("text-[7px] font-bold uppercase", isActive ? "text-primary" : "text-muted-foreground/30")}>
																{day[0]}
															</span>
															<div className={cn("w-1 h-1 rounded-full mt-0.5", isActive ? "bg-primary shadow-[0_0_3px_rgba(var(--primary),1)]" : "bg-muted-foreground/20")} />
														</div>
													)
												})}
											</div> */}
										</Card>
									</motion.div>
								)
							})}
						</AnimatePresence>
					</div>
				) : (
					<div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 border-2 border-dashed rounded-2xl bg-muted/5">
						<AlertCircle className="w-12 h-12 mb-4 opacity-20" />
						<h3 className="text-lg font-semibold dark:text-slate-300">No Batches Found</h3>
						<p className="max-w-xs text-center text-sm">
							{searchQuery ? `No results for "${searchQuery}"` : "Try adjusting your filters in previous steps."}
						</p>
						{searchQuery && <Button variant="link" onClick={() => setSearchQuery("")}>Clear Search</Button>}
					</div>
				)}
			</div>

		</motion.div>
	)
}