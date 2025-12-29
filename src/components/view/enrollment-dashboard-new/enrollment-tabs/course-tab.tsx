"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Virtuoso } from "react-virtuoso"
import { AnimatePresence, motion } from "framer-motion"
import { BookOpen, CheckCircle2, Clock, Loader2, MapPin, Search, Target, Users, Building2, ChevronRight } from "lucide-react"

import { getCourses } from "@/api/course.api"
import { getEnumsByCategory } from "@/api/enums.api"
import { getActivities } from "@/api/activity.api"
import { toast } from "@/hooks/use-toast"
import type { Course, EnrollmentData } from "@/types/enrollment"
import type { Enums } from "@/types/enums"
import type { Activity } from "@/types/activity"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

interface CourseTabProps {
	data?: EnrollmentData
	onUpdate: (data: Partial<EnrollmentData>) => void
	member?: any
}

export function CourseTab({ data, onUpdate, member }: CourseTabProps) {
	const [courses, setCourses] = useState<Course[]>([])
	const [activities, setActivities] = useState<Activity[]>([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [selectedId, setSelectedId] = useState<number | undefined>(data?.course?.courseId)

	const [options, setOptions] = useState({
		activityClassification: [] as Enums[],
		activityTypes: [] as Enums[],
	})

	const [filters, setFilters] = useState({
		search: "",
		classification: "all",
		activityType: "all",
		activityId: "all",
		entityId: "all" // New filter state
	})

	const memberAge = useMemo(() => {
		if (!member?.dob) return undefined;
		const birthDate = new Date(member.dob);
		const today = new Date();
		let age = today.getFullYear() - birthDate.getFullYear();
		if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age--;
		return age;
	}, [member]);

	// Derived unique entities from fetched courses to populate the dropdown
	const availableEntities = useMemo(() => {
		const entityMap = new Map();
		courses.forEach((c) => {
			if (c.entityId && c.entityName) {
				entityMap.set(c.entityId, c.entityName);
			}
		});
		return Array.from(entityMap.entries()).map(([id, name]) => ({ id, name }));
	}, [courses]);

	useEffect(() => {
		const loadEnums = async () => {
			try {
				const [enumClass, enumType] = await Promise.all([
					getEnumsByCategory("ACTIVITY STATUS"),
					getEnumsByCategory("ACTIVITY TYPE"),
				]);
				setOptions({
					activityClassification: enumClass?.data || [],
					activityTypes: enumType?.data || [],
				});
			} catch (err) {
				toast({ title: "Error", description: "Failed to load filter options", variant: "destructive" });
			}
		};
		loadEnums();
	}, []);

	const loadFilteredData = useCallback(async () => {
		setRefreshing(true);
		try {
			const params: any = {
				limit: 500,
				status: "active",
				search: filters.search || undefined,
				classification: filters.activityType !== "all" ? filters.activityType : undefined,
				activityId: filters.activityId !== "all" ? filters.activityId : undefined,
				entityId: filters.entityId !== "all" ? filters.entityId : undefined, // Send entityId to API
				age: memberAge
			};

			const res = await getCourses(params);
			setCourses(res?.data || []);
		} catch (err) {
			toast({ title: "Error", description: "Failed to refresh courses", variant: "destructive" });
		} finally {
			setRefreshing(false);
			setLoading(false);
		}
	}, [filters, memberAge]);

	useEffect(() => {
		loadFilteredData();
	}, [filters.activityType, filters.activityId, filters.search, filters.entityId]);

	useEffect(() => {
		if (filters.activityType !== "all") {
			const fetchActs = async () => {
				const res = await getActivities({
					activityType: filters.activityType,
					limit: 500
				});
				setActivities(res?.data || []);
			};
			fetchActs();
		} else {
			setActivities([]);
		}
	}, [filters.activityType]);

	const handleSelect = (course: Course) => {
		setSelectedId(course.courseId);
		onUpdate({
			course,
			courseId: Number(course.courseId),
			activityId: course.activityId,
			academyEntityId: course.entityId,
			chargingPattern: course.chargingPattern
		});
	};

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[800px] space-y-4">
			<div className="bg-card border rounded-xl p-4 space-y-4 shadow-sm">
				<div className="relative">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by course name..."
						className="pl-9"
						onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
					<Select value={filters.classification} onValueChange={(v) => setFilters(f => ({ ...f, classification: v, activityType: "all", activityId: "all" }))}>
						<SelectTrigger><SelectValue placeholder="Classification" /></SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Classifications</SelectItem>
							{options.activityClassification.map(item => (
								<SelectItem key={item.id} value={String(item.enumCase)}>{item.value}</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={filters.activityType} onValueChange={(v) => setFilters(f => ({ ...f, activityType: v, activityId: "all" }))}>
						<SelectTrigger><SelectValue placeholder="Activity Type" /></SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							{options.activityTypes.filter(t => filters.classification === "all" || String(t.enumCase) === filters.classification).map(item => (
								<SelectItem key={item.id} value={item.value}>{item.value}</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={filters.activityId} onValueChange={(v) => setFilters(f => ({ ...f, activityId: v }))}>
						<SelectTrigger><SelectValue placeholder="Activity" /></SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Activities</SelectItem>
							{activities.map(act => (
								<SelectItem key={act.activityId} value={String(act.activityId)}>{act.activityName}</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* NEW: Select Entity Filter */}
					<Select value={filters.entityId} onValueChange={(v) => setFilters(f => ({ ...f, entityId: v }))}>
						<SelectTrigger>
							<div className="flex items-center gap-2 truncate">
								<Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
								<SelectValue placeholder="Select Entity" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Entities</SelectItem>
							{availableEntities.map(entity => (
								<SelectItem key={entity.id} value={String(entity.id)}>{entity.name}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex-1 border rounded-xl overflow-hidden bg-muted/5 relative">
				{(loading || refreshing) && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				)}

				<Virtuoso
					style={{ height: '100%' }}
					data={courses}
					itemContent={(index, course) => {
						const isSelected = selectedId === course.courseId;
						const isAgeEligible = memberAge ? (memberAge >= course.minAge && memberAge <= course.maxAge) : true;
						const isGenderEligible = !course.gender || course.gender === 'A' || course.gender.toLowerCase() === member?.gender?.toLowerCase() || course.gender === 'O';
						const isEligible = isAgeEligible && isGenderEligible;

						return (
							<motion.div
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }}
								className="px-4 py-1.5"
							>
								<Card
									onClick={() => isEligible && handleSelect(course)}
									className={`relative overflow-hidden cursor-pointer transition-all border-2 group ${isSelected
										? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
										: "hover:border-primary/30 border-border bg-card"
										} ${!isEligible ? "opacity-50 saturate-50 cursor-not-allowed bg-muted/30" : ""}`}
								>
									<AnimatePresence>
										{isSelected && (
											<motion.div
												layoutId="activeBar"
												className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
											/>
										)}
									</AnimatePresence>

									<div className="p-3 space-y-2">
										<div className="flex items-center justify-between gap-4">
											<div className="flex items-center gap-3 min-w-0">
												<div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"} transition-colors`}>
													<BookOpen className="w-4 h-4" />
												</div>
												<div className="truncate">
													<h4 className="font-bold text-sm truncate leading-none mb-1">
														{course.courseName}
													</h4>
													<div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
														<span>{course.activityName}</span>
														<span>•</span>
														<span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {course.entityName}</span>
													</div>
												</div>
											</div>

											<div className="flex items-center gap-2 shrink-0">
												<Badge variant={isSelected ? "default" : "outline"} className="text-[10px] font-bold px-2 py-0">
													{course.chargingPattern}
												</Badge>
												{isSelected && <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in" />}
											</div>
										</div>

										<div className="flex items-center justify-between border-t border-dashed pt-2">
											<div className="flex items-center gap-4">
												<LogisticsItem
													icon={<Clock className="w-3 h-3" />}
													value={course.avbFrom !== "00:00:00" ? `${course?.avbFrom?.slice(0, 5)} - ${course?.avbTo?.slice(0, 5)}` : "Flexible"}
												/>
												<LogisticsItem
													icon={<Users className="w-3 h-3" />}
													value={`${course.noOfDaysInWeek} Days/Wk`}
												/>
												<LogisticsItem
													icon={<Users className="w-3 h-3" />}
													value={`Cap: ${course.batchCapacity}`}
												/>
											</div>

											<div className="flex items-center gap-3">
												<div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${!isAgeEligible ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"}`}>
													<Target className="w-3 h-3" />
													{course.minAge}-{course.maxAge} Yrs
												</div>
												<div className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${!isGenderEligible ? "border-destructive/20 text-destructive" : "border-muted-foreground/20 text-muted-foreground"}`}>
													{course.gender === 'A' ? 'ANY' : course.gender === 'M' ? 'MALE' : course.gender === 'F' ? 'FEMALE' : 'OPEN'}
												</div>
											</div>
										</div>
									</div>
								</Card>
							</motion.div>
						)
					}}
				/>
			</div>
		</motion.div>
	)
}

function LogisticsItem({ icon, value }: { icon: React.ReactNode, value: string }) {
	return (
		<div className="flex items-center gap-1.5 text-muted-foreground">
			<span className="opacity-70">{icon}</span>
			<span className="text-[11px] font-medium">{value}</span>
		</div>
	)
}