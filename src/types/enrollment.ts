import type { Transaction } from "./transaction";

export interface Enrollment {
  enrollmentId: number;
  firstEnrollmentId?: number;
  enrollmentNo?: number;
  enrollmentDate?: string;
  membershipMasterId?: number;
  membershipId?: number;
  accountId?: number;
  accountName?: string;
  memberId?: number;
  memberFirstName?: string;
  memberLastName?: string;
  activityId?: number;
  activityName?: string;
  courseId?: number;
  courseName?: string;
  academyEntityId?: number;
  academyEntityName?: string;
  permittedDays?: number;
  attendingStartDate?: string;
  endDate?: string;
  membersEnrolled?: number;
  attendingPattern?: string | string[] | number[];
  attendingPatternDays?: number;
  billingDaysSessions?: number;
  courseRateId?: number;
  unitRate?: number;
  patternDiscount?: number;
  rackPrice?: number;
  dnOrDiscount?: number;
  dnAccountId?: number | null;
  billingRate?: number;
  costToMember?: number;
  roundedAmount?: number;
  billingAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  totalDebitAmount?: number;
  openEnrollment?: boolean;
  printRemarks?: string;
  officeRemarks?: string;
  walkingName?: string;
  walkingContact?: string;
  memberApprovalStatus?: number | null;
  academyApprovalStatus?: number | null;
  finalTSLApproval?: number | null;
  changeNo?: number;
  previousCourseID?: number;
  processingCharge?: number;
  status?: string;
  createdBy?: number;
  createdByUser?: string;
  createdAt?: string;
  updatedAt?: string;

  //support
  startTime?: string;
  activityClassification?: number | null;
  activityType?: string | null;
  chargingPattern: "",
  payment: Transaction,
  batchId: number | null;
}


export interface Member {
  memberId?: number
  memberFirstName: string
  memberLastName: string
  email: string
  phone: string
  age: number
  gender?: "M" | "F" | "O"
  dateOfBirth?: string
}

export interface Course {
  courseId?: number
  accountId?: number
  courseType?: string | null
  activityId: number
  classification?: string | null
  entityId: number
  introduceDate: string
  suspensionDate?: Date | string | null
  courseName: string
  chargingPattern?: string | null
  sessionMinutes: number
  noOfDaysInWeek: number
  daysPattern?: string | null
  maxPerson?: number | null
  unitsMultipleOf?: number
  batchCapacity: number
  totalParallelBatches: number
  minAge: number
  maxAge: number
  gender?: "M" | "F" | "O" | "A" | null
  balanceUsable?: string | null
  enrApprovalRequired?: boolean
  cgstRate?: number
  sgstRate?: number
  status?: string | null
  avbFrom?: string | null
  avbTo?: string | null
  createdBy?: number | null
  createdAt?: string
  updatedAt?: string
  activityName?: string
  entityName?: string
  activityClassification?: number | null
  activityType?: string | null
}

export interface CourseRate {
  courseRateId?: number
  courseId: number
  membershipMasterId?: string | number
  aboveUnits: number
  unitRate: number
  introduceDate: string
  suspensionDate?: Date | string | undefined
  daySelection: boolean
  enrChangesAllowed?: number
  enrFreezingAllowed?: number
  minDaysInEnr: number
  discountOnDayReduce: number
  status?: string
  freezing?: number
  createdAt?: string
  updatedAt?: string
  membershipType?: string | null
  courseName?: string
  numberOfDays?: number
}

export interface Batch {
  batchId?: number
  batchType: string | null
  entityId: number | null
  activityId: number | null
  membershipMasterId?: number | null
  courseId?: number | null
  batchName: string
  startTime: string
  endTime: string
  sessionMinutes: number
  daysPerWeek: number
  daysPattern: number | string | null
  maxCapacity: number
  admissionCriteria?: string | null
  introduceDate: Date | string
  suspendedDate?: Date | string | null
  status?: string
  createdBy?: number | null
  createdAt?: Date | string
  updatedAt?: Date | string
  activeMemberCount?: number
  entityName?: string
  courseName?: string
  activityName?: string
  areaName?: string
  facilityName?: string
  coachName?: string
}

export interface Activity {
  activityId: number
  activityName: string
  activityClassification?: number | null
  activityType?: string | null
  status?: string
}

export interface EnrollmentData {
  member?: Member
  activity?: Activity
  activityClassification?: string | null
  activityType?: string | null
  course?: Course
  courseRate?: CourseRate
  batch?: Batch
  confirmation?: {
    walkingName: string
    walkingContact: string
    officeRemarks: string
    printRemarks: string
    memberEnrolled: boolean
    agreedTerms: boolean
  }
}
