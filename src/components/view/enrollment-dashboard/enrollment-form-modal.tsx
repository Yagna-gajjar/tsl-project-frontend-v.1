import { useEffect, useState, useCallback, useMemo, type SetStateAction } from "react";
import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";
import { getMembers } from "@/api/member.api";
import { getActivities } from "@/api/activity.api";
import { getEntities } from "@/api/entity.api";
import { getCourses } from "@/api/course.api";
import { getCourseRates } from "@/api/courseRate.api";
import { getBatch } from "@/api/batch.api";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { addDays } from "@/helpers/helper";

// Types
import type { Enrollment } from "@/types/enrollment";
import type { Batch } from "@/types/batch";
import type { Response } from "@/types/response";
import type { Member } from "@/types/member";
import type { Activity } from "@/types/activity";
import type { Course } from "@/types/course";
import type { Entity } from "@/types/entity";

const ALL_WEEK_DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 7 },
];

const PAGE_SIZE = 50;

interface Props {
  setRateTableData: (data: any) => void;
  setBatchTableData: (data: any) => void;
  setEnableCourseView: (val: boolean) => void;
  setSelectedNoOfDays: (val: number) => void;
  setMemberId: (id: number) => void;
  selectedRate: any;
  setActualDaysInWeek: (val: number) => void;
  setSelectedCourseDayInWeek: (val: any) => void;
}

