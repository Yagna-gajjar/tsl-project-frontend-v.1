import type { EnrollmentData } from "@/types/enrollment";

export interface Process6Result {
	newEnrollment: any;
}

const nowISO = (): string => new Date().toISOString();

export async function process6(
	enrollmentData: EnrollmentData,
	givenStartDate: string,
	givenPrintRemarks?: string,
	givenWalkingName?: string,
	givenWalkingContact?: string,
	givenProcessingCharge?: number
): Promise<Process6Result> {
	const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
	const newEnrollment = {
		...base,
	}
	return {
		newEnrollment
	};
}