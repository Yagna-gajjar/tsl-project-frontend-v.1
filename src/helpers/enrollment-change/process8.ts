import type { EnrollmentData } from "@/types/enrollment";

export interface Process1Result {
	modify: EnrollmentData;
	newVersion: EnrollmentData;
	newEnrollment: any;
}

const nowISO = (): string => new Date().toISOString();

export async function process8(
	enrollmentData: EnrollmentData,
	givenDNAccountId: number,
	givenDNOrDiscount: number,
	givenPrintRemarks: string,
	givenWalkingName: string,
	givenWalkingContact: string
): Promise<Process1Result> {

	const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
	const modify: EnrollmentData = {
		...base,
		officeRemarks: base?.officeRemarks + "Enrolment Modified Debit Note Account or Amount Changed- Auto Canceled",
		updatedAt: nowISO(),
		status: "cancelled"
	};
	let calculatedCostToMember = 0;
	// calculatedCostToMember = ((base?.rackPrice ?? 0) * (base?.patternDiscount ?? 1)) - (dnOrDiscount / billingDaysSessions)
	let calculatedTotalDebitedAmount = 0;
	const newVersion: EnrollmentData = {
		...base,
		dnAccountId: givenDNAccountId,
		dnOrDiscount: givenDNOrDiscount,
		costToMember: calculatedCostToMember,
		totalDebitAmount: calculatedTotalDebitedAmount,
		printRemarks: givenPrintRemarks,
		officeRemarks: base?.officeRemarks + " Debit Account and Amount Changed on " + nowISO(),
		walkingName: givenWalkingName,
		walkingContact: givenWalkingContact,
		academyApprovalStatus: "required",
		finalTSLApproval: "required",
		status: "created",
	};

	return {
		modify,
		newVersion,
		newEnrollment: null
	};
}