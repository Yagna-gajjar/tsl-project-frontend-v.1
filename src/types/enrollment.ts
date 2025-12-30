import type { Activity } from "./activity";
import type { Batch } from "./batch";
import type { Course } from "./course";
import type { CourseRate } from "./courseRate";
import type { Member } from "./member";
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
  member?: Member;
  course?: Course;
  courseRate?: CourseRate;
  activity?: Activity;
  batch?: Batch;
  bill?: any;
  confirm?: any;
}
