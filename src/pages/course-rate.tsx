import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import type { CourseRate } from "@/types/courseRate";
import type { Course } from "@/types/course";
import CourseRateTable from "@/components/view/courseRate/course-rate-table";
import CourseRateViewModal from "@/components/view/courseRate/course-rate-view-modal";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getCourses } from "@/api/course.api";
import CourseRateExcelUpload from "@/components/view/courseRate/course-rate-excel-upload";

export default function CourseRatePage() {
	const [viewOpen, setViewOpen] = useState(false);
	const [viewData, setViewData] = useState<number>();
	const [refreshKey, setRefreshKey] = useState(0);

	const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
	const [courses, setCourses] = useState<Course[]>([]);
	const [excelOpen, setExcelOpen] = useState(false);
	const bumpRefresh = () => {
		setRefreshKey((prev) => prev + 1);
	};

	useEffect(() => {
		getCourses({ limit: 100 }).then((res) => {
			setCourses(res.data ?? []);
		});
	}, []);


	const openView = (row: CourseRate) => {
		setViewData(row.courseRateId);
		setViewOpen(true);
	};

	const handleSaved = () => {
		bumpRefresh();
	};

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Course Rates
					</h1>
					<p className="text-gray-500 mt-2">Manage pricing and rates</p>
				</div>

				<div className="flex gap-3">
					{/* Course Filter */}
					<Select
						value={selectedCourseId}
						onValueChange={setSelectedCourseId}
					>
						<SelectTrigger className="w-[200px] bg-background">
							<SelectValue placeholder="Filter by Course" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Courses</SelectItem>
							{courses.map((c) => (
								<SelectItem key={c.courseId} value={String(c.courseId)}>
									{c.courseName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							size="lg"
							onClick={() => setExcelOpen(true)}
							className="flex items-center gap-2 px-4 py-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
						>
							<Upload className="w-5 h-5" />
							Upload Excel
						</Button>
					</div>
				</div>
			</div>

			<div className="rounded-lg">
				<CourseRateTable
					onView={openView}
					refreshKey={refreshKey}
					filterCourseId={selectedCourseId !== "all" ? Number(selectedCourseId) : undefined}
				/>
			</div>

			<CourseRateViewModal
				isOpen={viewOpen}
				courseRateId={viewData}
				onClose={() => {
					setViewOpen(false);
					setViewData(undefined);
				}}
			/>

			<CourseRateExcelUpload
				isOpen={excelOpen}
				onClose={() => setExcelOpen(false)}
				onSuccess={() => {
					handleSaved();
				}}
			/>
		</div>
	);
}