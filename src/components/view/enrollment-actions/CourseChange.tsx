import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getEnrollmentById } from "@/api/enrollment.api";
import type { Response } from '@/types/response';
import type { Enrollment } from '@/types/enrollment';
import { FormFooter } from '@/components/form-modal/form-footer';
import { FormContent } from '@/components/form-modal/form-content';
import { format, differenceInCalendarDays, parseISO, addDays, isDate } from 'date-fns';
import type { Activity } from '@/types/activity';
import type { Academy } from '@/types/academy';
import type { Course } from '@/types/course';
import type { Batch } from '@/types/batch';
import { getAcademies } from '@/api/academy.api';
import { getCourses } from '@/api/course.api';
import { getBatch } from '@/api/batch.api';
import { getActivities } from '@/api/activity.api';

const CourseChange = () => {
	const { id }: any = useParams();
	const [error, setError] = useState<string>("");
	const [oldEnrollment, setOldEnrollment] = useState<Enrollment>();
	const [fieldErrors] = useState<any>({});
	const [isSubmitting] = useState<boolean>(false);
	const [selectedActivity, setSelectedActivity] = useState<string>("");
	const [activity, setActivity] = useState<Activity[]>([]);
	const [academy, setAcademy] = useState<Academy[]>([]);
	const [course, setCourse] = useState<Course[]>([]);
	const [batches, setBatches] = useState<Batch[]>([]);
	const [values, setValues] = useState<Enrollment>({
		enrollmentId: id,
		memberId: oldEnrollment?.memberId || 0,
		academyId: 0,
		adjustment: 0,
		batchId: 0,
		billingAmount: 0,
		billingRate: 0,
		cndn: 0,
		commitedAmount: 0,
		courseId: 0,
		discountedAmount: 0,
		discountId: 0,
		endDate: 0 as any,
		enrollmentDate: format(Date.now(), 'yyyy-MM-dd') as any,
		freeDays: 0,
		numberOfDays: 0,
		openEnrollment: false,
		sessionUnits: 0,
		startDate: format(new Date(), 'yyyy-MM-dd') as any,
		status: 'active',
		processingCharge: 100,
		changeType: "course-change"
	});
	const onClose = () => {
		setValues({} as any);
	};

	const handleSubmit = () => {
		console.log(values);
	}
	function calculateDays(startISO?: any, endISO?: any, inclusive = false) {
		if (!startISO || !endISO) return 0; // or return null, throw error, etc.
		// Extract only the date part (yyyy-mm-dd)
		const startDate = parseISO(startISO.slice(0, 10));
		const endDate = parseISO(endISO.slice(0, 10));

		let diff = differenceInCalendarDays(endDate, startDate);
		diff -= 1;
		if (inclusive) diff += 1;

		return diff;
	}
	function addDaysToDate(startISO: string | Date | null | undefined, daysToAdd: number) {
		if (!startISO) return null;

		let startDate: any;

		if (isDate(startISO)) {
			startDate = startISO;
		}
		else if (typeof startISO === "string") {
			const dateOnly = startISO.slice(0, 10);
			startDate = parseISO(dateOnly);
		}
		else {
			console.error("Invalid date format:", startISO);
			return null;
		}

		const newDate = addDays(startDate, daysToAdd);

		return format(newDate, "yyyy-MM-dd");
	}
	useEffect(() => {
		const fetchEnrollment = async () => {
			try {
				const response: Response<Enrollment | any> = await getEnrollmentById(id);
				const data = response?.data || [];
				setOldEnrollment(data);
			}
			catch (err) {
				setError("Failed to fetch enrollment details");
			}
		}
		const fetchActivities = async () => {
			try {
				const res: Response<Activity> = await getActivities({
					limit: 100,
				});
				const data = res?.data || [];
				setActivity(data as any);
			}
			catch (err) {
				setError("Failed to fetch activities!")
			}
		}
		fetchEnrollment();
		fetchActivities();

	}, [id]);

	useEffect(() => {
		if (!values?.activityName) return;
		if (!selectedActivity) return;

		const loadAcademies = async () => {
			try {
				const res: Response<Academy> | any = await getAcademies({
					search: selectedActivity
				});
				setAcademy(res?.data || []);
			} catch {
				setError("Failed to load academies.");
			}
		};

		loadAcademies();
	}, [values?.activityName]);

	useEffect(() => {
		if (!values?.courseId) return;

		const c: Course = course.filter((c) => c.courseId == values?.courseId)[0]

		const finalAmount = values?.billingAmount - (values?.processingCharge || 0);
		const { days, adjust } = AdjustDays(finalAmount / c.unitRate);
		const endDate = addDaysToDate(new Date(values?.startDate), days)
		console.log(finalAmount, " amount");
		setValues((prev: any) => ({
			...prev,
			billingRate: c.unitRate,
			commitedAmount: days * c.unitRate,
			numberOfDays: days,
			discountedAmount: 0,
			adjustment: adjust * c.unitRate,
			endDate: endDate
		}));

		const loadBatches = async () => {
			try {
				const res: Response<Batch> | any = await getBatch({
					courseId: values.courseId
				});
				setBatches(res?.data || []);
			} catch {
				setError("Failed to load batches.");
			}
		};

		loadBatches();
	}, [values?.courseId, values?.processingCharge, values?.billingAmount]);


	useEffect(() => {
		if (!values?.academyId) return;

		const loadCourses = async () => {
			try {
				const res: Response<Course> | any = await getCourses({
					academyId: values.academyId
				});
				setCourse(res?.data || []);
			} catch {
				setError("Failed to load courses.");
			}
		};

		loadCourses();
	}, [values?.academyId]);

	const AdjustDays = (days: number) => {
		const roundedDays = Math.floor(days);
		const newAdjust = Math.abs(roundedDays - days);

		return {
			days: Number(roundedDays.toFixed(2)),
			adjust: Number(newAdjust.toFixed(2))
		};
	};

	useEffect(() => {
		if (!values?.endDate) return;
		const newEndDate = addDaysToDate(values?.startDate, values?.freeDays + values?.numberOfDays);
		setValues((prev: any) => ({
			...prev,
			endDate: newEndDate
		}))
	}, [values?.freeDays]);

	useEffect(() => {
		if (!values?.startDate || !oldEnrollment) return;

		const diff = calculateDays(oldEnrollment.startDate, values.startDate);
		console.log(diff + 1, " diff");
		const usedAmount = oldEnrollment.billingRate * (diff + 1);
		const remaining = oldEnrollment.billingAmount - usedAmount;

		setValues(prev => ({
			...prev,
			billingAmount: remaining
		}));
	}, [values.startDate, oldEnrollment]);

	const fields = [
		{
			name: "enrollmentDate",
			label: "Enrollment Date",
			type: "date",
			required: true,
		},
		{
			name: "startDate",
			label: "Start Date",
			type: "date",
			required: true,
		},
		{
			name: "endDate",
			label: "End Date",
			type: "date",
			required: false,
			disabled: true,
		},
		{
			name: "activityName",
			label: "Activity Name",
			type: "select",
			options: activity.map((e) => ({
				label: e.activityName,
				value: Number(e.activityId),
			})),
			required: true,
		},
		{
			name: "academyId",
			label: "Academy",
			type: "select",
			options: academy.map((e) => ({
				label: e.academyName,
				value: Number(e.academyId),
			})),
			required: true,
		},
		{
			name: "courseId",
			label: "Course",
			type: "select",
			options: course.map((e) => ({
				label: e.courseName,
				value: Number(e.courseId),
			})),
			required: true,
		},
		{
			name: "batchId",
			label: "Batch",
			type: "select",
			options: batches.map((b) => ({
				label: `${b.batchName} | ${b.startTime} To ${b.endTime}`,
				value: Number(b.batchId),
			})),
			required: true,
		},
		{
			name: "billingAmount",
			label: "Remaining Amount",
			type: "number",
			disabled: true,
		},
		{
			name: "processingCharge",
			label: "Processing Charge",
			type: "number",
		},
		{
			name: "freeDays",
			label: "Free Days",
			type: "number",
			required: false,
		},
		{
			name: "sessionUnits",
			label: "Session Units",
			type: "number",
			required: false,
		},
		{
			name: "numberOfDays",
			label: "Number Of Days",
			type: "number",
			required: false,
			disabled: true
		},
		// {
		// 	name: "discountedAmount",
		// 	label: "Discounted Amount",
		// 	type: "number",
		// 	required: false,
		// 	disabled: true,
		// },
		{
			name: "commitedAmount",
			label: "Commited Amount",
			type: "number",
			required: true,
			disabled: true,
		},
		{
			name: "billingRate",
			label: "Billing Rate",
			type: "number",
			disabled: true,
		},
		{
			name: "cndn",
			label: "CNDN",
			type: "number",
		},
		{
			name: "adjustment",
			label: "Adjustment",
			type: "number",
			disabled: true,
		},
		{
			name: "openEnrollment",
			label: "Open Enrollment",
			type: "checkbox",
		},
		// {
		// 	name: "discountId",
		// 	label: "Discount ID",
		// 	type: "number",
		// 	required: false,
		// 	disabled: true
		// },
		// {
		// 	name: "isDiscounted",
		// 	label: "Do you want to remove applied discount?",
		// 	type: "checkbox",
		// 	required: false,
		// },
		{
			name: "remarks",
			label: "Remarks",
			type: "textarea",
		},
		{
			name: "status",
			label: "Status",
			type: "select",
			options: [
				{ label: "Active", value: "active" },
				{ label: "Inactive", value: "inactive" },
				{ label: "Completed", value: "completed" },
			],
			required: true,
		},
	];

	const onChange = (field: string, value: any) => {
		const numFields = ["academyId", "memberId", "courseId", "batchId", "numberOfDays", "freeDays"];

		if (numFields.includes(field)) {
			value = Number(value);
		}

		if (field === "activityName") {
			const data = activity.find(e => e.activityId === Number(value));
			setSelectedActivity(data?.activityName || "");
		}

		setValues(prev => ({ ...prev, [field]: value }));
	};
	return (
		<div className="flex flex-col max-h-[90vh] overflow-hidden">
			<div className="overflow-auto">
				<FormContent
					fields={fields as any}
					values={values as any}
					errors={fieldErrors}
					loading={false}
					error={error}
					isSubmitting={isSubmitting}
					onChange={onChange as any}
					layout="grid"
				/>
			</div>

			<FormFooter
				onClose={onClose}
				onSubmit={handleSubmit}
				submitLabel="Create"
				isSubmitting={isSubmitting}
			/>
		</div>
	);
};

export default CourseChange;