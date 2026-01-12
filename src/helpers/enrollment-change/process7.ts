import { toast } from "@/hooks/use-toast";
import type { EnrollmentData } from "@/types/enrollment";

export interface Process7Result {
	modify: EnrollmentData;
	newVersion: EnrollmentData;
	newEnrollment: any;
}

const nowISO = (): string => new Date().toISOString();

export async function process7(
	enrollmentData: EnrollmentData,
	givenStartDate: string,
	givenPrintRemarks?: string,
	givenWalkingName?: string,
	givenWalkingContact?: string,
	givenProcessingCharge?: number
): Promise<Process7Result> {

	function daysBetween(date1: string | Date, date2: string | Date): number {
		const d1 = date1 instanceof Date ? date1 : new Date(date1);
		const d2 = date2 instanceof Date ? date2 : new Date(date2);

		const diffMs = Math.abs(d2.getTime() - d1.getTime());
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

		return diffDays;
	}

	function addDays(startDate: string | Date, days: number): string {
		const d = startDate instanceof Date ? new Date(startDate) : new Date(startDate);

		d.setDate(d.getDate() + days);

		// Format back as dd/mm/yyyy
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0"); // JS months are zero-based
		const year = d.getFullYear();

		return `${day}/${month}/${year}`;
	}

	const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
	const calculatedCgstAmount = ((base?.processingCharge ?? 0) + (base?.roundedAmount ?? 0)) * ((base?.cgstRate ?? 0) / 100)
	const calculatedSgstAmount = ((base?.processingCharge ?? 0) + (base?.roundedAmount ?? 0)) * ((base?.sgstRate ?? 0) / 100)
	const modify: EnrollmentData = {
		...base,
		cgstAmount: calculatedCgstAmount,
		sgstAmount: calculatedSgstAmount,
		totalDebitAmount: (base?.processingCharge ?? 0) + calculatedCgstAmount + calculatedSgstAmount + (base?.processingCharge ?? 0),
		officeRemarks: base?.officeRemarks + " # Enrolment Cancelled Processing Charges Billed - Auto Terminated for Change Start Date",
		updatedAt: nowISO(),
		status: "history"
	};

	//calculation here
	let calculatedPermittedDays = 0;
	if (base?.chargingPattern.toLowerCase() == "day" || base?.chargingPattern.toLowerCase() == "session") {
		calculatedPermittedDays = (base?.permittedDays ?? 0);
	}
	else {
		if (base?.suspensionDate) {
			calculatedPermittedDays = daysBetween(givenStartDate, base?.suspensionDate);
		}
		else {
			toast({
				title: "Error",
				description: "Please put suspensionDate in Course Defination",
				variant: "destructive"
			});
		}
	}
	const calculatedEndDate = addDays(givenStartDate, calculatedPermittedDays);

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
		: (rackPrice * patternDiscount) - ((base?.dnOrDiscount ?? 0) / billingDaysSessions);


	const A = ((baseRateD * billingDaysSessions) + processingCharge);
	const B = 100 + sgstRate + cgstRate;
	const C = A * (B / 100);
	const X = Math.ceil(Number(C.toFixed(5)));
	const E = X - C;
	const roundedAmount = ((100 * E) / B);

	const billingAmount = baseRateD * billingDaysSessions * membersEnrolled;
	const cgstAmount = (billingAmount + (processingCharge * membersEnrolled) + roundedAmount) * (cgstRate / 100);
	const sgstAmount = (billingAmount + (processingCharge * membersEnrolled) + roundedAmount) * (sgstRate / 100);
	const calculatedCostToMember = ((rackPrice * patternDiscount) - ((base?.dnOrDiscount ?? 0)/ billingDaysSessions));
	const totalDebitAmount = (calculatedCostToMember * billingDaysSessions * membersEnrolled) + cgstAmount + sgstAmount + (processingCharge * membersEnrolled) + roundedAmount;

	const newVersion: EnrollmentData = {
		...base,
		attendingStartDate: givenStartDate,
		permittedDays: calculatedPermittedDays,
		endDate: calculatedEndDate,
		processingCharge: givenProcessingCharge,
		roundedAmount: roundedAmount,
		cgstAmount: cgstAmount,
		sgstAmount: sgstAmount,
		totalDebitAmount: totalDebitAmount,
		printRemarks: givenPrintRemarks,
		officeRemarks: "Start Date Change on "+nowISO(),
		walkingName: givenWalkingName,
		walkingContact: givenWalkingContact,
		finalTSLApproval:"required",
		status: "created"
	};

	return {
		modify,
		newVersion,
		newEnrollment: null
	};
}