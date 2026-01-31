import type { EnrollmentData } from "@/types/enrollment";

export interface Process2Result {
    newEnrollment: any;
}

const nowISO = (): string => new Date().toISOString();

export async function process2(
    enrollmentData: EnrollmentData,
    newVersion: Partial<EnrollmentData> | null,
    givenStartDate: string,
    givenPrintRemarks?: string,
    givenWalkingName?: string,
    givenWalkingContact?: string,
    givenProcessingCharge?: number
): Promise<Process2Result> {
    const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));

    console.log(enrollmentData);


    const newEnrollment = {
        ...base,
        firstEnrollmentId: newVersion.firstEnrollmentId,
        membershipMasterId: newVersion.membershipMasterId,
        membershipId: newVersion.membershipId,
        accountId: newVersion.accountId,
        memberId: newVersion.memberId,
        membersEnrolled: newVersion.membersEnrolled,
        openEnrollment: newVersion.openEnrollment,
        memberApprovalStatus: newVersion.memberApprovalStatus,
        academyApprovalStatus: newVersion.academyApprovalStatus,
    }
    return {
        newEnrollment
    };
}