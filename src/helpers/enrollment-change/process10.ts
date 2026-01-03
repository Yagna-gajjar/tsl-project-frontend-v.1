import type { BatchMember } from "@/types/batchMember";
import type { EnrollmentData } from "@/types/enrollment";

export interface Process1Result {
	modify: EnrollmentData;
	newVersion: EnrollmentData;
	newEnrollment: any;
	batchmember: BatchMember
}

const nowISO = (): string => new Date().toISOString();

export async function process10(
	enrollmentData: EnrollmentData,
	batchData: BatchMember,
	givenattendingPattern: any,
	givenattendingPatternDays: number,
	givenProcessingCharge: number,
	startDate: Date
): Promise<Process1Result> {

	const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
	const batchmember: BatchMember = { ...batchData, startDate: startDate };
	const modify: EnrollmentData = {
		...base,
		cgstAmount: ((base?.processingCharge ?? 0) + (base?.roundedAmount ?? 0)) * ((base?.cgstRate!) / 100),
		sgstAmount: ((base?.processingCharge ?? 0) + (base?.roundedAmount ?? 0)) * ((base?.sgstRate!) / 100),
		totalDebitAmount: ((base?.roundedAmount ?? 0) + (base?.processingCharge ?? 0) + (base?.cgstAmount ?? 0) + (base?.sgstAmount ?? 0)),
		officeRemarks: base?.officeRemarks + "Attending Pattern Changed Processing Charges Billed - Auto Terminated",
		updatedAt: nowISO(),
		status: "history"
	};
	const newVersion: EnrollmentData = {
		...base,
		status: "created",
		processingCharge: givenProcessingCharge,
		updatedAt: nowISO(),
	};

	return {
		modify,
		newVersion,
		newEnrollment: null,
		batchmember
	};
}