import { useEffect, useState, useCallback } from "react";
import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";
import { getMembers } from "@/api/member.api";
// Assuming you have an activity API similar to members
import { getActivities } from "@/api/activity.api";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Enrollment } from "@/types/enrollment";
import type { Activity } from "@/types/activity";
import type { Entity } from "@/types/entity";
import { getEntities } from "@/api/entity.api";
import type { Course } from "@/types/course";
import { getCourses } from "@/api/course.api";
import type { CourseRate } from "@/types/courseRate";
import { getCourseRates } from "@/api/courseRate.api";
import { addDays } from "@/helpers/helper";

const EnrollmentFormNew = ({
  setRateTableData
}: { setRateTableData: any }) => {
  console.log(setRateTableData);
  const [error, _] = useState("");
  const [values, setValues] = useState<Enrollment>({
    enrollmentId: 0,
    firstEnrollmentId: 0,
    enrollmentNo: 0,
    enrollmentDate: format(new Date(), "yyyy-MM-dd"),
    membershipMasterId: 0,
    membershipId: 0,
    accountId: 0,
    memberId: 0,
    memberFirstName: "",
    activityId: 0,
    permittedDays: 0,
    attendingStartDate: format(new Date(), "yyyy-MM-dd"),
    endDate: undefined,
    membersEnrolled: 1,
    academyEntityId: 0,
    courseId: 0,
    attendingPattern: "",
    attendingPatternDays: 0,
    billingDaysSessions: 0,
    courseRateId: 0,
    patternDiscount: 0,
    rackPrice: 0,
    dnOrDiscount: 0,
    dnAccountId: 0,
    billingRate: 0,
    costToMember: 0,
    roundedAmount: 0,
    billingAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    totalDebitAmount: 0,
    openEnrollment: false,
    printRemarks: "",
    officeRemarks: "",
    walkingName: "",
    walkingContact: "",
    memberApprovalStatus: 0,
    academyApprovalStatus: 0,
    finalTSLApproval: 0,
    changeNo: 0,
    previousCourseID: 0,
    processingCharge: 0,
    status: "active",
  });

  const PAGE_SIZE = 20;

  // --- Member State ---
  const [memberOptions, setMemberOptions] = useState<any[]>([]);
  const [memberPage, setMemberPage] = useState(1);
  const [hasMoreMembers, setHasMoreMembers] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // --- Activity State ---
  const [activityOptions, setActivityOptions] = useState<Activity[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // --- Entity State ---
  const [entityOptions, setEntityOptions] = useState<Entity[]>([]);
  const [entityPage, setEntityPage] = useState(1);
  const [hasMoreEntity, setHasMoreEntity] = useState(true);
  const [loadingEntity, setLoadingEntity] = useState(false);

  // --- Course State ---
  const [courseOptions, setCourseOptions] = useState<Course[]>([]);
  const [coursePage, setCoursePage] = useState(1);
  const [hasMoreCourse, setHasMoreCourse] = useState(true);
  const [loadingCourse, setLoadingCourse] = useState(false);

  // --- Course Rate State ---
  const [courseRateOptions, setCourseRateOptions] = useState<CourseRate[]>([]);
  const [courseRatePage, setCourseRatePage] = useState(1);
  const [hasMoreCourseRate, setHasMoreCourseRate] = useState(true);
  const [loadingCourseRate, setLoadingCourseRate] = useState(false);

  // --- Member Fetching Logic ---
  const fetchMembers = useCallback(
    async (isInitial = false) => {
      if (loadingMembers || (!hasMoreMembers && !isInitial)) return;
      setLoadingMembers(true);
      try {
        const page = isInitial ? 1 : memberPage;
        const response = await getMembers({ limit: PAGE_SIZE, page });
        const items = response?.data || [];
        setMemberOptions((prev) => (isInitial ? items : [...prev, ...items]));
        setHasMoreMembers(items.length === PAGE_SIZE);
        setMemberPage(page + 1);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch members",
          variant: "destructive",
        });
      } finally {
        setLoadingMembers(false);
      }
    },
    [loadingMembers, hasMoreMembers, memberPage]
  );

  const fetchActivities = useCallback(
    async (isInitial = false) => {
      if (loadingActivities || (!hasMoreActivities && !isInitial)) return;
      setLoadingActivities(true);
      try {
        const page = isInitial ? 1 : activityPage;
        const response = await getActivities({ limit: PAGE_SIZE, page });
        const items = response?.data || [];
        setActivityOptions((prev) => (isInitial ? items : [...prev, ...items]));
        setHasMoreActivities(items.length === PAGE_SIZE);
        setActivityPage(page + 1);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch activities",
          variant: "destructive",
        });
      } finally {
        setLoadingActivities(false);
      }
    },
    [loadingActivities, hasMoreActivities, activityPage]
  );

  const fetchAcademyEntity = useCallback(
    async (isInitial = false) => {
      if (loadingEntity || (!hasMoreEntity && !isInitial)) return;
      setLoadingEntity(true);
      try {
        const page = isInitial ? 1 : entityPage;
        const response = await getEntities({ limit: PAGE_SIZE, page });
        const items = response?.data || [];
        setEntityOptions((prev) => (isInitial ? items : [...prev, ...items]));
        setHasMoreEntity(items.length === PAGE_SIZE);
        setEntityPage(page + 1);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch activities",
          variant: "destructive",
        });
      } finally {
        setLoadingEntity(false);
      }
    },
    [loadingEntity, hasMoreEntity, entityPage]
  );

  const fetchCourse = useCallback(
    async (isInitial = false) => {
      if (loadingCourse || (!hasMoreCourse && !isInitial)) return;
      setLoadingCourse(true);
      try {
        const page = isInitial ? 1 : entityPage;
        const response = await getCourses({ limit: PAGE_SIZE, page });
        const items = response?.data || [];
        setCourseOptions((prev) => (isInitial ? items : [...prev, ...items]));
        setHasMoreCourse(items.length === PAGE_SIZE);
        setCoursePage(page + 1);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch activities",
          variant: "destructive",
        });
      } finally {
        setLoadingEntity(false);
      }
    },
    [loadingCourse, hasMoreCourse, coursePage]
  );

  const fetchCourseRate = useCallback(
    async (isInitial = false) => {
      if (loadingCourseRate || (!hasMoreCourseRate && !isInitial)) return;
      setLoadingCourseRate(true);
      try {
        const page = isInitial ? 1 : courseRatePage;
        const response = await getCourseRates({ limit: PAGE_SIZE, page });
        const items = response?.data || [];
        setCourseRateOptions((prev) =>
          isInitial ? items : [...prev, ...items]
        );
        setHasMoreCourseRate(items.length === PAGE_SIZE);
        setCourseRatePage(page + 1);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch activities",
          variant: "destructive",
        });
      } finally {
        setLoadingCourseRate(false);
      }
    },
    [loadingCourseRate, hasMoreCourseRate, courseRatePage]
  );

  const WEEK_DAYS = [
    { label: "Monday", value: 1 },
    { label: "Tuesday", value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday", value: 4 },
    { label: "Friday", value: 5 },
    { label: "Saturday", value: 6 },
    { label: "Sunday", value: 7 },
  ];

  const daysArrayToNumber = (days: number[]) => {
    return Number(days.sort((a, b) => a - b).join(""));
  };

  useEffect(() => {
    fetchMembers(true);
    fetchActivities(true);
    fetchAcademyEntity(true);
    fetchCourse(true);
    fetchCourseRate;
    true;
  }, []);

  useEffect(() => {
    const { attendingStartDate, permittedDays } = values;

    // Guard clauses – no fake dates
    if (!attendingStartDate || !permittedDays || permittedDays <= 0) {
      setValues((prev) => ({
        ...prev,
        endDate: undefined,
      }));
      return;
    }

    const calculatedEndDate = addDays(attendingStartDate, permittedDays);
    console.log(calculatedEndDate);

    setValues((prev: any) => ({
      ...prev,
      endDate: format(calculatedEndDate, "yyyy-MM-dd"),
    }));
  }, [values.attendingStartDate, values.permittedDays]);

  const onChange = useCallback((field: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async () => {
    const payload = {
      ...values,
      attendingPattern: daysArrayToNumber(values.attendingPattern as any),
    };
    console.log("Submitting values:", payload);
    toast({ title: "Success", description: "Form submitted" });
  };

  const fields = [
    {
      name: "memberId",
      label: "Member Name",
      type: "select",
      required: true,
      options: memberOptions.map((m) => ({
        label: `${m.memberFirstName} ${m.memberLastName}`,
        value: m.memberId,
      })),
      onLoadMore: () => fetchMembers(),
      isLoadingMore: loadingMembers,
    },
    {
      name: "activityId",
      label: "Activity",
      type: "select",
      required: true,
      options: activityOptions.map((a) => ({
        label: a.activityName,
        value: a.activityId,
      })),
      onLoadMore: () => fetchActivities(),
      isLoadingMore: loadingActivities,
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      options: courseOptions?.map((c) => ({
        value: c.courseId,
        label: c.courseName,
      })),
    },
    {
      name: "enrollmentDate",
      label: "Enrollment Date",
      type: "Date",
      disabled: true,
    },
    { name: "permittedDays", label: "Permitted Days", type: "number" },
    { name: "attendingStartDate", label: "Attending Start Date", type: "Date" },
    { name: "endDate", label: "End Date", type: "Date", disabled: true },
    { name: "membersEnrolled", label: "Members Enrolled", type: "number" },
    {
      name: "academyEntityId",
      label: "Academy Entity",
      type: "select",
      options: entityOptions?.map((e) => ({
        value: e.entityId,
        label: e.entityName,
      })),
    },
    {
      name: "attendingPattern",
      label: "Attending Pattern",
      type: "multiselect",
      require: true,
      options: WEEK_DAYS,
    },
    {
      name: "attendingPatternDays",
      label: "Attending Pattern Days",
      type: "number",
      disabled: true,
    },
    {
      name: "billingDaysSessions",
      label: "Billing Days Sessions",
      type: "number",
    },
    {
      name: "courseRateId",
      label: "Course Rate",
      type: "select",
      options: courseRateOptions?.map((c) => ({
        value: c.courseRateId,
        label: c.aboveUnits,
      })),
    },
    {
      name: "patternDiscount",
      label: "Pattern Discount",
      type: "number",
      disabled: true,
    },
    {
      name: "rackPrice",
      label: "Rack Price",
      type: "number",
      disabled: true,
    },
    {
      name: "dnOrDiscount",
      label: "Dn Or Discount",
      type: "text",
      options: [
        { value: "Dn", label: "Dn" },
        { value: "Discount", label: "Discount" },
      ],
    },
    {
      name: "billingRate",
      label: "Billing Rate",
      type: "number",
      disabled: true,
    },
    {
      name: "cgstAmount",
      label: "CGST Amount",
      type: "number",
      disabled: true,
    },
    {
      name: "sgstAmount",
      label: "SGST Amount",
      type: "number",
      disabled: true,
    },
    {
      name: "totalDebitAmount",
      label: "Total Debit Amount",
      type: "number",
      disabled: true,
    },
    {
      name: "openEnrollment",
      label: "Open Enrollment",
      type: "checkbox",
    },
    {
      name: "printRemarks",
      label: "Print Remarks",
      type: "text",
    },
    {
      name: "officeRemarks",
      label: "Office Remarks",
      type: "text",
    },
    {
      name: "walkInName",
      label: "walkIn Name",
      type: "text",
    },
    {
      name: "walkInContact",
      label: "walkIn Contact",
      type: "text",
      disabled: true,
    },
    {
      name: "memberApprovalStatus",
      label: "Member Approval Status",
      type: "text",
      disabled: true,
    },
    {
      name: "academyApprovalStatus",
      label: "Academy Approval Status",
      type: "text",
      disabled: true,
    },
    {
      name: "finalTSLApproval",
      label: "Final TSL Approval",
      type: "text",
      disabled: true,
    },
    {
      name: "ChangeNo",
      label: "Change No",
      type: "text",
      disabled: true,
    },
    {
      name: "previousCourseId",
      label: "Previous CourseID",
      type: "text",
      disabled: true,
    },
    {
      name: "processingCharges",
      label: "Processing Charges",
      type: "text",
    },
  ];

  return (
    <div className="flex flex-col w-full max-h-[90vh] overflow-hidden">
      <div className="overflow-auto px-4">
        <h1 className="text-center text-blue-600 font-bold text-2xl py-4">
          Enrollment Details
        </h1>

        <FormContent
          fields={fields as any}
          values={values}
          errors={{}}
          loading={false}
          error={error}
          isSubmitting={false}
          onChange={onChange}
          layout="grid"
        />
      </div>

      <FormFooter
        onClose={() => setValues({} as any)}
        onSubmit={handleSubmit}
        submitLabel="Create"
        isSubmitting={false}
      />
    </div>
  );
};

export default EnrollmentFormNew;