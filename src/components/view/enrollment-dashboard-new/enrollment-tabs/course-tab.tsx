"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Virtuoso } from "react-virtuoso"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, Loader2, Search, Building2 } from "lucide-react"

import { getCourses } from "@/api/course.api"
import { getEnumsByCategory } from "@/api/enums.api"
import { getActivities } from "@/api/activity.api"
import { toast } from "@/hooks/use-toast"
import type { Enrollment as EnrollmentData } from "@/types/enrollment"
import type { Enums } from "@/types/enums"
import type { Activity } from "@/types/activity"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Course } from "@/types/course"

interface CourseTabProps {
	data?: EnrollmentData
	onUpdate: (data: Partial<EnrollmentData>) => void
	member?: any
}

const COL_WIDTHS = "grid-cols-[2fr_1.2fr_1.2fr_1fr_52px_80px_64px_80px_32px]"

function TableHeader() {
	return (
		<div className={`grid ${COL_WIDTHS} gap-x-3 px-3 py-2 bg-muted/60 border-b text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sticky top-0 z-10`}>
			<span>Course</span>
			<span>Activity</span>
			<span>Entity</span>
			<span>Time</span>
			<span className="text-center">Days</span>
			<span className="text-center">Age</span>
			<span className="text-center">Gender</span>
			<span className="text-center">Pattern</span>
			<span />
		</div>
	)
}

