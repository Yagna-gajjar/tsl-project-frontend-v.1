import { useEffect, useState, useCallback } from "react";
import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";
import { getMembers } from "@/api/member.api";
import { toast } from "@/hooks/use-toast";

const EnrollmentFormNew = () => {
  const [error, setError] = useState("");
  const [values, setValues] = useState<any>({
    enrollmentDate: new Date().toISOString().split("T")[0],
    status: "active",
    memberId: "",
  });

  // --- Member Infinite Scroll State ---
  const [memberOptions, setMemberOptions] = useState<any[]>([]);
  const [memberPage, setMemberPage] = useState(1);
  const [hasMoreMembers, setHasMoreMembers] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const PAGE_SIZE = 20;

  // --- Member Fetching Logic ---
  const fetchMembers = useCallback(async (isInitial = false) => {
    if (loadingMembers || (!hasMoreMembers && !isInitial)) return;

    setLoadingMembers(true);
    try {
      const page = isInitial ? 1 : memberPage;
      const response = await getMembers({
        limit: PAGE_SIZE,
        page: page,
      });

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
  }, [loadingMembers, hasMoreMembers, memberPage]);

  // Initial Load
  useEffect(() => {
    fetchMembers(true);
  }, []);

  const onChange = useCallback((field: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async () => {
    console.log("Submitting values:", values);
    toast({ title: "Success", description: "Form submitted (check console)" });
  };

  const fields = [
    {
      name: "memberId",
      label: "Member Name",
      type: "select",
      required: true,
      options: memberOptions.map((m) => ({
        label: m.memberName,
        value: m.memberId,
      })),
      onLoadMore: () => fetchMembers(), // Infinite scroll trigger
      isLoadingMore: loadingMembers,    // UI loading indicator
    },
    { name: "enrollmentDate", label: "Enrollment Date", type: "Date", disabled: true },
    { name: "activityId", label: "Activity", type: "select", options: [] },
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
        onClose={() => setValues({})}
        onSubmit={handleSubmit}
        submitLabel="Create"
        isSubmitting={false}
      />
    </div>
  );
};

export default EnrollmentFormNew;