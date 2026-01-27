import type { EnrollmentData } from "@/types/enrollment";

export interface Process2Result {
    newEnrollment: any;
}

// const nowISO = (): string => new Date().toISOString();

export async function process2(
    enrollmentData: EnrollmentData,
    givenStartDate: string,
    givenPrintRemarks?: string,
    givenWalkingName?: string,
    givenWalkingContact?: string,
    givenProcessingCharge?: number
): Promise<Process2Result> {
    console.log(givenStartDate,
givenPrintRemarks,
givenWalkingName,
givenWalkingContact,
givenProcessingCharge);
    const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
    const newEnrollment = {
        ...base,
    }
    return {
        newEnrollment
    };
}