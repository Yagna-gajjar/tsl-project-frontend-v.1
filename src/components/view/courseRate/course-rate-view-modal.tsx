import { useCallback } from "react";
import { Hash, Calendar, DollarSign, Snowflake } from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { CourseRate } from "@/types/courseRate";
import { getCourseRateById } from "@/api/courseRate.api";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
	isOpen: boolean;
	courseRateId?: number;
	onClose: () => void;
};

const fields: FieldConfig<CourseRate>[] = [
	{ key: "courseRateId", label: "Rate ID", icon: Hash },
	{ key: "courseId", label: "Course ID", icon: Hash },
	{
		key: "unitRate",
		label: "Unit Rate",
		icon: DollarSign,
		render: (v) => `₹${v}`
	},
	{ key: "aboveUnits", label: "Above Units", icon: Hash },
	{ key: "freezing", label: "Freezing", icon: Snowflake },

	{
		key: "introduceDate",
		label: "Introduce Date",
		icon: Calendar,
		render: (v) => new Date(v as any).toLocaleDateString(),
	},
	{
		key: "createdAt",
		label: "Created At",
		icon: Calendar,
		render: (v) => new Date(v as any).toLocaleString(),
	},
];

export default function CourseRateViewModal({ isOpen, courseRateId, onClose }: Props) {
	const fetchFn = useCallback(async (): Promise<CourseRate> => {
		const res: Response<CourseRate> = await getCourseRateById(Number(courseRateId));
		return res.data as CourseRate;
	}, [courseRateId]);

	return (
		<ViewModal<CourseRate>
			isOpen={isOpen}
			onClose={onClose}
			itemId={Number(courseRateId)}
			fetchFn={fetchFn}
			fields={fields}
			title="Course Rate Details"
			layout="grid"
		/>
	);
}