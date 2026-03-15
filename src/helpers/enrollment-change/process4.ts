import type { Course } from "@/types/course";
import type { CourseRate } from "@/types/courseRate";
import type { EnrollmentData } from "@/types/enrollment";

export interface Process2Result {
	newEnrollment: any;
}

// const diffDaysInclusive = (start: Date, end: Date): number => {
// 	const msPerDay = 24 * 60 * 60 * 1000;
// 	return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
// };


export async function process4(
	enrollmentData: EnrollmentData,
	newVersion: Partial<EnrollmentData> | null,
	values: any,
	course: Partial<Course>,
	courseRateData: Partial<CourseRate> | null,
	applyNewRates: boolean,
	givenStartDate: string,
	givenPrintRemarks?: string,
	givenWalkingName?: string,
	givenWalkingContact?: string,
	givenProcessingCharge?: number,
): Promise<Process4Result> {
	console.log(givenPrintRemarks,
		givenWalkingName,
		givenWalkingContact);
	const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
	function addDays(date: Date, days: number): Date {
		const result = new Date(date);
		result.setDate(result.getDate() + Number(days));
		return result;
	}

	const oldBillingAmount = values.value4
	const oldBillingAmountAfGst = (((oldBillingAmount * 100) / (Number(course?.cgstRate) + Number(course?.sgstRate) + 100)) - Number(givenProcessingCharge ? givenProcessingCharge : 0))

	const unitRate = courseRateData?.unitRate;
	const permittedDays = Math.floor(oldBillingAmountAfGst / Number(courseRateData?.unitRate))

	const billable = (permittedDays * Number(unitRate) + Number(givenProcessingCharge ? givenProcessingCharge : 0));

	const billWithGst = ((billable * (Number(course?.cgstRate) + Number(course?.sgstRate) + 100)) / 100)

	const diff = oldBillingAmount - billWithGst

	const roundedAmount = ((diff * 100) / (Number(course?.cgstRate) + Number(course?.sgstRate) + 100))

	const finalBillingAmount = ((Number(courseRateData?.unitRate) * permittedDays) + Number(givenProcessingCharge ? givenProcessingCharge : 0))

	const newTotalDebitAmount = values.value4;
	const attendingStartDate = new Date(values.value6)
	const endDate = addDays(new Date(givenStartDate), (permittedDays - 1))

	if (!base.attendingStartDate) {
		throw new Error("attendingStartDate is required");
	}

	// const startDate = new Date(base.attendingStartDate);
	// const calculatedPermittedDays = diffDaysInclusive(startDate, endDate);

	let billingDaysSessions = 0;

	billingDaysSessions = permittedDays;

	let newBillingAmount = billingDaysSessions * (base?.billingRate ?? 0);

	// let selectedCourseRate: any = null;
	let newRoundedAmount;
	if (applyNewRates) {

		// const res = await getCourseRates({
		//     courseId: enrollmentData.courseId,
		//     limit: 10000,
		// });

		// const rates = Array.isArray(res?.data) ? res.data : [];

		// const membershipPriority = [
		//     enrollmentData.membershipType,
		//     "Casual Member",
		//     "Walk in Customer",
		// ];

		// let filteredRates: any[] = [];

		// for (const type of membershipPriority) {
		//     filteredRates = rates.filter(r => r.membershipType === type);
		//     if (filteredRates.length) break;
		// }

		// selectedCourseRate = filteredRates
		//     .filter(r => toNumber(r.aboveUnits) <= calculatedPermittedDays)
		//     .sort((a, b) => toNumber(b.aboveUnits) - toNumber(a.aboveUnits))[0] || null;

		let P = base?.noOfDaysInWeek ?? 0;//5
		let Q = base?.attendingPatternDays ?? 0;//5
		let R = courseRateData?.discountOnDayReduce ?? 1;//10
		let S = courseRateData?.minDaysInEnr ?? 0;//1

		let A;
		if (P - Q <= S) {
			A = (1 - ((P - Q) * (R / 100)));
		}
		else {
			// 1 - ((4)*0.1) //mistake here
			A = (1 - ((P - S) * (R / 100)));
		}

		let B = Number(courseRateData?.unitRate);
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

	const newEnrollment = {
		...base,
		activityId: course.activityId,
		courseId: course.courseId,
		permittedDays: permittedDays,
		attendingStartDate: attendingStartDate.toISOString(),
		endDate: endDate.toISOString(),
		attendingPattern: 0,
		roundedAmount: roundedAmount.toFixed(2),
		attendingPatternDays: 0,
		billingDaysSessions: permittedDays,
		courseRateId: courseRateData?.courseRateId,
		totalDebitAmount: newTotalDebitAmount.toFixed(2),
		patternDiscount: 1,
		costToMember: courseRateData?.unitRate,
		rackPrice: courseRateData?.unitRate,
		billingRate: courseRateData?.unitRate,
		billingAmount: finalBillingAmount.toFixed(2),
		cgstAmount: (finalBillingAmount * (Number(course.cgstRate) / 100)).toFixed(2),
		sgstAmount: (finalBillingAmount * (Number(course.sgstRate) / 100)).toFixed(2),
		finalTSLApproval: 1,
		firstEnrollmentId: newVersion?.firstEnrollmentId,
		membershipMasterId: newVersion?.membershipMasterId,
		membershipId: newVersion?.membershipId,
		accountId: newVersion?.accountId,
		memberId: newVersion?.memberId,
		membersEnrolled: newVersion?.membersEnrolled,
		openEnrollment: newVersion?.openEnrollment,
		memberApprovalStatus: newVersion?.memberApprovalStatus,
		academyApprovalStatus: newVersion?.academyApprovalStatus,
	}
	return {
		newEnrollment
	};
}