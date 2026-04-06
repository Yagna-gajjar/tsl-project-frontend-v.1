import type { Course } from "@/types/course";
import type { EnrollmentData } from "@/types/enrollment";

export interface Process4Result {
	newEnrollment: any;
}
export async function process4(
	enrollmentData: EnrollmentData,
	passedNewEnrollment: EnrollmentData,
	newVersion: Partial<EnrollmentData> | null,
	values: any,
	course: Partial<Course>,
	applyNewRates: boolean,
	givenStartDate: string,
	givenPrintRemarks?: string,
	givenWalkingName?: string,
	givenWalkingContact?: string,
	givenProcessingCharge?: number,
): Promise<Process4Result> {
	
	const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
	const newEnrollmentBase: EnrollmentData = JSON.parse(JSON.stringify(passedNewEnrollment));
	const billingAmount = values.value4 / (1 + ((Number(course?.cgstRate) + Number(course?.sgstRate)) / 100))
	const cgstAmount = billingAmount * (Number(course?.cgstRate) / 100)
	const sgstAmount = billingAmount * (Number(course?.sgstRate) / 100)
	const roundedAmount = billingAmount - (Number(passedNewEnrollment.billingDaysSessions) * Number(passedNewEnrollment.billingRate));
	const totalDebitAmount = values.value4;

	const newEnrollment = {
		...newEnrollmentBase,
		firstEnrollmentId: base.enrollmentId,
		memberId: base.memberId,
		enrollmentDate: new Date().toISOString(),
		batch: passedNewEnrollment.batchId,
		permittedDays: passedNewEnrollment.billingDaysSessions,
		billingAmount: billingAmount,
		roundedAmount: roundedAmount,
		totalDebitAmount: totalDebitAmount,
		cgstAmount: cgstAmount,
		sgstAmount: sgstAmount,
	}

	return {
		newEnrollment
	};
}