import type { EnrollmentData } from "@/types/enrollment";
import { getBatchMember } from "@/api/batchMember.api";
import { getCourseRates } from "@/api/courseRate.api";

export interface Process1Result {
	modify: EnrollmentData;
	newVersion: EnrollmentData;
	values: any;
}

const toNumber = (v: string | number | null | undefined): number =>
	Number(v ?? 0);

const toFixed2 = (v: number): number =>
	Number(Number(v).toFixed(2));

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

	const roundedAmount = toNumber(base.roundedAmount);
	const processingCharge = toNumber(base.processingCharge);

	const baseAmount = roundedAmount + processingCharge;

	const newCgst = baseAmount * (toNumber(base.cgstRate) / 100);
	const newSgst = baseAmount * (toNumber(base.sgstRate) / 100);

	const totalDebit = baseAmount + newCgst + newSgst;

	const modify: EnrollmentData = {
		...base,
		cgstAmount: toFixed2(newCgst),
		sgstAmount: toFixed2(newSgst),
		totalDebitAmount: toFixed2(totalDebit),
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
	const calculatedPermittedDays = diffDaysInclusive(startDate, endDate); // 20

	let billingDaysSessions = 0;
	const chargingPattern = (base.chargingPattern || "").toLowerCase();

	if (chargingPattern === "day") {
		billingDaysSessions = calculatedPermittedDays;
	} else if (chargingPattern === "unit") {
		billingDaysSessions = calculatedPermittedDays / toNumber(base.permittedDays);
	} else if (chargingPattern === "session") {
		const res = await getBatchMember({
			enrollmentNo: base.enrollmentNo!,
			date: formatDate(endDate),
		});
		billingDaysSessions = Array.isArray(res) ? res.length : 0;
	}

	billingDaysSessions = toFixed2(billingDaysSessions);

	let newBillingAmount = billingDaysSessions * (base?.billingRate ?? 0);

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
			.filter(r => toNumber(r.aboveUnits) <= calculatedPermittedDays)
			.sort((a, b) => toNumber(b.aboveUnits) - toNumber(a.aboveUnits))[0] || null;

		let P = base?.noOfDaysInWeek ?? 0;//5
		let Q = base?.attendingPatternDays ?? 0;//5
		let R = selectedCourseRate?.discountOnDayReduce ?? 1;//10
		let S = selectedCourseRate?.minDaysInEnr ?? 0;//1
		let A;
		if (P - Q <= S) {
			A = (1 - ((P - Q) * (R / 100)));
		}
		else {
			// 1 - ((4)*0.1) //mistake here
			A = (1 - ((P - S) * (R / 100)));
		}

		let B = selectedCourseRate?.unitRate;
		let C = A * B;
		let D = C * billingDaysSessions;
		let E = D - newBillingAmount;

		let tax = (((Number(base?.cgstRate) ?? 0) + (Number(base?.sgstRate) ?? 0) + 100) / 100);
		let X = (Number(newBillingAmount) + Number(givenProcessingCharge) + Number(E)) * tax;

		let Y = Math.ceil(X);

		newRoundedAmount = (((Y - X) * 100) / (((Number(base?.cgstRate) ?? 0) + (Number(base?.sgstRate) ?? 0) + 100))) + E;
	}
	else {
		let tax = (((Number(base?.cgstRate) ?? 0) + (Number(base?.sgstRate) ?? 0) + 100) / 100);
		let X = (Number(newBillingAmount) + Number(givenProcessingCharge)) * tax;

		let Y = Math.ceil(X);

		newRoundedAmount = (((Y - X) * 100) / (((Number(base?.cgstRate) ?? 0) + (Number(base?.sgstRate) ?? 0) + 100)));
	}

	const newCgstAmount = (Number(newBillingAmount) + Number(givenProcessingCharge) + newRoundedAmount) * (((Number(base?.cgstRate) ?? 0)) / 100);

	const newSgstAmount = (Number(newBillingAmount) + Number(givenProcessingCharge) + newRoundedAmount) * (((Number(base?.sgstRate) ?? 0)) / 100);

	const newTotalDebitAmount = Number(newBillingAmount) + Number(newCgstAmount) + Number(newSgstAmount) + Number(givenProcessingCharge) + Number(newRoundedAmount);

	newVersion = {
		...base,
		endDate: endDate.toISOString(),
		permittedDays: calculatedPermittedDays,
		rackPrice: selectedCourseRate?.unitRate,
		billingDaysSessions,
		billingAmount: newBillingAmount,
		roundedAmount: Number(newRoundedAmount),
		cgstAmount: Number(newCgstAmount),
		sgstAmount: Number(newSgstAmount),
		totalDebitAmount: newTotalDebitAmount,
		status: "locked",
		printRemarks:
			(base.printRemarks || "") +
			(applyNewRates
				? " Rates changed due to change in units booked difference in the rates added to the Invoice in Rounded Section"
				: ""),
		officeRemarks:
			(base.officeRemarks || "") + " Auto Terminate Due to changes",
		createdAt: nowISO(),
		updatedAt: nowISO(),
	};

	let v1 = (Number(base.billingAmount) + Number(base.billingAmount) + processingCharge) * (1 + ((Number(base?.cgstRate) + Number(base?.sgstRate)) / 100));
	let v2 = totalDebit;
	let v3 = newTotalDebitAmount;
	let v4 = v1 - v2 - v3;
	function addDays(date: Date, days: number): Date {
		const result = new Date(date);
		result.setDate(result.getDate() + days);
		return result;
	}

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