const EnrollmentFormNew = ({
  setRateTableData,
  setBatchTableData,
  setEnableCourseView,
  setSelectedNoOfDays,
  setMemberId,
  selectedRate,
  setActualDaysInWeek,
  setSelectedCourseDayInWeek,
}: Props) => {
  // 1. Unified Form State
  const [values, setValues] = useState<Partial<Enrollment & { membershipMasterId: number; courseRateId: number; discountAmount: number }>>({
    enrollmentDate: format(new Date(), "yyyy-MM-dd"),
    attendingStartDate: format(new Date(), "yyyy-MM-dd"),
    membersEnrolled: 1,
    status: "active",
    openEnrollment: false,
    permittedDays: 0,
    unitRate: 0,
    billingRate: 0,
    discountAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    totalDebitAmount: 0,
    membershipMasterId: 0,
    courseRateId: 0,
    attendingPattern: [], // Initialized as empty array for multiselect
    startTime: ""
  });

  // 2. Options & UI State
  const [options, setOptions] = useState({
    members: [] as Member[],
    activities: [] as Activity[],
    entities: [] as Entity[],
    courses: [] as Course[],
    batches: [] as Batch[],
  });

  const [pagination, setPagination] = useState({
    member: { page: 1, hasMore: true, loading: false },
    activity: { page: 1, hasMore: true, loading: false },
    entity: { page: 1, hasMore: true, loading: false },
  });

  const [memberSearch, setMemberSearch] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // 3. Memoized Helpers
  const allowedWeekDays = useMemo(() => {
    const selectedCourse = options.courses.find((c) => c.courseId === values.courseId);
    if (!selectedCourse || !selectedCourse.daysPattern) return ALL_WEEK_DAYS;

    const pattern = String(selectedCourse.daysPattern);
    return ALL_WEEK_DAYS.filter((day) => pattern.includes(String(day.value)));
  }, [values.courseId, options.courses]);

  // 4. API Fetchers
  const fetchBaseOptions = useCallback(async (type: "member" | "activity" | "entity", isInitial = false, search = "") => {
    const current = pagination[type];
    if (current.loading || (!current.hasMore && !isInitial && !search)) return;

    setPagination((prev) => ({ ...prev, [type]: { ...prev[type], loading: true } }));

    try {
      const page = isInitial ? 1 : current.page;
      let res;
      if (type === "member") res = await getMembers({ limit: PAGE_SIZE, page, search });
      else if (type === "activity") res = await getActivities({ limit: PAGE_SIZE, page, search });
      else if (type === "entity") res = await getEntities({ limit: PAGE_SIZE, page, search, includeEnumCase: [4] });

      const items = res?.data || [];

      // FIX: Correct pluralization mapping to avoid "activitys" error
      const stateKey = type === "member" ? "members" : type === "activity" ? "activities" : "entities";

      setOptions((prev) => ({
        ...prev,
        [stateKey]: isInitial || search ? items : [...(prev[stateKey] as any), ...items],
      }));

      setPagination((prev) => ({
        ...prev,
        [type]: { page: page + 1, hasMore: items.length === PAGE_SIZE, loading: false },
      }));
    } catch {
      setPagination((prev) => ({ ...prev, [type]: { ...prev[type], loading: false } }));
    }
  }, [pagination]);

  // Initial Data Load
  useEffect(() => {
    fetchBaseOptions("activity", true);
    fetchBaseOptions("entity", true);
  }, []);

  // 5. Dependent Logic (The "Brain")

  // Handle Member Search Debounce
  useEffect(() => {
    if (!memberSearch.trim()) return;
    const timer = setTimeout(async () => {
      setMemberLoading(true);
      try {
        const res = await getMembers({ search: memberSearch, limit: 10, page: 1 });
        setOptions(prev => ({ ...prev, members: res?.data || [] }));
      } finally {
        setMemberLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  // Fetch Courses when Activity/Entity changes
  useEffect(() => {
    if (values.activityId) {
      getCourses({ activityId: values.activityId, entityId: values.academyEntityId, limit: 1000 }).then((res) => {
        setOptions((prev) => ({ ...prev, courses: res?.data || [] }));
      });
    } else {
      setOptions((prev) => ({ ...prev, courses: [], batches: [] }));
    }
  }, [values.activityId, values.academyEntityId]);

  // Fetch Batches: Updated to check all required fields efficiently
  useEffect(() => {
    const { activityId, academyEntityId, attendingPattern, startTime } = values;

    // Check if pattern exists and convert to string if array
    const patternStr = Array.isArray(attendingPattern)
      ? attendingPattern.sort().join("")
      : attendingPattern;

    // Fetch only if all 4 conditions are met
    if (activityId && academyEntityId && patternStr && patternStr.length > 0 && startTime) {
      getBatch({
        activityId,
        entityId: academyEntityId,
        daysPattern: patternStr,
        startTime: String(startTime),
        limit: 1000,
      }).then((res: Response<Batch[]>) => {
        const data = res?.data || [];
        setOptions((prev) => ({ ...prev, batches: data }));
        setBatchTableData(data); // Sync batch table data with dashboard
      });
    } else {
      // Clear data if any required field is missing
      setOptions((prev) => ({ ...prev, batches: [] }));
      setBatchTableData([]);
    }
  }, [values.activityId, values.academyEntityId, values.attendingPattern, values.startTime, setBatchTableData]);

  // Fetch Course Rates
  useEffect(() => {
    if (values.courseId) {
      getCourseRates({ courseId: values.courseId, limit: 1000 }).then((res) => {
        if (res?.data) setRateTableData(res.data);
      });
      // Sync course-specific info to parent
      const course = options.courses.find(c => c.courseId === values.courseId);
      if (course) {
        setSelectedCourseDayInWeek(course.noOfDaysInWeek);
        setActualDaysInWeek(course.noOfDaysInWeek);
        setValues((prev: any) => ({
          ...prev,
          attendingPattern: String(course.daysPattern || "").split(""),
          attendingPatternDays: course.noOfDaysInWeek
        }));
      }
    }
  }, [values.courseId, options.courses]);

  // Handle Billing/Tax Logic
  useEffect(() => {
    if (selectedRate) {
      const uRate = parseFloat(selectedRate.unitRate) || 0;
      const days = Number(values.permittedDays) || 0;
      const bRate = uRate * days;
      const cgst = parseFloat(((bRate * 9) / 100).toFixed(2));
      const sgst = parseFloat(((bRate * 9) / 100).toFixed(2));

      setValues((prev) => ({
        ...prev,
        unitRate: uRate,
        billingRate: bRate,
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalDebitAmount: bRate + cgst + sgst,
        membershipMasterId: selectedRate.membershipMasterId
      }));
    }
  }, [selectedRate, values.permittedDays]);

  // Handle Date Calculation
  useEffect(() => {
    if (values.permittedDays && values.attendingStartDate) {
      const startDate = new Date(values.attendingStartDate);
      if (!isNaN(startDate.getTime())) {
        const endDate = format(addDays(startDate, Number(values.permittedDays)), "yyyy-MM-dd");
        setValues(prev => prev.endDate === endDate ? prev : { ...prev, endDate });
      }
    }
  }, [values.attendingStartDate, values.permittedDays]);

  // 6. Change Handler
  const onChange = useCallback((field: string, value: any) => {
    setValues((prev) => {
      const updates: any = { [field]: value };

      if (field === "attendingPattern") {
        updates.attendingPatternDays = Array.isArray(value) ? value.length : 0;
        setActualDaysInWeek(updates.attendingPatternDays);
      }

      if (field === "permittedDays") {
        setEnableCourseView(true);
        setSelectedNoOfDays(Number(value));
      }

      return { ...prev, ...updates };
    });
  }, [setEnableCourseView, setSelectedNoOfDays, setActualDaysInWeek]);

  // 7. Field Configuration
  const fields = [
    {
      name: "activityId",
      label: "Activity",
      type: "select",
      options: options.activities.map((a) => ({ label: a.activityName, value: a.activityId })),
      onSearch: (q: string) => fetchBaseOptions("activity", true, q),
      onLoadMore: () => fetchBaseOptions("activity"),
      isLoadingMore: pagination.activity.loading,
    },
    {
      name: "academyEntityId",
      label: "Academy Entity",
      type: "select",
      options: options.entities.map((e) => ({ label: e.entityName, value: e.entityId })),
      onSearch: (q: string) => fetchBaseOptions("entity", true, q),
      onLoadMore: () => fetchBaseOptions("entity"),
      isLoadingMore: pagination.entity.loading,
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      disabled: !values.activityId,
      options: options.courses.map((c) => ({
        label: `${c.courseName} [Pattern: ${c.daysPattern || "N/A"}]`,
        value: c.courseId,
      })),
    },
    {
      name: "attendingPattern",
      label: "Attending Days",
      type: "multiselect",
      options: allowedWeekDays,
      description: values.courseId ? "Course restricted days." : "Select course first.",
    },
    { name: "startTime", label: "Start Time", type: "Time" },
    { name: "attendingStartDate", label: "Start Date", type: "date" },
    { name: "permittedDays", label: "No Of Days", type: "number" },
    { name: "endDate", label: "End Date", type: "date", disabled: true },
    {
      name: "batchId",
      label: "Batch",
      type: "select",
      disabled: !values.activityId || options.batches.length === 0,
      options: options.batches.map((b) => ({
        label: `${b.batchName} (${b.startTime} - ${b.endTime})`,
        value: b.batchId,
      })),
    },
    { name: "totalDebitAmount", label: "Total Amount", type: "number", disabled: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
  ];

  return (
    <div className="flex flex-col w-full h-[85vh] max-w-6xl mx-auto bg-background border rounded-xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b bg-muted/10">
        <h1 className="text-xl font-bold text-primary">New Enrollment Registration</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-8 p-4 border rounded-lg bg-card">
          <label className="text-sm font-semibold mb-2 block">Search Member</label>
          <div className="relative">
            <input
              className="w-full p-2 border rounded-md"
              placeholder="Start typing name or contact..."
              value={selectedMember ? `${selectedMember.memberFirstName} ${selectedMember.memberLastName}` : memberSearch}
              onChange={(e) => {
                setSelectedMember(null);
                setMemberSearch(e.target.value);
              }}
            />
            {memberLoading && <div className="absolute right-3 top-2.5 animate-pulse text-xs">Searching...</div>}

            {!selectedMember && options.members.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border shadow-md rounded-md max-h-48 overflow-auto">
                {options.members.map(m => (
                  <div
                    key={m.memberId}
                    className="p-2 hover:bg-accent cursor-pointer border-b last:border-0"
                    onClick={() => {
                      setMemberId(Number(m.memberId));
                      setSelectedMember(m);
                      setValues(v => ({ ...v, memberId: m.memberId }));
                    }}
                  >
                    <p className="font-medium">{m.memberFirstName} {m.memberLastName}</p>
                    <p className="text-xs opacity-70">{m.contactNumber}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <FormContent
          fields={fields as any}
          values={values}
          errors={{}}
          loading={false}
          error={null}
          isSubmitting={false}
          onChange={onChange}
          layout="grid"
        />
      </div>

      <FormFooter
        onClose={() => { }}
        onSubmit={() => console.log("Final Data:", values)}
        submitLabel="Complete Enrollment"
        isSubmitting={false}
      />
    </div>
  );
};

export default EnrollmentFormNew;