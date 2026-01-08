import type { EnrollmentData } from "@/types/enrollment";

export interface Process8Result {
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
): Promise<Process8Result> {

	const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
	const modify: EnrollmentData = {
		...base,
		officeRemarks: base?.officeRemarks + "Enrolment Modified Debit Note Account or Amount Changed- Auto Canceled",
		updatedAt: nowISO(),
		status: "cancelled"
	};

	//calculation here
	const hasDnAccount = !!base?.dnAccountId && base?.dnAccountId !== 0;
	const sgstRate = Number(parseFloat(String(base?.sgstRate)).toFixed(5));
	const cgstRate = Number(parseFloat(String(base?.cgstRate)).toFixed(5));
	const rackPrice = Number(parseFloat(String(base?.rackPrice)).toFixed(5));
	const patternDiscount = Number(parseInt(String(base?.patternDiscount) ?? 1))
	const membersEnrolled = Number(base?.membersEnrolled) || 1;
	const billingDaysSessions = Number(base?.billingDaysSessions) || 1;
	const processingCharge = Number(base?.processingCharge);
	let baseRateD = hasDnAccount
		? (rackPrice * patternDiscount)
		: (rackPrice * patternDiscount) - (givenDNOrDiscount / billingDaysSessions);


	const A = ((baseRateD * billingDaysSessions) + processingCharge);
	const B = 100 + sgstRate + cgstRate;
	const C = A * (B / 100);
	const X = Math.ceil(Number(C.toFixed(5)));
	const E = X - C;
	const roundedAmount = ((100 * E) / B);

	const billingAmount = baseRateD * billingDaysSessions * membersEnrolled;
	const cgstAmount = (billingAmount + (processingCharge * membersEnrolled) + roundedAmount) * (cgstRate / 100);
	const sgstAmount = (billingAmount + (processingCharge * membersEnrolled) + roundedAmount) * (sgstRate / 100);
	const calculatedCostToMember = ((rackPrice * patternDiscount) - (givenDNOrDiscount / billingDaysSessions));
	const totalDebitAmount = (calculatedCostToMember * billingDaysSessions * membersEnrolled) + cgstAmount + sgstAmount + (processingCharge * membersEnrolled) + roundedAmount;

	const newVersion: EnrollmentData = {
		...base,
		dnAccountId: givenDNAccountId,
		dnOrDiscount: givenDNOrDiscount,
		costToMember: calculatedCostToMember,
		totalDebitAmount: totalDebitAmount,
		printRemarks: givenPrintRemarks,
		officeRemarks: base?.officeRemarks + " Debit Account and Amount Changed on " + nowISO(),
		walkingName: givenWalkingName,
		walkingContact: givenWalkingContact,
		academyApprovalStatus: "required",
		finalTSLApproval: "required",
		status: "created"
	};

	return {
		modify,
		newVersion,
		newEnrollment: null
	};
}