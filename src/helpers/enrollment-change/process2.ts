import type { Course } from "@/types/course";
import type { CourseRate } from "@/types/courseRate";
import type { EnrollmentData } from "@/types/enrollment";

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
givenProcessingCharge);
    const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
    function addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + Number(days));
        return result;
    }

    const pc = 100

    const oldBillingAmount = values.value4
    const oldBillingAmountAfGst = (((oldBillingAmount * 100) / (Number(course?.cgstRate) + Number(course?.sgstRate) + 100)) - pc)

    const unitRate = courseRateData?.unitRate;
    const permittedDays = Math.floor(oldBillingAmountAfGst / Number(courseRateData?.unitRate))

    const billable = (permittedDays * Number(unitRate) + pc);

    const billWithGst = ((billable * (Number(course?.cgstRate) + Number(course?.sgstRate) + 100)) / 100)

    const diff = oldBillingAmount - billWithGst

    const roundedAmount = ((diff * 100) / (Number(course?.cgstRate) + Number(course?.sgstRate) + 100))

    const finalBillingAmount = ((Number(courseRateData?.unitRate) * permittedDays) + pc)

    const newTotalDebitAmount = values.value4;
    const attendingStartDate = new Date(values.value6)
    const endDate = addDays(new Date(givenStartDate), (permittedDays - 1))

    if (!base.attendingStartDate) {
        throw new Error("attendingStartDate is required");
    }

    const newEnrollment = {
        ...base,
        activityId: course.activityId,
        courseId: course.courseId,
        permittedDays: permittedDays,
        attendingStartDate: attendingStartDate.toISOString(),
        endDate: endDate.toISOString(),
        attendingPattern: 0,
        roundedAmount: roundedAmount,
        attendingPatternDays: 0,
        billingDaysSessions: permittedDays,
        courseRateId: courseRateData?.courseRateId,
        totalDebitAmount: newTotalDebitAmount,
        patternDiscount: 1,
        costToMember: courseRateData?.unitRate,
        rackPrice: courseRateData?.unitRate,
        billingRate: courseRateData?.unitRate,
        billingAmount: finalBillingAmount,
        cgstAmount: finalBillingAmount * (Number(course.cgstRate) / 100),
        sgstAmount: finalBillingAmount * (Number(course.sgstRate) / 100),
        finalTSLApproval: "required",
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