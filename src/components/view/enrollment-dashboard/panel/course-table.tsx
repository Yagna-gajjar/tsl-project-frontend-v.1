import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Building2, Activity, ShieldCheck } from "lucide-react";
import type { Course } from "@/types/course";

interface CourseTableProps {
	courses: Course[] | undefined;
	// Filter props passed from the Dashboard
	activityId?: number | null;
	entityId?: number | null;
	startTime?: string | null;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CourseTable({ courses, activityId, entityId, startTime }: CourseTableProps) {
	const filteredCourses = useMemo(() => {
		if (!courses) return [];

		const getMinutes = (timeStr: string) => {
			if (!timeStr) return 0;
			// Handles both HH:mm:ss and HH:mm formats
			const [hours, minutes] = timeStr.split(":").map(Number);
			return hours * 60 + (minutes || 0);
		};

		return courses.filter((course) => {
			// 1. Filter by Activity ID
			if (activityId && course.activityId !== activityId) return false;

			// 2. Filter by Academy Entity ID
			if (entityId && course.entityId !== entityId) return false;

			// 3. Filter by Start Time logic (avbFrom <= startTime <= avbTo)
			if (startTime && course.avbFrom && course.avbTo) {
				const selectedTime = getMinutes(startTime);
				const openTime = getMinutes(course.avbFrom);
				const closeTime = getMinutes(course.avbTo);

				// Include borders (border inclusive logic)
				if (selectedTime < openTime || selectedTime > closeTime) {
					return false;
				}
			}

			return true;
		});
	}, [courses, activityId, entityId, startTime]);

	// Empty state handling for filtered results
	if (filteredCourses.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-xl m-4 bg-muted/10">
				<Activity className="h-10 w-10 mb-2 opacity-20" />
				<p className="text-lg font-medium">No courses match the selected filters</p>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
			<div className="flex-1 overflow-auto border rounded-md m-2 shadow-inner bg-card">
				{/* min-w-[1600px] ensures horizontal scrolling for deep data visibility */}
				<Table className="min-w-[1600px] border-separate border-spacing-0 relative">
					<TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-30 shadow-sm">
						<TableRow className="hover:bg-transparent">
							<TableHead className="w-[350px] text-[14px] font-bold text-primary py-4 pl-4 border-b-2">Course & Organization</TableHead>
							<TableHead className="w-[350px] text-[14px] font-bold text-primary border-b-2">Weekly Schedule</TableHead>
							<TableHead className="w-[200px] text-[14px] font-bold text-primary border-b-2">Timings</TableHead>
							<TableHead className="w-[200px] text-[14px] font-bold text-primary border-b-2">Requirements</TableHead>
							<TableHead className="w-[180px] text-[14px] font-bold text-primary border-b-2">Billing Logic</TableHead>
							<TableHead className="w-[120px] text-[14px] font-bold text-primary text-center pr-4 border-b-2">Status</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{filteredCourses.map((course) => (
							<TableRow key={course.courseId} className="group hover:bg-muted/40 transition-colors border-b">
								{/* 1. Identity Cell */}
								<TableCell className="py-4 border-r pl-4">
									<div className="flex flex-col gap-1">
										<span className="text-[16px] font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
											{course.courseName}
										</span>
										<div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
											<Building2 className="h-4 w-4" />
											<span className="truncate max-w-[280px]">{course.entityName}</span>
										</div>
										<div className="flex gap-2 mt-2">
											<Badge variant="secondary" className="text-[11px] px-2 py-0.5 h-5 font-semibold">
												{course.activityName}
											</Badge>
											<Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 border-blue-200 text-blue-700 bg-blue-50 font-semibold">
												{course.courseType}
											</Badge>
										</div>
									</div>
								</TableCell>

								{/* 2. Weekly Pattern Cell */}
								<TableCell className="py-4 border-r">
									<div className="flex flex-col gap-2">
										<div className="flex items-center gap-1.5">
											{DAY_LABELS.map((day, index) => {
												const isActive = course.daysPattern?.includes(String(index + 1));
												return (
													<div
														key={day}
														className={`flex-1 flex flex-col items-center justify-center rounded-md border py-2.5 min-w-[42px]
                              ${isActive
																? "bg-primary text-primary-foreground border-primary shadow-sm font-bold scale-105"
																: "bg-muted/20 text-muted-foreground/20 border-transparent italic"
															}`}
													>
														<span className="text-[11px] uppercase leading-none">{day}</span>
													</div>
												);
											})}
										</div>
										<span className="text-xs text-muted-foreground font-bold italic ml-1">
											Total: {course.noOfDaysInWeek} Days in week
										</span>
									</div>
								</TableCell>

								{/* 3. Timings Cell */}
								<TableCell className="py-4 border-r">
									<div className="flex flex-col gap-2">
										<div className="flex items-center gap-2 text-[15px] font-bold text-slate-700">
											<Clock className="h-5 w-5 text-primary" />
											<span>{course.avbFrom?.slice(0, 5)} - {course.avbTo?.slice(0, 5)}</span>
										</div>
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-7">
											<span>{course.sessionMinutes || "60"} mins session</span>
										</div>
									</div>
								</TableCell>

								{/* 4. Requirements Cell */}
								<TableCell className="py-4 border-r">
									<div className="flex flex-col gap-3">
										<div className="flex items-center gap-2 text-[15px]">
											<Users className="h-5 w-5 text-orange-500" />
											<span className="font-bold">{course.minAge} to {course.maxAge} Years</span>
										</div>
										<div className="flex items-center gap-2">
											<Badge className={`text-[10px] font-black px-2 py-0.5 rounded ${course.gender === 'M' ? 'bg-blue-600' :
												course.gender === 'F' ? 'bg-pink-600' : 'bg-slate-600'
												}`}>
												{course.gender === 'O' ? 'UNISEX' : course.gender === 'M' ? 'MALE' : 'FEMALE'}
											</Badge>
											{course.batchCapacity && (
												<span className="text-[11px] font-bold text-muted-foreground">
													Cap: {course.batchCapacity}
												</span>
											)}
										</div>
									</div>
								</TableCell>

								{/* 5. Billing Cell */}
								<TableCell className="py-4 border-r">
									<div className="flex flex-col gap-1.5">
										<div className="text-[15px] font-extrabold text-primary underline decoration-primary/20 underline-offset-4">
											{course.chargingPattern}ly Basis
										</div>
										<div className="text-xs text-muted-foreground font-medium leading-relaxed">
											Unit Multiplier: {course.unitsMultipleOf}<br />
											Approval Needed: {course.enrApprovalRequired ? "Yes" : "No"}
										</div>
									</div>
								</TableCell>

								{/* 6. Status Cell */}
								<TableCell className="py-4 text-center pr-4">
									<div className="flex flex-col items-center gap-2">
										<div className={`px-4 py-1.5 rounded-full text-[10px] font-black border-2 tracking-tighter shadow-sm ${course.status === 'active'
											? 'bg-emerald-50 border-emerald-500 text-emerald-700'
											: 'bg-slate-100 border-slate-300 text-slate-500'
											}`}>
											{course?.status?.toUpperCase()}
										</div>
										{course.enrApprovalRequired && (
											<div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
												<ShieldCheck className="h-3.5 w-3.5" />
												Mandatory Approval
											</div>
										)}
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}