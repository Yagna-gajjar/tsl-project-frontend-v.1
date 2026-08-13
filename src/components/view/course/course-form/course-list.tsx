import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Activity } from "@/types/activity";
import type { Course } from "@/types/course";
import type { Entity } from "@/types/entity";
import type { Enums } from "@/types/enums";
import { useEffect, useState } from "react";

const WEEKDAY_OPTIONS = [
	{ label: "Monday", value: "1" },
	{ label: "Tuesday", value: "2" },
	{ label: "Wednesday", value: "3" },
	{ label: "Thursday", value: "4" },
	{ label: "Friday", value: "5" },
	{ label: "Saturday", value: "6" },
	{ label: "Sunday", value: "7" },
];

export function CourseForm({
	course,
	errors,
	loading,
	activityOptions,
	entityOptions,
	courseTypeOptions,
	courseStatusOptions,
	onChange,
}: {
	course: Partial<Course>;
	errors: Record<string, string>;
	loading: boolean;
	activityOptions: Activity[];
	entityOptions: Entity[];
	courseTypeOptions: Enums[];
	courseStatusOptions: Enums[];
	onChange: (field: keyof Course, value: any) => void;
}) {
	const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(
		Array.isArray(course.daysPattern) ? course.daysPattern : []
	);

	useEffect(() => {
		setSelectedWeekdays(
			Array.isArray(course.daysPattern) ? course.daysPattern : []
		);
	}, [course.daysPattern]);

	const toggleWeekday = (day: string) => {
		const newSelection = selectedWeekdays.includes(day)
			? selectedWeekdays.filter((d) => d !== day)
			: [...selectedWeekdays, day];
		setSelectedWeekdays(newSelection);
		onChange("daysPattern", newSelection);
	};

	return (
		<div className="grid grid-cols-2 gap-4">
			<div>
				<Label htmlFor="courseType">Course Type*</Label>
				<Select
					value={course.courseType || ""}
					onValueChange={(v) => onChange("courseType", v)}
				>
					<SelectTrigger id="courseType">
						<SelectValue placeholder="Select Type" />
					</SelectTrigger>
					<SelectContent>
						{courseTypeOptions?.map((c) => (
							<SelectItem key={c.enumCase} value={String(c.value)}>
								{c.value}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{errors.courseType && (
					<p className="text-xs text-destructive mt-1">{errors.courseType}</p>
				)}
			</div>
			<div>
				<Label htmlFor="courseName">Course Name*</Label>
				<Input
					id="courseName"
					value={course.courseName || ""}
					onChange={(e) => onChange("courseName", e.target.value)}
					placeholder="Enter course name"
				/>
				{errors.courseName && (
					<p className="text-xs text-destructive mt-1">{errors.courseName}</p>
				)}
			</div>
			<div>
				<Label htmlFor="introduceDate">Introduce Date*</Label>
				<Input
					id="introduceDate"
					type="date"
					value={course.introduceDate || ""}
					onChange={(e) => onChange("introduceDate", e.target.value)}
				/>
				{errors.introduceDate && (
					<p className="text-xs text-destructive mt-1">
						{errors.introduceDate}
					</p>
				)}
			</div>
			<div>
				<Label htmlFor="suspensionDate">Suspension Date</Label>
				<Input
					id="suspensionDate"
					type="date"
					value={course.suspensionDate as string || ""}
					onChange={(e) => onChange("suspensionDate", e.target.value)}
				/>
			</div>
			<div>
				<Label htmlFor="activityId">Activity*</Label>
				<SearchableSelect
					id="activityId"
					disabled={loading}
					value={course.activityId ? String(course.activityId) : ""}
					onValueChange={(v) => onChange("activityId", v)}
					placeholder="Select Activity"
					searchPlaceholder="Search activity..."
					emptyText="No activity found."
					options={activityOptions.map((a) => ({
						value: String(a.activityId),
						label: a.activityName,
					}))}
				/>
				{errors.activityName && (
					<p className="text-xs text-destructive mt-1">{errors.activityName}</p>
				)}
			</div>
			<div>
				<Label htmlFor="avbFrom">Available From</Label>
				<Input
					id="avbFrom"
					type="time"
					value={course.avbFrom || ""}
					onChange={(e) => onChange("avbFrom", e.target.value)}
				/>
			</div>
			<div>
				<Label htmlFor="avbTo">Available To</Label>
				<Input
					id="avbTo"
					type="time"
					value={course.avbTo || ""}
					onChange={(e) => onChange("avbTo", e.target.value)}
				/>
			</div>
			<div>
				<Label htmlFor="entityId">Entity*</Label>
				<SearchableSelect
					id="entityId"
					value={course.entityId ? String(course.entityId) : ""}
					onValueChange={(v) => onChange("entityId", Number(v))}
					placeholder="Select Entity"
					searchPlaceholder="Search entity..."
					emptyText="No entity found."
					options={entityOptions.map((a) => ({
						value: String(a.entityId),
						label: a.entityName,
					}))}
				/>
				{errors.entityId && (
					<p className="text-xs text-destructive mt-1">{errors.entityId}</p>
				)}
			</div>
			<div>
				<Label htmlFor="chargingPattern">Charging Pattern</Label>
				<Select
					value={course.chargingPattern || ""}
					onValueChange={(v) => onChange("chargingPattern", v)}
				>
					<SelectTrigger id="chargingPattern">
						<SelectValue placeholder="Select Pattern" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Unit">Unit</SelectItem>
						<SelectItem value="Day">Day</SelectItem>
						<SelectItem value="Session">Session</SelectItem>
						<SelectItem value="Session">School</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div>
				<Label htmlFor="classification">Classification (Auto)</Label>
				<Input
					id="classification"
					value={course.classification || ""}
					disabled
				/>
			</div>
			<div>
				<Label htmlFor="noOfDaysInWeek">Days Per Week*</Label>
				<Input
					id="noOfDaysInWeek"
					type="number"
					value={course.noOfDaysInWeek || ""}
					onChange={(e) => onChange("noOfDaysInWeek", Number(e.target.value))}
				/>
				{errors.noOfDaysInWeek && (
					<p className="text-xs text-destructive mt-1">
						{errors.noOfDaysInWeek}
					</p>
				)}
			</div>

			<div className="col-span-2">
				<Label>Available On*</Label>
				<div className="flex flex-wrap gap-2 mt-2">
					{WEEKDAY_OPTIONS.map((day) => (
						<Button
							key={day.value}
							type="button"
							variant={
								selectedWeekdays.includes(day.label.toLowerCase())
									? "default"
									: "outline"
							}
							size="sm"
							onClick={() => toggleWeekday(day.label.toLowerCase())}
							className="flex-1 min-w-[80px]"
						>
							{day.label}
						</Button>
					))}
				</div>
				{errors.daysPattern && (
					<p className="text-xs text-destructive mt-1">{errors.daysPattern}</p>
				)}
			</div>

			<div>
				<Label htmlFor="batchCapacity">Max Person*</Label>
				<Input
					id="maxPerson"
					type="number"
					value={course.maxPerson || ""}
					onChange={(e) => onChange("maxPerson", Number(e.target.value))}
				/>
				{errors.maxPerson && (
					<p className="text-xs text-destructive mt-1">{errors.maxPerson}</p>
				)}
			</div>

			<div>
				<Label htmlFor="batchCapacity">Batch Capacity*</Label>
				<Input
					id="batchCapacity"
					type="number"
					value={course.batchCapacity || ""}
					onChange={(e) => onChange("batchCapacity", Number(e.target.value))}
				/>
				{errors.batchCapacity && (
					<p className="text-xs text-destructive mt-1">
						{errors.batchCapacity}
					</p>
				)}
			</div>

			<div>
				<Label htmlFor="totalParallelBatches">Parallel Batches*</Label>
				<Input
					id="totalParallelBatches"
					type="number"
					value={course.totalParallelBatches || ""}
					onChange={(e) =>
						onChange("totalParallelBatches", Number(e.target.value))
					}
				/>
				{errors.totalParallelBatches && (
					<p className="text-xs text-destructive mt-1">
						{errors.totalParallelBatches}
					</p>
				)}
			</div>

			<div>
				<Label htmlFor="minAge">Min Age*</Label>
				<Input
					id="minAge"
					type="number"
					value={course.minAge || ""}
					onChange={(e) => onChange("minAge", Number(e.target.value))}
				/>
				{errors.minAge && (
					<p className="text-xs text-destructive mt-1">{errors.minAge}</p>
				)}
			</div>

			<div>
				<Label htmlFor="maxAge">Max Age*</Label>
				<Input
					id="maxAge"
					type="number"
					value={course.maxAge || ""}
					onChange={(e) => onChange("maxAge", Number(e.target.value))}
				/>
				{errors.maxAge && (
					<p className="text-xs text-destructive mt-1">{errors.maxAge}</p>
				)}
			</div>

			<div>
				<Label htmlFor="gender">Gender*</Label>
				<Select
					value={course.gender || ""}
					onValueChange={(v) => onChange("gender", v as any)}
				>
					<SelectTrigger id="gender">
						<SelectValue placeholder="Select Gender" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Male">Male</SelectItem>
						<SelectItem value="Female">Female</SelectItem>
						<SelectItem value="Any">Any</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div>
				<Label htmlFor="balanceUsable">Balance Usable</Label>
				<Input
					id="balanceUsable"
					value={course.balanceUsable || ""}
					onChange={(e) => onChange("balanceUsable", e.target.value)}
				/>
			</div>

			<div>
				<Label htmlFor="enrApprovalRequired">
					Enrollment Approval Required*
				</Label>

				<Checkbox
					id="enrApprovalRequired"
					checked={course.enrApprovalRequired ?? false}
					onCheckedChange={(checked) =>
						onChange("enrApprovalRequired", checked)
					}
				/>

				{errors.enrApprovalRequired && (
					<p className="text-xs text-destructive mt-1">
						{errors.enrApprovalRequired}
					</p>
				)}
			</div>

			<div>
				<Label htmlFor="CGSTRate">CGSTRate</Label>
				<Input
					id="CGSTRate"
					type="number"
					value={course.cgstRate || ""}
					onChange={(e) => onChange("cgstRate", Number(e.target.value))}
				/>
				{errors.CGSTRate && (
					<p className="text-xs text-destructive mt-1">{errors.CGSTRate}</p>
				)}
			</div>

			<div>
				<Label htmlFor="SGSTRate">SGSTRate</Label>
				<Input
					id="SGSTRate"
					type="number"
					value={course.sgstRate || ""}
					onChange={(e) => onChange("sgstRate", Number(e.target.value))}
				/>
				{errors.SGSTRate && (
					<p className="text-xs text-destructive mt-1">{errors.SGSTRate}</p>
				)}
			</div>

			<div>
				<Label htmlFor="status">Status</Label>
				<Select
					value={course.status || ""}
					onValueChange={(v) => onChange("status", v)}
				>
					<SelectTrigger id="status">
						<SelectValue placeholder="Select Status" />
					</SelectTrigger>
					<SelectContent>
						{courseStatusOptions?.map((s) => (
							<SelectItem key={s.id} value={String(s.value)}>
								{s.value}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{errors.status && (
					<p className="text-xs text-destructive mt-1">{errors.status}</p>
				)}
			</div>
		</div>
	);
}
