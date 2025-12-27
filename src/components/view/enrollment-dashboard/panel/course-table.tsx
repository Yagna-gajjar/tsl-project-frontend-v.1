import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2 } from "lucide-react";
import type { Course } from "@/types/course";

interface CourseTableProps {
	courses: Course[] | undefined;
	activityId?: number | null;
	entityId?: number | null;
	startTime?: string | null;
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function CourseTable({ courses, activityId, entityId, startTime }: CourseTableProps) {
	const filteredCourses = useMemo(() => {
		if (!courses) return [];
		const getMinutes = (timeStr: string) => {
			if (!timeStr) return 0;
			const [hours, minutes] = timeStr.split(":").map(Number);
			return hours * 60 + (minutes || 0);
		};
		return courses.filter((course) => {
			if (activityId && course.activityId !== activityId) return false;
			if (entityId && course.entityId !== entityId) return false;
			if (startTime && course.avbFrom && course.avbTo) {
				const selected = getMinutes(startTime);
				const open = getMinutes(course.avbFrom);
				const close = getMinutes(course.avbTo);
				if (selected < open || selected > close) return false;
			}
			return true;
		});
	}, [courses, activityId, entityId, startTime]);

	if (filteredCourses.length === 0) return null; // Simplified empty state

	return (
		<div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden bg-background">
			<div className="flex-1 overflow-auto border rounded-md m-1 shadow-sm">
				{/* Changed min-w from 1200px to 900px to allow it to fit smaller screens */}
				<Table className="min-w-[900px] table-fixed border-separate border-spacing-0">
					<TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-30">
						<TableRow className="h-8">
							<TableHead className="w-[25px] text-[10px] font-bold uppercase px-2 border-b">Course</TableHead>
							<TableHead className="w-[20px] text-[10px] font-bold uppercase px-2 border-b">Schedule</TableHead>
							<TableHead className="w-[20px] text-[10px] font-bold uppercase px-2 border-b">Time</TableHead>
							<TableHead className="w-[20px] text-[10px] font-bold uppercase px-2 border-b">Requirements</TableHead>
							<TableHead className="w-[20px] text-[10px] font-bold uppercase px-2 border-b">Billing</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{filteredCourses.map((course) => (
							<TableRow key={course.courseId} className="group hover:bg-muted/50 h-10 border-b">
								<TableCell className="overflow-hidden">
									<div className="truncate font-bold text-[15px] group-hover:text-primary transition-colors">
										{course.courseName}
									</div>
									<div className="truncate text-[10px] text-muted-foreground flex items-center gap-1">
										<Building2 className="h-2.5 w-2.5 shrink-0" />
										{course.entityName}
									</div>
								</TableCell>

								<TableCell>
									<div className="flex gap-0.5">
										{DAYS.map((label, i) => {
											const isActive = course.daysPattern?.includes(String(i + 1));
											return (
												<div key={i} className={`h-5 w-5 rounded-sm flex items-center justify-center text-[9px] font-bold border ${isActive ? "bg-primary border-primary text-primary-foreground" : "bg-transparent border-transparent text-muted-foreground/20"
													}`}>
													{label}
												</div>
											);
										})}
									</div>
								</TableCell>

								<TableCell>
									<div className="text-[11px] font-medium whitespace-nowrap">
										{course.avbFrom?.slice(0, 5)}-{course.avbTo?.slice(0, 5)}
									</div>
								</TableCell>

								<TableCell>
									<div className="flex items-center gap-1 flex-wrap">
										<span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1 rounded border border-orange-100">
											{course.minAge}-{course.maxAge}y
										</span>
										<span className={`text-[9px] font-bold px-1 rounded ${course.gender === 'M' ? 'text-blue-600 bg-blue-50' : 'text-pink-600 bg-pink-50'
											}`}>
											{course.gender}
										</span>
									</div>
								</TableCell>

								<TableCell className="text-[10px]">
									<span className="font-bold text-primary">{course.chargingPattern}ly</span>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}