//input dnOrDiscount and Processing Charges

import type { EnrollmentData } from "@/types/enrollment";
import { format } from "date-fns";

export interface Process9Result {
	modify: EnrollmentData;
	newVersion: EnrollmentData;
	newEnrollment: any;
}

const nowISO = (): string => new Date().toISOString();

const findNewPatternDiscount = async () => {
	//how to find pattern discount? do we need to find new pattern discount?
	return 1;
}

export async function process9(
	enrollmentData: EnrollmentData,
	givenDNOrDiscount: number,
	givenProcessingCharge: number,
	changeType: string,
	givenPrintRemarks: string,
	givenWalkingName: string,
	givenWalkingContact: string
): Promise<Process9Result> {

	const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
	const modify: EnrollmentData = {
		...base,
		officeRemarks: base?.officeRemarks + `#Enrolment Modified Debit Note Account or Amount Changed- Auto Canceled for ${changeType}`,
		updatedAt: nowISO(),
		status: "cancelled"
	};

	//calculations for new version
	const hasDnAccount = !!base?.dnAccountId && base?.dnAccountId !== 0;
	const sgstRate = Number(parseFloat(String(base?.sgstRate)).toFixed(5));
	const cgstRate = Number(parseFloat(String(base?.cgstRate)).toFixed(5));
	const rackPrice = Number(parseFloat(String(base?.rackPrice)).toFixed(5));
	const patternDiscount = await findNewPatternDiscount();
	const membersEnrolled = Number(base?.membersEnrolled) || 1;
	const billingDaysSessions = Number(base?.billingDaysSessions) || 1;
	let baseRateD = hasDnAccount
		? (rackPrice * patternDiscount)
		: (rackPrice * patternDiscount) - (givenDNOrDiscount / billingDaysSessions);


	const A = ((baseRateD * billingDaysSessions) + givenProcessingCharge);
	const B = 100 + sgstRate + cgstRate;
	const C = A * (B / 100);
	const X = Math.ceil(Number(C.toFixed(5)));
	const E = X - C;
	const roundedAmount = ((100 * E) / B);

	const billingAmount = baseRateD * billingDaysSessions * membersEnrolled;
	const cgstAmount = (billingAmount + (givenProcessingCharge * membersEnrolled) + roundedAmount) * (cgstRate / 100);
	const sgstAmount = (billingAmount + (givenProcessingCharge * membersEnrolled) + roundedAmount) * (sgstRate / 100);
	const costToMember = ((rackPrice * patternDiscount) - (givenDNOrDiscount / billingDaysSessions));
	const totalDebitAmount = (costToMember * billingDaysSessions * membersEnrolled) + cgstAmount + sgstAmount + (givenProcessingCharge * membersEnrolled) + roundedAmount;

	const newVersion: EnrollmentData = {
		...base,
		dnOrDiscount: givenDNOrDiscount,
		processingCharge: givenProcessingCharge,
		roundedAmount: roundedAmount,
		billingAmount: billingAmount,
		cgstAmount: cgstAmount,
		sgstAmount: sgstAmount,
		costToMember: costToMember,
		totalDebitAmount: totalDebitAmount,
		printRemarks: givenPrintRemarks,
		officeRemarks: `Add to Remarks "Discount Amount Changed" on ${format(Date.now(), "dd-MMM-yyyy")}`,
		walkingContact: givenWalkingContact,
		walkingName: givenWalkingName,
		finalTSLApproval: "required",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	return {
		modify,
		newVersion,
		newEnrollment: null
	};
}