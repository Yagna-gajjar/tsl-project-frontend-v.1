import { useEffect, useState, useCallback } from "react";
import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";
import { getMembers } from "@/api/member.api";
// Assuming you have an activity API similar to members
import { getActivities } from "@/api/activity.api";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Enrollment } from "@/types/enrollment";

const EnrollmentFormNew = () => {
  const [error, setError] = useState("");
  const [values, setValues] = useState<Enrollment>({
    enrollmentId: 0,
    firstEnrollmentId: 0,
    enrollmentNo: 0,
    enrollmentDate: format(new Date(), "yyyy-MM-dd"),
    membershipMasterId: 0,
    membershipId: 0,
    accountId: 0,
    memberId: 0,
    memberName: "",
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
  const [activityOptions, setActivityOptions] = useState<any[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // --- Member Fetching Logic ---
  const fetchMembers = useCallback(async (isInitial = false) => {
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
      toast({ title: "Error", description: "Failed to fetch members", variant: "destructive" });
    } finally {
      setLoadingMembers(false);
    }
  }, [loadingMembers, hasMoreMembers, memberPage]);

  const fetchActivities = useCallback(async (isInitial = false) => {
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
      toast({ title: "Error", description: "Failed to fetch activities", variant: "destructive" });
    } finally {
      setLoadingActivities(false);
    }
  }, [loadingActivities, hasMoreActivities, activityPage]);

  useEffect(() => {
    fetchMembers(true);
    fetchActivities(true);
  }, []);

  const onChange = useCallback((field: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async () => {
    console.log("Submitting values:", values);
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
        label: a.activityName, // Assuming the API returns activityName
        value: a.activityId,
      })),
      onLoadMore: () => fetchActivities(), // Activity infinite scroll
      isLoadingMore: loadingActivities,    // Activity loading indicator
    },
    { name: "enrollmentDate", label: "Enrollment Date", type: "Date", disabled: true },
    { name: "permittedDays", label: "Permitted Days", type: "number" },
    { name: "attendingStartDate", label: "Attending Start Date", type: "Date" },
    { name: "endDate", label: "End Date", type: "Date", disabled: true },
    { name: "membersEnrolled", label: "Members Enrolled", type: "number" },
    { name: "academyEntityId", label: "Academy Entity", type: "select", options: [] },
    { name: "courseId", label: "Course", type: "select", options: [] },
    { name: "attendingPattern", label: "Attending Pattern", type: "multiselect", options: [] },
    { name: "billingDaysSessions", label: "Billing Days Sessions", type: "number" },
    { name: "printRemarks", label: "Print Remarks", type: "text" },
    { name: "officeRemarks", label: "Office Remarks", type: "text" },
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