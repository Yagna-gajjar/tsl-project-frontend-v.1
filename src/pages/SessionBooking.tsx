import { useEffect, useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Search, User, Loader2, ChevronRight, X, Clock, AlertCircle, MapPin, Users, CheckCircle2,
	Calendar as CalendarIcon, History, Ticket
} from 'lucide-react'
import { format, parseISO, addMinutes, parse, getDay, isBefore, isAfter, startOfDay } from 'date-fns'

import { getMembersForSession } from '@/api/member.api'
import { getBatch } from '@/api/batch.api'
import { createSession, getBatchMember } from '@/api/batchMember.api'
import { toast } from '@/hooks/use-toast'
import type { Batch } from '@/types/batch'
import type { Response } from '@/types/response'
import type { BatchMember } from '@/types/batchMember'

import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/authContext'
import { useNavigate } from 'react-router-dom'

interface SessionMember {
	enrollmentId: number;
	attendingStartDate: string;
	endDate: string;
	enrollmentNo: number;
	memberId: number;
	memberFirstName: string;
	memberLastName: string;
	activityId: number;
	sessionMinutes: number;
	avbFrom: string;
	avbTo: string;
	attendingPattern: string;
	billingDaysSessions: string;
}

const SessionBooking = () => {
	const [search, setSearch] = useState("")
	const [members, setMembers] = useState<SessionMember[]>([])
	const [selectedMember, setSelectedMember] = useState<SessionMember | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [showResults, setShowResults] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const { user } = useAuth();
	const navigate = useNavigate();

	const [date, setDate] = useState<Date | undefined>(undefined)
	const [startTime, setStartTime] = useState("")
	const [sessionsCount, setSessionsCount] = useState(1)

	const [batches, setBatches] = useState<Batch[]>([])
	const [isBatchesLoading, setIsBatchesLoading] = useState(false)
	const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)
	const [pastSession, setPastSession] = useState<BatchMember[]>([]);

	const formatTo12Hr = (time24?: string) => {
		if (!time24) return "—";
		try {
			return format(parse(time24.slice(0, 5), "HH:mm", new Date()), "hh:mm a");
		} catch { return time24; }
	};

	const sessionStats = useMemo(() => {
		if (!selectedMember) return { total: 0, used: 0, available: 0 };
		const total = Number(selectedMember.billingDaysSessions) || 0;
		const used = pastSession.reduce((acc, curr) => acc + (curr.sessions || 0), 0);
		return { total, used, available: total - used };
	}, [selectedMember, pastSession]);

	const fetchPastAppointments = async (enrollmentNo: number, memberId: number) => {
		try {
			const aRes = await getBatchMember({ enrollmentNo, memberId });
			if (aRes?.success) setPastSession(aRes?.data || []);
		} catch {
			toast({ title: "Error", description: "Failed to fetch past appointments", variant: "destructive" });
		}
	}

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			if (search.length > 1 && !selectedMember) handleFetchMembers(search);
		}, 400);
		return () => clearTimeout(delayDebounceFn);
	}, [search, selectedMember]);

	const handleFetchMembers = async (query: string) => {
		setIsLoading(true);
		try {
			const res: any = await getMembersForSession(query);
			if (res.success) {
				setMembers(res.data || []);
				setShowResults(true);
			}
		} catch (error) {
			toast({ title: "Error", description: "Could not load members", variant: "destructive" });
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (selectedMember?.activityId && startTime) {
			fetchBatches(selectedMember.activityId, startTime);
		}
	}, [startTime, selectedMember?.activityId]);

	const fetchBatches = async (activityId: number, time: string) => {
		setIsBatchesLoading(true);
		try {
			const bRes: Response<Batch[]> = await getBatch({ activityId, startTime: time, limit: 1000 });
			if (bRes.success) setBatches(bRes?.data || []);
		} catch {
			toast({ title: "Error", description: "Failed to fetch batches", variant: "destructive" });
		} finally {
			setIsBatchesLoading(false);
		}
	};

	const bookingLogic = useMemo(() => {
		if (!selectedMember || !startTime) return null;
		const totalMinutes = sessionsCount * selectedMember.sessionMinutes;
		const start = parse(startTime, "HH:mm", new Date());
		const end = addMinutes(start, totalMinutes);
		const endTimeFormatted = format(end, "HH:mm");
		const isTimeValid = startTime >= selectedMember.avbFrom.slice(0, 5) &&
			endTimeFormatted <= selectedMember.avbTo.slice(0, 5);

		let isDayValid = true;
		if (date) {
			const day = getDay(date);
			const adjustedDay = day === 0 ? 7 : day;
			isDayValid = selectedMember.attendingPattern.includes(String(adjustedDay));
		}

		return { endTimeFormatted, isTimeValid, isDayValid };
	}, [startTime, sessionsCount, selectedMember, date]);

	const handleConfirmBooking = async () => {
		if (!selectedMember || !date || !selectedBatchId || !bookingLogic) return;

		const day = getDay(date);
		const calculatedPattern = day === 0 ? 7 : day;

		const payload: BatchMember = {
			batchId: selectedBatchId,
			enrollmentNo: selectedMember.enrollmentNo,
			memberId: selectedMember.memberId,
			startTime: startTime,
			endTime: bookingLogic.endTimeFormatted,
			startDate: format(date, "yyyy-MM-dd"),
			endDate: format(date, "yyyy-MM-dd"),
			level: 1,
			sessions: sessionsCount,
			status: 'active',
			daysPattern: Number(calculatedPattern),
			createdBy: user?.memberId ?? null
		};
		try {
			const sRes: Response<BatchMember> = await createSession(payload);
			if (sRes.success) {
				toast({ title: "Success", description: "Session Booked Successfully.", variant: "success" });
				setTimeout(() => navigate(0), 300);
			} else {
				throw new Error();
			}
		} catch {
			toast({ title: "Error", description: "Failed to book session.", variant: "destructive" });
		}
	};

	return (
		<div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6" ref={containerRef}>
			<div className="flex justify-between items-end">
				<div className="space-y-1">
					<h1 className="text-2xl font-black tracking-tight">Session Booking</h1>
					<p className="text-sm text-muted-foreground">Manage and track member training sessions.</p>
				</div>
			</div>

			<div className="relative">
				<div className="relative">
					<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search member name or ID..."
						className="pl-10 h-12 border-2 text-base font-medium"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							if (selectedMember) setSelectedMember(null);
						}}
					/>
					<div className="absolute right-3 top-3 flex items-center gap-2">
						{isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
						{search && <X className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => { setSearch(""); setSelectedMember(null); setPastSession([]); }} />}
					</div>
				</div>

				<AnimatePresence>
					{showResults && members.length > 0 && (
						<motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-50 w-full mt-2 border rounded-2xl bg-popover shadow-2xl overflow-hidden">
							<ScrollArea className="max-h-64 p-2">
								{members.map((m) => (
									<div key={m.enrollmentId} onClick={() => {
										setSelectedMember(m);
										setSearch(`${m.memberFirstName} ${m.memberLastName}`);
										setShowResults(false);
										fetchPastAppointments(m.enrollmentNo, m.memberId);
									}} className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-transparent hover:border-blue-100">
										<div className="flex flex-col">
											<span className="font-bold text-base">{m.memberFirstName} {m.memberLastName}</span>
											<span className="text-xs font-mono text-muted-foreground">ID: #{m.memberId} | Enr: {m.enrollmentNo}</span>
										</div>
										<ChevronRight size={18} className="text-blue-500" />
									</div>
								))}
							</ScrollArea>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<AnimatePresence mode="wait">
				{selectedMember && (
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

						<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
							<Card className="bg-slate-900 text-white border-none shadow-lg">
								<CardContent className="p-5 flex items-center gap-4">
									<div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30"><User size={24} /></div>
									<div className="min-w-0">
										<p className="font-black text-lg truncate leading-none">{selectedMember.memberFirstName}</p>
										<p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Enr #{selectedMember.enrollmentNo}</p>
									</div>
								</CardContent>
							</Card>

							<Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 shadow-none">
								<CardContent className="p-5 flex items-center gap-4">
									<div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600"><Clock size={24} /></div>
									<div>
										<p className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Availablity</p>
										<p className="text-sm font-bold">{formatTo12Hr(selectedMember.avbFrom)} — {formatTo12Hr(selectedMember.avbTo)}</p>
									</div>
								</CardContent>
							</Card>

							<Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 shadow-none">
								<CardContent className="p-5 flex items-center gap-4">
									<div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600"><Ticket size={24} /></div>
									<div>
										<p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Session Balance</p>
										<p className="text-sm font-bold">
											{sessionStats.used} <span className="text-muted-foreground font-normal">/ {sessionStats.total} Used</span>
											<Badge className="ml-2 bg-emerald-600 h-5 text-[10px] font-black">{sessionStats.available} Left</Badge>
										</p>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="space-y-3">
							<div className="flex items-center gap-2 px-1">
								<History size={16} className="text-muted-foreground" />
								<Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Booking History</Label>
							</div>
							{pastSession.length > 0 ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
									{pastSession.map((session, idx) => (
										<Card key={idx} className="bg-muted/30 border-none shadow-none group hover:bg-muted/50 transition-colors">
											<CardContent className="p-3 space-y-2">
												<div className="flex justify-between items-start">
													<p className="text-xs font-black uppercase">{session.batchName}</p>
													<Badge variant="outline" className="text-[9px] h-4 px-1">{session.status}</Badge>
												</div>
												<div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
													<CalendarIcon size={12} />
													{format(parseISO(session.startDate as string), "dd MMM yyyy")}
												</div>
												<div className="flex items-center justify-between text-[11px] font-mono font-bold bg-background p-1.5 rounded-md border">
													<span>{formatTo12Hr(session.startTime)}</span>
													<ChevronRight size={10} className="opacity-30" />
													<span>{formatTo12Hr(session.endTime)}</span>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							) : (
								<div className="p-8 text-center border-2 border-dashed rounded-2xl text-muted-foreground bg-muted/10">
									<p className="text-xs font-bold uppercase tracking-widest opacity-50">No past sessions recorded</p>
								</div>
							)}
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
							<Card className="lg:col-span-5 border-2 shadow-sm rounded-2xl overflow-hidden h-fit">
								<CardHeader className="bg-muted/50 border-b py-4">
									<CardTitle className="text-base flex items-center gap-2 font-black uppercase tracking-tight"><Clock size={18} className="text-primary" /> New Schedule</CardTitle>
								</CardHeader>
								<CardContent className="p-5 space-y-5">
									{sessionStats.available <= 0 ? (
										<div className="p-4 rounded-xl bg-red-50 text-red-700 flex items-start gap-3 border border-red-100">
											<AlertCircle size={20} />
											<p className="text-sm font-bold">No sessions available in balance. Limit reached.</p>
										</div>
									) : (
										<>
											<div className="space-y-2">
												<Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Date</Label>
												<Popover>
													<PopoverTrigger asChild>
														<Button variant="outline" className={cn("w-full justify-start text-left font-bold h-11 border-2", !date && "text-muted-foreground")}>
															<CalendarIcon className="mr-2 h-4 w-4" />
															{date ? format(date, "PPP") : <span>Select Date</span>}
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<Calendar
															mode="single"
															selected={date}
															onSelect={setDate}
															disabled={(d) => {
																const start = startOfDay(parseISO(selectedMember.attendingStartDate));
																const end = startOfDay(parseISO(selectedMember.endDate));
																if (isBefore(d, start) || isAfter(d, end)) return true;
																const day = getDay(d);
																const adjustedDay = day === 0 ? 7 : day;
																return !selectedMember.attendingPattern.includes(String(adjustedDay));
															}}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
											</div>

											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Start Time</Label>
													<Input type="time" className="h-11 border-2 font-bold" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
												</div>
												<div className="space-y-2">
													<Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sessions ({sessionStats.available} max)</Label>
													<Input
														type="number"
														min={1}
														max={sessionStats.available}
														className="h-11 border-2 font-bold"
														value={sessionsCount}
														onChange={(e) => setSessionsCount(Math.min(Number(e.target.value), sessionStats.available))}
													/>
												</div>
											</div>

											<AnimatePresence>
												{startTime && bookingLogic && (
													<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
														<div className={cn(
															"p-4 rounded-xl border-2 flex flex-col gap-2",
															bookingLogic.isTimeValid ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-red-50 border-red-200 text-red-700"
														)}>
															<div className="flex justify-between items-center opacity-70">
																<span className="text-[10px] font-black uppercase tracking-widest">Duration Profile</span>
																<Badge variant="outline" className="text-[10px] border-white/20 text-white font-mono">{selectedMember.sessionMinutes * sessionsCount} Min</Badge>
															</div>
															<div className="text-xl font-black font-mono flex items-center justify-between">
																<span>{formatTo12Hr(startTime)}</span>
																<ChevronRight size={16} className="opacity-30" />
																<span>{formatTo12Hr(bookingLogic.endTimeFormatted)}</span>
															</div>
															{!bookingLogic.isTimeValid && (
																<p className="text-[10px] font-black uppercase mt-1 flex items-center gap-1.5"><AlertCircle size={14} /> Outside allowed Course hours</p>
															)}
														</div>
													</motion.div>
												)}
											</AnimatePresence>
										</>
									)}
								</CardContent>
							</Card>

							<div className="lg:col-span-7 space-y-4">
								<div className="flex items-center gap-2 px-1">
									<Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Available Batches</Label>
									{isBatchesLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
								</div>

								{batches.length > 0 ? (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										{batches.map((batch) => {
											const isSelected = selectedBatchId === batch.batchId;
											return (
												<Card
													key={batch.batchId}
													onClick={() => setSelectedBatchId(Number(batch.batchId))}
													className={cn(
														"relative p-4 cursor-pointer transition-all border-2 rounded-2xl group",
														isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/10 shadow-lg" : "hover:border-slate-300 bg-card"
													)}
												>
													<div className="flex justify-between items-start mb-3">
														<div className="space-y-1 min-w-0">
															<h4 className="font-black text-sm text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{batch.batchName}</h4>
															<p className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded w-fit text-primary">
																{formatTo12Hr(batch.startTime)} — {formatTo12Hr(batch.endTime)}
															</p>
														</div>
														{isSelected && <div className="bg-primary p-1 rounded-full shrink-0"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
													</div>

													<div className="space-y-2 text-[11px] font-bold">
														<div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
															<User size={14} className="text-blue-600" /> {batch.coachName}
														</div>
														<div className="flex items-center gap-2 text-muted-foreground font-medium">
															<MapPin size={14} /> {batch.areaName || "Main Arena"}
														</div>
														<div className="flex items-center justify-between pt-3 border-t border-dashed mt-2">
															<div className="flex items-center gap-1.5 font-black text-slate-800 dark:text-slate-200">
																<Users size={14} className="text-slate-400" />
																<span>{batch.activeMemberCount} <span className="text-muted-foreground font-medium">/ {batch.maxCapacity}</span></span>
															</div>
															<Badge variant="outline" className="text-[9px] h-4 font-black bg-white dark:bg-slate-900">{batch.batchType}</Badge>
														</div>
													</div>
												</Card>
											)
										})}
									</div>
								) : (
									<div className="h-48 flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] bg-muted/10 text-muted-foreground">
										<Clock size={32} className="opacity-10 mb-2" />
										<p className="text-xs font-black uppercase tracking-widest opacity-40">Choose time to find batches</p>
									</div>
								)}
							</div>
						</div>

						{selectedBatchId && date && bookingLogic?.isTimeValid && bookingLogic?.isDayValid && sessionStats.available > 0 && (
							<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="sticky bottom-0 z-10 pt-2">
								<Card className="bg-slate-900 text-white border-none shadow-2xl rounded-3xl overflow-hidden ring-4 ring-white dark:ring-slate-950">
									<CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
										<div className="flex items-center gap-4">
											<div className="bg-green-500 p-3 rounded-2xl text-white shadow-lg shadow-green-500/20"><CheckCircle2 className="w-6 h-6" /></div>
											<div className="min-w-0">
												<p className="text-[10px] font-black uppercase text-green-400 tracking-widest">Post Confirmation</p>
												<div className="flex items-center gap-2 mt-1 truncate">
													<span className="text-sm font-bold truncate max-w-[150px]">{selectedMember.memberFirstName}</span>
													<span className="h-1 w-1 rounded-full bg-white/30" />
													<span className="text-sm font-bold text-blue-400 truncate max-w-[150px]">{batches.find(b => b.batchId === selectedBatchId)?.batchName}</span>
													<span className="h-1 w-1 rounded-full bg-white/30" />
													<span className="text-sm font-mono">{formatTo12Hr(startTime)}</span>
												</div>
											</div>
										</div>
										<Button
											onClick={handleConfirmBooking}
											className="w-full sm:w-auto h-12 px-12 bg-blue-600 text-white font-black uppercase text-xs rounded-xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 border-none"
										>
											Commit Booking
										</Button>
									</CardContent>
								</Card>
							</motion.div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

export default SessionBooking