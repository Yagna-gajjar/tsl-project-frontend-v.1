import type { Course } from "@/types/course";
import type { CourseRate } from "@/types/courseRate";
import type { EnrollmentData } from "@/types/enrollment";
import { calsPermittedDays } from "../enrollment";

export interface Process2Result {
    newEnrollment: any;
}

export async function process2(
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
): Promise<Process2Result> {
    console.log(givenStartDate,
        givenPrintRemarks,
        givenWalkingName,
        givenWalkingContact,
        givenProcessingCharge,
        applyNewRates);
    const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));

    const result = await calsPermittedDays({ oldBillingAmount: values.value4, pc: Number(givenProcessingCharge), cgst: Number(course.cgstRate), sgst: Number(course.cgstRate), unitRate: Number(courseRateData?.unitRate), startDays: givenStartDate })
    const attendingStartDate = new Date(values.value6)

    if (!base.attendingStartDate) {
        throw new Error("attendingStartDate is required");
    }

    const newEnrollment = {
        ...base,
        activityId: course.activityId,
        courseId: course.courseId,
        permittedDays: result.permittedDays,
        attendingStartDate: attendingStartDate.toISOString(),
        endDate: result.endDate.toISOString(),
        attendingPattern: 0,
        roundedAmount: result.roundedAmount.toFixed(2),
        attendingPatternDays: 0,
        billingDaysSessions: result.permittedDays,
        courseRateId: courseRateData?.courseRateId,
        totalDebitAmount: result.totalDebitedAmmount.toFixed(2),
        patternDiscount: 1,
        costToMember: courseRateData?.unitRate,
        rackPrice: courseRateData?.unitRate,
        billingRate: courseRateData?.unitRate,
        billingAmount: result.finalBillingAmount.toFixed(2),
        cgstAmount: (result.finalBillingAmount * (Number(course.cgstRate) / 100)).toFixed(2),
        sgstAmount: (result.finalBillingAmount * (Number(course.sgstRate) / 100)).toFixed(2),
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