import type { EnrollmentData } from "@/types/enrollment";

export interface Process2Result {
    newEnrollment: any;
}

const nowISO = (): string => new Date().toISOString();

export async function process2(
    enrollmentData: EnrollmentData,
    givenStartDate: string,
    givenPrintRemarks?: string,
    givenWalkingName?: string,
    givenWalkingContact?: string,
    givenProcessingCharge?: number
): Promise<Process2Result> {
    const base: EnrollmentData = JSON.parse(JSON.stringify(enrollmentData));
    console.log(base);

    const newEnrollment = {
        ...base,
    }
    return {
        newEnrollment
    };
}