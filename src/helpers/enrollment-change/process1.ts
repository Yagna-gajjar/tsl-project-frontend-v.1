import type { EnrollmentData } from "@/types/enrollment";
import { getBatchMember } from "@/api/batchMember.api";
import { getCourseRates } from "@/api/courseRate.api";
import { addDays } from "date-fns";

export interface Process1Result {
	modify: EnrollmentData;
	newVersion: EnrollmentData;
	values: any;
}

const nowISO = (): string => new Date().toISOString();

const formatDate = (d: Date): string =>
	d.toISOString().split("T")[0];

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

	const roundedAmount = Number(base.roundedAmount);
	const processingCharge = Number(base.processingCharge);

	const baseAmount = roundedAmount + processingCharge;

	const newCgst = baseAmount * (Number(base.cgstRate) / 100);
	const newSgst = baseAmount * (Number(base.sgstRate) / 100);

	const totalDebit = baseAmount + newCgst + newSgst;

	const modify: EnrollmentData = {
		...base,
		cgstAmount: Number(newCgst.toFixed(2)),
		sgstAmount: Number(newSgst.toFixed(2)),
		totalDebitAmount: Number(totalDebit.toFixed(2)),
		officeRemarks: base.officeRemarks
			? `${base.officeRemarks} | Enrolment Canceled Processing Charges Billed - Auto Terminated`
			: "Enrolment Canceled Processing Charges Billed - Auto Terminated",
		updatedAt: nowISO(),
		status: "history",
	};

	if (!base.attendingStartDate) {
		throw new Error("attendingStartDate is required");
	}

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

	const newBillingAmount = billingDaysSessions * (base?.billingRate ?? 0);

	let selectedCourseRate: any = null;
	let newVersion: any = {};
	let newRoundedAmount;
	if (applyNewRates) {

		const res = await getCourseRates({
			courseId: enrollmentData.courseId,
			limit: 10000,
		});

		const rates = Array.isArray(res?.data) ? res.data : [];

		const membershipPriority = [
			enrollmentData.membershipType,
			"Casual Member",
			"Walk in Customer",
		];

		let filteredRates: any[] = [];

		for (const type of membershipPriority) {
			filteredRates = rates.filter(r => r.membershipType === type);
			if (filteredRates.length) break;
		}

		selectedCourseRate = filteredRates
			.filter(r => Number(r.aboveUnits) <= calculatedPermittedDays)
			.sort((a, b) => Number(b.aboveUnits) - Number(a.aboveUnits))[0] || null;

		const P = base?.noOfDaysInWeek ?? 0;
		const Q = base?.attendingPatternDays ?? 0;
		const R = selectedCourseRate?.discountOnDayReduce ?? 1;
		const S = selectedCourseRate?.minDaysInEnr ?? 0;
		let A;
		if (P - Q <= S) {
			A = (1 - ((P - Q) * (R / 100)));
		}
		else {
			A = (1 - ((P - S) * (R / 100)));
		}

		const B = selectedCourseRate?.unitRate;
		const C = A * B;
		const D = C * billingDaysSessions;
		const E = D - newBillingAmount;

		const tax = ((Number(base?.cgstRate) + Number(base?.sgstRate) + 100) / 100);
		const X = (Number(newBillingAmount) + Number(givenProcessingCharge) + Number(E)) * tax;

		const Y = Math.ceil(X);

		newRoundedAmount = (((Y - X) * 100) / ((Number(base?.cgstRate) + Number(base?.sgstRate) + 100))) + E;
	}
	else {
		const tax = ((Number(base?.cgstRate) + Number(base?.sgstRate) + 100) / 100);
		const X = (Number(newBillingAmount) + Number(givenProcessingCharge)) * tax;

		const Y = Math.ceil(X);

		newRoundedAmount = (((Y - X) * 100) / ((Number(base?.cgstRate) + Number(base?.sgstRate) + 100)));
	}

	const newCgstAmount = (Number(newBillingAmount) + Number(givenProcessingCharge) + newRoundedAmount) * ((Number(base?.cgstRate)) / 100);

	const newSgstAmount = (Number(newBillingAmount) + Number(givenProcessingCharge) + newRoundedAmount) * ((Number(base?.sgstRate)) / 100);

	const newTotalDebitAmount = Number(newBillingAmount) + Number(newCgstAmount) + Number(newSgstAmount) + Number(givenProcessingCharge) + Number(newRoundedAmount);

	newVersion = {
		...base,
		endDate: endDate.toISOString(),
		permittedDays: calculatedPermittedDays,
		rackPrice: selectedCourseRate?.unitRate,
		billingDaysSessions,
		billingAmount: newBillingAmount,
		roundedAmount: Number(newRoundedAmount),
		cgstAmount: Number(newCgstAmount).toFixed(2),
		sgstAmount: Number(newSgstAmount).toFixed(2),
		totalDebitAmount: Number(newTotalDebitAmount).toFixed(2),
		status: "locked",
		printRemarks:
			(base.printRemarks || "") +
			(applyNewRates
				? "Rates changed due to change in units booked difference in the rates added to the Invoice in Rounded Section"
				: ""),
		officeRemarks:
			(base.officeRemarks || "") + " Auto Terminate Due to changes",
		createdAt: nowISO(),
		updatedAt: nowISO(),
	};

	const v1 = Number(base.totalDebitAmount)
	const v2 = totalDebit;
	const v3 = newTotalDebitAmount;
	const v4 = v1 - v2 - v3;


	const values = {
		value1: v1,
		value2: v2,
		value3: v3,
		value4: v4,
		value5: billingDaysSessions,
		value6: addDays(newVersion.endDate, 1)
	}
	return {
		modify,
		newVersion,
		values
	};
}