import { getBatchMember } from "@/api/batchMember.api";
import type { Course } from "@/types/course";
import type { CourseRate } from "@/types/courseRate";
import type { EnrollmentData } from "@/types/enrollment";

export interface Process2Result {
    newEnrollment: any;
}

const nowISO = (): string => new Date().toISOString();


const toNumber = (v: string | number | null | undefined): number =>
    Number(v ?? 0);

const toFixed2 = (v: number): number =>
    Number(Number(v).toFixed(2));

const formatDate = (d: Date): string =>
    d.toISOString().split("T")[0];

const diffDaysInclusive = (start: Date, end: Date): number => {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
};


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
    const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
    function addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + Number(days));
        return result;
    }
    console.log(values.value4, " = values4");
    
    const permittedDays = Math.floor(((values.value4 * 100) / (100 + Number(course.sgstRate) + Number(course.cgstRate))) / Number(newVersion?.billingRate))
    const attendingStartDate = new Date(values.value6)
    const endDate = addDays(new Date(givenStartDate), (permittedDays - 1))
    console.log(givenStartDate, "given start date");

    if (!base.attendingStartDate) {
        throw new Error("attendingStartDate is required");
    }

    const startDate = new Date(base.attendingStartDate);
    const calculatedPermittedDays = diffDaysInclusive(startDate, endDate);
    console.log(calculatedPermittedDays);

    let billingDaysSessions = 0;
    const chargingPattern = (base.chargingPattern || "").toLowerCase();

    if (chargingPattern === "day") {
        billingDaysSessions = calculatedPermittedDays;
    } else if (chargingPattern === "unit") {
        billingDaysSessions = calculatedPermittedDays / toNumber(base.permittedDays);
    } else if (chargingPattern === "session") {
        const res = await getBatchMember({
            enrollmentNo: base.enrollmentNo!,
            date: formatDate(endDate),
        });
        billingDaysSessions = Array.isArray(res) ? res.length : 0;
    }

    billingDaysSessions = toFixed2(billingDaysSessions);

    let newBillingAmount = billingDaysSessions * (newVersion?.billingRate ?? 0);

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

        let P = base?.noOfDaysInWeek ?? 0;
        let Q = base?.attendingPatternDays ?? 0;
        let R = courseRateData?.discountOnDayReduce ?? 1;
        let S = courseRateData?.minDaysInEnr ?? 0;

        let A;
        if (P - Q <= S) {
            A = (1 - ((P - Q) * (R / 100)));
        }
        else {
            A = (1 - ((P - S) * (R / 100)));
        }

        let B = Number(courseRateData?.unitRate);
        let C = A * B;
        let D = C * billingDaysSessions;
        console.log(billingDaysSessions, "new billingAmount");

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

    console.log(newBillingAmount);
    console.log(Number(newCgstAmount));
    console.log(Number(newSgstAmount));
    console.log(Number(givenProcessingCharge));
    console.log(Number(newRoundedAmount));

    const newTotalDebitAmount = Number(newBillingAmount) + Number(newCgstAmount) + Number(newSgstAmount) + Number(givenProcessingCharge) + Number(newRoundedAmount);

    const newEnrollment = {
        ...base,
        activityId: course.activityId,
        courseId: course.courseId,
        permittedDays: permittedDays,
        attendingStartDate: attendingStartDate.toISOString(),
        endDate: endDate.toISOString(),
        attendingPattern: 0,
        attendingPatternDays: 0,
        billingDaysSessions: permittedDays,
        courseRateId: courseRateData?.courseRateId,
        cgstAmount: Number(newCgstAmount),
        sgstAmount: Number(newSgstAmount),
        totalDebitAmount: newTotalDebitAmount,
        patternDiscount: 1,
        rackPrice: courseRateData?.unitRate,
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

    console.log(newEnrollment);


    return {
        newEnrollment
    };
}