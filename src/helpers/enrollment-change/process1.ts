import type { EnrollmentData } from "@/types/enrollment";
import { getBatchMember } from "@/api/batchMember.api";
import { getCourseRates } from "@/api/courseRate.api";
import { addDays } from "date-fns";
import { getFinalAmounts } from "../enrollment";

export interface Process1Result {
	modify: EnrollmentData;
	newVersion: EnrollmentData;
	values: any;
}

const nowISO = (): string => new Date().toISOString();
const formatDate = (d: Date): string => d.toISOString().split("T")[0];
const diffDaysInclusive = (start: Date, end: Date): number => {
	const msPerDay = 24 * 60 * 60 * 1000;
	return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
};

export async function process1(
	enrollmentData: EnrollmentData,
	endDate: Date,
	givenProcessingCharge: number,
	applyNewRates: boolean
): Promise<Process1Result> {

	const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));

	const modifyAmounts = getFinalAmounts(
		Number(base.roundedAmount),
		1,
		0,
		1,
		Number(base.processingCharge),
		Number(base.sgstRate),
		Number(base.cgstRate),
		1,
		"",
		0,
		""
	);

	const modify: EnrollmentData = {
		...base,
		cgstAmount: Number(modifyAmounts.cgstAmount.toFixed(2)),
		sgstAmount: Number(modifyAmounts.sgstAmount.toFixed(2)),
		totalDebitAmount: Number(modifyAmounts.totalDebitAmount.toFixed(2)),
		officeRemarks: base.officeRemarks
			? `${base.officeRemarks} | Enrolment Canceled Processing Charges Billed - Auto Terminated`
			: "Enrolment Canceled Processing Charges Billed - Auto Terminated",
		updatedAt: nowISO(),
		status: "history",
	};

	if (!base.attendingStartDate) throw new Error("attendingStartDate is required");

	const startDate = new Date(base.attendingStartDate);
	const calculatedPermittedDays = diffDaysInclusive(startDate, endDate);

	let billingDaysSessions = 0;
	const chargingPattern = (base.chargingPattern || "").toLowerCase();

	if (chargingPattern === "day") {
		billingDaysSessions = calculatedPermittedDays;
	} else if (chargingPattern === "unit") {
		billingDaysSessions = calculatedPermittedDays / Number(base.permittedDays);
	} else if (chargingPattern === "session") {
		const res = await getBatchMember({
			enrollmentNo: base.enrollmentNo!,
			date: formatDate(endDate),
		});
		billingDaysSessions = Array.isArray(res) ? res.length : 0;
	}

	billingDaysSessions = Number(billingDaysSessions.toFixed(2));

	let selectedCourseRate: any = null;
	let patternDiscount = 1;
	let dnOrDiscount = 0;

	if (applyNewRates) {
		const res = await getCourseRates({ courseId: enrollmentData.courseId, limit: 10000 });
		const rates = Array.isArray(res?.data) ? res.data : [];

		const membershipPriority = [
			enrollmentData.membershipType,
			"Casual Member",
			"Walk in Customer",
		];

		let filteredRates: any[] = [];
		for (const type of membershipPriority) {
			filteredRates = rates.filter((r: any) => r.membershipType === type);
			if (filteredRates.length) break;
		}

		selectedCourseRate = filteredRates
			.filter((r: any) => Number(r.aboveUnits) <= calculatedPermittedDays)
			.sort((a: any, b: any) => Number(b.aboveUnits) - Number(a.aboveUnits))[0] || null;

		if (selectedCourseRate) {
			const P = base?.noOfDaysInWeek ?? 0;
			const Q = base?.attendingPatternDays ?? 0;
			const R = selectedCourseRate?.discountOnDayReduce ?? 1;
			const S = selectedCourseRate?.minDaysInEnr ?? 0;

			patternDiscount = (P - Q) <= S
				? 1 - ((P - Q) * (R / 100))
				: 1 - ((P - S) * (R / 100));

			const effectiveBillingAmount = patternDiscount * selectedCourseRate.unitRate * billingDaysSessions;
			const oldBillingAmount = (base?.billingRate ?? 0) * billingDaysSessions;
			dnOrDiscount = -(effectiveBillingAmount - oldBillingAmount);
		}
	}

	const newAmounts = getFinalAmounts(
		selectedCourseRate?.unitRate ?? (base?.billingRate ?? 0),
		patternDiscount,
		dnOrDiscount,
		billingDaysSessions,
		givenProcessingCharge,
		Number(base.sgstRate),
		Number(base.cgstRate),
		1,
		base.startTime ?? "",
		base.billingDaysSessions ?? 0,
		base.attendingStartDate
	);

	const newVersion: EnrollmentData = {
		...base,
		endDate: endDate.toISOString(),
		permittedDays: calculatedPermittedDays,
		rackPrice: selectedCourseRate?.unitRate ?? (base?.billingRate ?? 0),
		billingDaysSessions,
		billingAmount: newAmounts.billingAmount,
		roundedAmount: Number(newAmounts.roundedAmount.toFixed(2)),
		cgstAmount: Number(newAmounts.cgstAmount.toFixed(2)),
		sgstAmount: Number(newAmounts.sgstAmount.toFixed(2)),
		totalDebitAmount: Number(newAmounts.totalDebitAmount.toFixed(2)),
		status: "locked",
		printRemarks:
			(base.printRemarks || "") +
			(applyNewRates
				? "Rates changed due to change in units booked difference in the rates added to the Invoice in Rounded Section"
				: ""),
		officeRemarks: (base.officeRemarks || "") + " Auto Terminate Due to changes",
		createdAt: nowISO(),
		updatedAt: nowISO(),
	};

	const v1 = Number(base.totalDebitAmount);
	const v2 = Number(modifyAmounts.totalDebitAmount.toFixed(2));
	const v3 = Number(newAmounts.totalDebitAmount.toFixed(2));
	const v4 = v1 - v2 - v3;

	const values = {
		value1: v1,
		value2: v2,
		value3: v3,
		value4: v4,
		value5: billingDaysSessions,
		value6: addDays(new Date(newVersion.endDate!), 1),
	};

	return { modify, newVersion, values };
}