import type { Course } from "@/types/course";
import type { CourseRate } from "@/types/courseRate";
import type { EnrollmentData } from "@/types/enrollment";
import { setDate } from "date-fns";
import { useState } from "react";

export interface Process2Result {
    newEnrollment: any;
}

const nowISO = (): string => new Date().toISOString();

export async function process2(
    enrollmentData: EnrollmentData,
    newVersion: Partial<EnrollmentData> | null,
    values: any,
    course: Partial<Course>,
    courseRateData: Partial<CourseRate> | null,
    givenStartDate: string,
    givenPrintRemarks?: string,
    givenWalkingName?: string,
    givenWalkingContact?: string,
    givenProcessingCharge?: number
): Promise<Process2Result> {
    const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
    const activityIs = course.accountId


    function addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + Number(days));
        return result;
    }

    const permittedDays = Math.floor(((values.value4 * 100) / (100 + Number(course.sgstRate) + Number(course.cgstRate))) / Number(newVersion?.billingRate))
    const attendingStartDate = new Date(values.vlaue6)
    const endDate = addDays(new Date(givenStartDate), (permittedDays - 1))

    const newEnrollment = {
        ...base,
        permittedDays: permittedDays,
        attendingStartDate: attendingStartDate.toISOString(),
        endDate: endDate.toISOString(),
        attendingPattern: 0,
        attendingPatternDays: 0,
        billingDaysSessions: permittedDays,
        // courseRateId: ,
        patternDiscount: 1,
        // rackPrice: courseRa,
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