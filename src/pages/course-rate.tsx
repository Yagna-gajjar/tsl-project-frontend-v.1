import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import type { CourseRate } from "@/types/courseRate";
import type { Course } from "@/types/course";
import CourseRateTable from "@/components/view/courseRate/course-rate-table";
import CourseRateFormModal from "@/components/view/courseRate/course-rate-form-modal";
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

export default function CourseRatePage() {
	const [viewOpen, setViewOpen] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [editRow, setEditRow] = useState<CourseRate>();
	const [viewData, setViewData] = useState<number>();
	const [refreshKey, setRefreshKey] = useState(0);

	// Filter State
	const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
	const [courses, setCourses] = useState<Course[]>([]);

	// Load Courses for Filter
	useEffect(() => {
		getCourses({ limit: 100 }).then((res) => {
			setCourses(res.data ?? []);
		});
	}, []);

	const bumpRefresh = () => {
		setRefreshKey((prev) => prev + 1);
	};

	const openView = (row: CourseRate) => {
		setViewData(row.courseRateId);
		setViewOpen(true);
	};

	const openForm = (row?: CourseRate) => {
		setEditRow(row);
		setFormOpen(true);
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

					<Button
						size="lg"
						onClick={() => openForm()}
						className="flex items-center gap-2 px-4 py-2"
					>
						<Plus className="w-5 h-5" />
						Add Rate
					</Button>
				</div>
			</div>

			<div className="rounded-lg">
				<CourseRateTable
					onView={openView}
					onEdit={openForm}
					refreshKey={refreshKey}
					filterCourseId={selectedCourseId !== "all" ? Number(selectedCourseId) : undefined}
				/>
			</div>

			<CourseRateFormModal
				isOpen={formOpen}
				initialData={editRow}
				preSelectedCourseId={selectedCourseId !== "all" ? Number(selectedCourseId) : undefined}
				onClose={() => {
					setFormOpen(false);
					setEditRow(undefined);
				}}
				onSave={handleSaved}
			/>

			<CourseRateViewModal
				isOpen={viewOpen}
				courseRateId={viewData}
				onClose={() => {
					setViewOpen(false);
					setViewData(undefined);
				}}
			/>
		</div>
	);
}