export function CourseTab({ data, onUpdate, member }: CourseTabProps) {
	const [courses, setCourses] = useState<Course[]>([])
	const [activities, setActivities] = useState<Activity[]>([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [selectedId, setSelectedId] = useState<number | undefined>(data?.course?.courseId)
	const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

	const [options, setOptions] = useState({
		activityClassification: [] as Enums[],
		activityTypes: [] as Enums[],
	})

	const [filters, setFilters] = useState({
		search: "",
		classification: "all",
		activityType: "all",
		activityId: "all",
		entityId: "all",
	})

	const visibleCourses = useMemo(
		() =>
			courses.filter(
				(c) =>
					c.activityName?.trim().toLowerCase() !== "freezer" &&
					c.status?.toLowerCase() !== "suspended"
			),
		[courses]
	)

	const availableEntities = useMemo(() => {
		const entityMap = new Map()
		visibleCourses.forEach((c) => {
			if (c.entityId && c.entityName) entityMap.set(c.entityId, c.entityName)
		})
		return Array.from(entityMap.entries()).map(([id, name]) => ({ id, name }))
	}, [visibleCourses])

	const handleSearchDebounced = (value: string) => {
		if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
		searchDebounceRef.current = setTimeout(() => {
			setFilters((f) => ({ ...f, search: value }))
		}, 400)
	}

	useEffect(() => {
		const loadEnums = async () => {
			try {
				const [enumClass, enumType] = await Promise.all([
					getEnumsByCategory("ACTIVITYSTATUS"),
					getEnumsByCategory("ACTIVITYTYPE"),
				])
				setOptions({
					activityClassification: enumClass?.data || [],
					activityTypes: enumType?.data || [],
				})
			} catch {
				toast({ title: "Error", description: "Failed to load filter options", variant: "destructive" })
			}
		}
		loadEnums()
	}, [])

	const loadFilteredData = useCallback(async () => {
		setRefreshing(true)
		try {
			const params: any = {
				limit: 500,
				search: filters.search || undefined,
				classification: filters.activityType !== "all" ? filters.activityType : undefined,
				activityId: filters.activityId !== "all" ? filters.activityId : undefined,
				entityId: filters.entityId !== "all" ? filters.entityId : undefined,
			}
			const res = await getCourses(params)
			setCourses(res?.data || [])
		} catch {
			toast({ title: "Error", description: "Failed to refresh courses", variant: "destructive" })
		} finally {
			setRefreshing(false)
			setLoading(false)
		}
	}, [filters])

	useEffect(() => {
		loadFilteredData()
	}, [filters.activityType, filters.activityId, filters.search, filters.entityId])

	useEffect(() => {
		if (filters.activityType !== "all") {
			const fetchActs = async () => {
				const res = await getActivities({ activityType: filters.activityType, limit: 500 })
				setActivities(res?.data || [])
			}
			fetchActs()
		} else {
			setActivities([])
		}
	}, [filters.activityType])

	const handleSelect = (course: Course) => {
		setSelectedId(course.courseId)
		onUpdate({
			course,
			courseId: Number(course.courseId),
			activityId: course.activityId,
			academyEntityId: course.entityId,
			chargingPattern: course.chargingPattern as any,
		})
	}

	useEffect(() => {
		return () => {
			if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
		}
	}, [])

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[800px] space-y-4">
			{/* Filters */}
			<div className="bg-card border rounded-xl p-4 space-y-4 shadow-sm">
				<div className="relative">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by course name..."
						className="pl-9"
						onChange={(e) => handleSearchDebounced(e.target.value)}
					/>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
					<Select
						value={filters.classification}
						onValueChange={(v) => setFilters((f) => ({ ...f, classification: v, activityType: "all", activityId: "all" }))}
					>
						<SelectTrigger><SelectValue placeholder="Classification" /></SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Classifications</SelectItem>
							{options.activityClassification.map((item) => (
								<SelectItem key={item.id} value={String(item.enumCase)}>{item.value}</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={filters.activityType}
						onValueChange={(v) => setFilters((f) => ({ ...f, activityType: v, activityId: "all" }))}
					>
						<SelectTrigger><SelectValue placeholder="Activity Type" /></SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							{options.activityTypes
								.filter((t) => filters.classification === "all" || String(t.enumCase) === filters.classification)
								.map((item) => (
									<SelectItem key={item.id} value={item.value}>{item.value}</SelectItem>
								))}
						</SelectContent>
					</Select>

					<Select value={filters.activityId} onValueChange={(v) => setFilters((f) => ({ ...f, activityId: v }))}>
						<SelectTrigger><SelectValue placeholder="Activity" /></SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Activities</SelectItem>
							{activities.map((act) => (
								<SelectItem key={act.activityId} value={String(act.activityId)}>{act.activityName}</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={filters.entityId} onValueChange={(v) => setFilters((f) => ({ ...f, entityId: v }))}>
						<SelectTrigger>
							<div className="flex items-center gap-2 truncate">
								<Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
								<SelectValue placeholder="Select Entity" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Entities</SelectItem>
							{availableEntities.map((entity) => (
								<SelectItem key={entity.id} value={String(entity.id)}>{entity.name}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Table */}
			<div className="flex-1 border rounded-xl overflow-hidden bg-background relative flex flex-col">
				{(loading || refreshing) && (
					<div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
						<Loader2 className="w-7 h-7 animate-spin text-primary" />
					</div>
				)}

				<TableHeader />

				<Virtuoso
					style={{ flex: 1 }}
					data={visibleCourses}
					itemContent={(_, course) => {
						const isSelected = selectedId === course.courseId

						const genderLabel =
							course.gender === "A" ? "ANY"
								: course.gender === "M" ? "MALE"
									: course.gender === "F" ? "FEM"
										: "OPEN"

						const timeLabel =
							course.avbFrom !== "00:00:00"
								? `${course.avbFrom?.slice(0, 5)}–${course.avbTo?.slice(0, 5)}`
								: "Flex"

						return (
							<div
								onClick={() => handleSelect(course)}
								className={cn(
									"grid gap-x-3 px-3 items-center border-b transition-colors cursor-pointer",
									COL_WIDTHS,
									"h-10",
									isSelected
										? "bg-primary/8 border-l-2 border-l-primary"
										: "hover:bg-muted/40 border-l-2 border-l-transparent"
								)}
							>
								{/* Course name */}
								<span
									className={cn(
										"text-sm font-medium truncate",
										isSelected ? "text-primary font-semibold" : "text-foreground"
									)}
									title={course.courseName}
								>
									{course.courseName}
								</span>

								{/* Activity */}
								<span className="text-xs text-muted-foreground truncate">{course.activityName}</span>

								{/* Entity */}
								<span className="text-xs text-muted-foreground truncate">{course.entityName}</span>

								{/* Time */}
								<span className="text-xs tabular-nums text-muted-foreground">{timeLabel}</span>

								{/* Days/wk */}
								<span className="text-xs text-center text-muted-foreground tabular-nums">
									{course.noOfDaysInWeek}d/wk
								</span>

								{/* Age range */}
								<span className="text-[11px] font-semibold text-center px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
									{course.minAge}–{course.maxAge}y
								</span>

								{/* Gender */}
								<span className="text-[10px] font-bold text-center tracking-wide text-muted-foreground">
									{genderLabel}
								</span>

								{/* Charging pattern */}
								<Badge
									variant={isSelected ? "default" : "outline"}
									className="text-[9px] px-1.5 py-0 h-5 justify-center font-bold tracking-wide"
								>
									{course.chargingPattern}
								</Badge>

								{/* Selected check */}
								<div className="flex justify-center">
									<AnimatePresence>
										{isSelected && (
											<motion.div
												initial={{ scale: 0, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												exit={{ scale: 0, opacity: 0 }}
												transition={{ type: "spring", stiffness: 400, damping: 20 }}
											>
												<CheckCircle2 className="w-4 h-4 text-primary" />
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							</div>
						)
					}}
				/>

				{!loading && visibleCourses.length === 0 && (
					<div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-16">
						No courses found.
					</div>
				)}
			</div>
		</motion.div>
	)
}