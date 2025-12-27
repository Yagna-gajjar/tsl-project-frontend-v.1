import { useEffect, useState, useCallback, useMemo } from "react";
import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";
import { getMembers } from "@/api/member.api";
import { getActivities } from "@/api/activity.api";
import { getCourses } from "@/api/course.api";
import { getCourseRates } from "@/api/courseRate.api";
import { getEnumsByCategory } from "@/api/enums.api";
import { getBatch } from "@/api/batch.api";
import { format } from "date-fns";
import { addDays } from "@/helpers/helper";

import type { Enrollment } from "@/types/enrollment";
import type { Batch } from "@/types/batch";
import type { Member } from "@/types/member";
import type { Activity } from "@/types/activity";
import type { Course } from "@/types/course";
import type { Enums } from "@/types/enums";
import { toast } from "@/hooks/use-toast";

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
  setAllCourse: (data: any) => void;
  allCourse: Course[];
  onFilterChange: (filters: { activityId?: any, academyEntityId?: any, startTime?: any }) => void;
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
  setAllCourse,
  allCourse,
  onFilterChange
}: Props) => {
  // --- 1. State Management ---
  const [values, setValues] = useState<Partial<Enrollment & { membershipMasterId: number }>>({
    activityClassification: null,
    activityType: null,
    chargingPattern: "",
    billingDaysSessions: 0,
    enrollmentDate: format(new Date(), "yyyy-MM-dd"),
    attendingStartDate: format(new Date(), "yyyy-MM-dd"),
    membersEnrolled: 1,
    status: "active",
    openEnrollment: false,
    permittedDays: 0,
    unitRate: 0,
    rackPrice: 0,
    billingRate: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    totalDebitAmount: 0,
    membershipMasterId: 0,
    courseRateId: 0,
    startTime: "",
    dnOrDiscount: 0,
    dnAccountId: null,
    roundedAmount: 0,
    billingAmount: 0,
    processingCharge: 0,
    printRemarks: "",
    officeRemarks: "",
    walkingName: "",
    walkingContact: "",
  });

  const [options, setOptions] = useState({
    members: [] as Member[],
    activities: [] as Activity[],
    batches: [] as Batch[],
    activityClassification: [] as Enums[],
    activityTypes: [] as Enums[],
  });

  const [pagination, setPagination] = useState({
    member: { page: 1, hasMore: true, loading: false },
    activity: { page: 1, hasMore: true, loading: false },
  });

  const [memberSearch, setMemberSearch] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const availableEntities = useMemo(() => {
    const entityMap = new Map();
    allCourse.forEach((course) => {
      if (course.entityId && course.entityName) {
        entityMap.set(course.entityId, {
          id: course.entityId,
          name: course.entityName,
        });
      }
    });
    return Array.from(entityMap.values());
  }, [allCourse]);

  const filteredCourses = useMemo(() => {
    return allCourse.filter((course) => {
      if (values.activityType && course.classification !== values.activityType) return false;
      if (values.academyEntityId && course.entityId !== values.academyEntityId) return false;
      if (values.startTime && course.avbFrom && course.avbTo) {
        const toMinutes = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(":").map(Number);
          return hours * 60 + (minutes || 0);
        };
        const currentStart = toMinutes(values.startTime);
        const courseFrom = toMinutes(course.avbFrom);
        const courseTo = toMinutes(course.avbTo);

        if (currentStart < courseFrom || currentStart > courseTo) return false;
      }
      return true;
    });
  }, [allCourse, values.activityType, values.academyEntityId, values.startTime]);

  const allowedWeekDays = useMemo(() => {
    const selectedCourse = filteredCourses.find((c) => c.courseId === values.courseId);
    if (!selectedCourse || !selectedCourse.daysPattern) return ALL_WEEK_DAYS;
    const pattern = String(selectedCourse.daysPattern);
    return ALL_WEEK_DAYS.filter((day) => pattern.includes(String(day.value)));
  }, [values.courseId, filteredCourses]);

  const fetchBaseOptions = useCallback(
    async (type: "member" | "activity", isInitial = false, search = "") => {
      const current = pagination[type];
      if (current.loading || (!current.hasMore && !isInitial && !search)) return;
      setPagination((prev) => ({ ...prev, [type]: { ...prev[type], loading: true } }));
      try {
        const page = isInitial ? 1 : current.page;
        const res =
          type === "member"
            ? await getMembers({ limit: PAGE_SIZE, page, search })
            : await getActivities({ limit: PAGE_SIZE, page, search });

        const items = res?.data || [];
        setOptions((prev) => ({
          ...prev,
          [type === "member" ? "members" : "activities"]:
            isInitial || search ? items : [...(prev[type === "member" ? "members" : "activities"] as any), ...items],
        }));
        setPagination((prev) => ({
          ...prev,
          [type]: { page: page + 1, hasMore: items.length === PAGE_SIZE, loading: false },
        }));
      } catch {
        setPagination((prev) => ({ ...prev, [type]: { ...prev[type], loading: false } }));
      }
    },
    [pagination]
  );

  useEffect(() => {
    getEnumsByCategory("ACTIVITY STATUS").then((res) => setOptions((p) => ({ ...p, activityClassification: res?.data || [] })));
    getEnumsByCategory("ACTIVITY TYPE").then((res) => setOptions((p) => ({ ...p, activityTypes: res?.data || [] })));
    fetchBaseOptions("activity", true);
  }, []);

  useEffect(() => {
    if (values.activityType) {
      getCourses({ classification: values.activityType, limit: 10000 }).then((res) => {
        if (res.success) setAllCourse(res?.data || []);
        else toast({ title: "Error", description: "Failed to load courses", variant: "destructive" });
      });
    }
  }, [values.activityType, values.activityClassification]);

  useEffect(() => {
    if (!memberSearch.trim()) return;
    const timer = setTimeout(async () => {
      setMemberLoading(true);
      try {
        const res = await getMembers({ search: memberSearch, limit: 10, page: 1 });
        setOptions((prev) => ({ ...prev, members: res?.data || [] }));
      } finally {
        setMemberLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  useEffect(() => {
    const { activityId, academyEntityId, attendingPattern, startTime } = values;
    const patternStr = Array.isArray(attendingPattern) ? attendingPattern.sort().join("") : attendingPattern;
    if (activityId && academyEntityId && patternStr && patternStr.length > 0 && startTime) {
      getBatch({ activityId, entityId: academyEntityId, daysPattern: patternStr, startTime: String(startTime), limit: 1000 }).then((res) => {
        const data = res?.data || [];
        setOptions((prev) => ({ ...prev, batches: data }));
        setBatchTableData(data);
      });
    } else {
      setOptions((prev) => ({ ...prev, batches: [] }));
      setBatchTableData([]);
    }
  }, [values.activityId, values.academyEntityId, values.attendingPattern, values.startTime, setBatchTableData]);

  useEffect(() => {
    if (values.courseId) {
      getCourseRates({ courseId: values.courseId, limit: 1000 }).then((res) => {
        if (res?.data) setRateTableData(res.data);
      });
      const course = filteredCourses.find((c) => c.courseId === values.courseId);
      if (course) {
        setSelectedCourseDayInWeek(course.noOfDaysInWeek);
        setActualDaysInWeek(course.noOfDaysInWeek);
        setValues((prev: any) => ({
          ...prev,
          attendingPattern: String(course.daysPattern || "").split(""),
          attendingPatternDays: course.noOfDaysInWeek,
          chargingPattern: course.chargingPattern,
        }));
      }
    }
  }, [values.courseId, filteredCourses]);

  useEffect(() => {
    if (values.permittedDays && values.attendingStartDate) {
      const startDate = new Date(values.attendingStartDate);
      if (!isNaN(startDate.getTime())) {
        const endDate = format(addDays(startDate, Number(values.permittedDays)), "yyyy-MM-dd");
        setValues((prev) => (prev.endDate === endDate ? prev : { ...prev, endDate }));
      }
    }
  }, [values.attendingStartDate, values.permittedDays]);

  useEffect(() => {
    if (selectedRate) {
      const uRate = parseFloat(selectedRate.unitRate) || 0;
      const days = Number(values.permittedDays) || 0;
      const discount = Number(values.dnOrDiscount) || 0;
      const procCharge = Number(values.processingCharge) || 0;
      const hasDnAccount = values.dnAccountId !== null && values.dnAccountId !== 0;

      let billingAmount = 0;
      let cgst = 0, sgst = 0, totalDebit = 0, finalUnitRate = uRate;

      if (hasDnAccount) {
        // logic: Discount per day reduces unit rate before tax
        const discountPerDay = days > 0 ? discount / days : 0;
        finalUnitRate = uRate - discountPerDay;
        billingAmount = parseFloat((finalUnitRate * days).toFixed(2));
        cgst = parseFloat((billingAmount * 0.09).toFixed(2));
        sgst = parseFloat((billingAmount * 0.09).toFixed(2));
        totalDebit = billingAmount + cgst + sgst + procCharge;
      } else {
        // logic: Discount is subtracted from the total after tax
        billingAmount = uRate * days;
        cgst = parseFloat((billingAmount * 0.09).toFixed(2));
        sgst = parseFloat((billingAmount * 0.09).toFixed(2));
        totalDebit = billingAmount + cgst + sgst - discount + procCharge;
      }

      const roundedTotal = Math.ceil(totalDebit);
      const roundingDiff = parseFloat((roundedTotal - totalDebit).toFixed(2));

      setValues((prev) => ({
        ...prev,
        courseRateId: selectedRate.courseRateId,
        unitRate: parseFloat(finalUnitRate.toFixed(2)),
        rackPrice: parseFloat(finalUnitRate.toFixed(2)),
        billingRate: billingAmount,
        billingAmount: billingAmount,
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalDebitAmount: roundedTotal,
        roundedAmount: roundingDiff,
        membershipMasterId: selectedRate.membershipMasterId,
      }));
    }
  }, [selectedRate, values.permittedDays, values.dnOrDiscount, values.dnAccountId, values.processingCharge]);

  const onChange = useCallback(
    (field: string, value: any) => {
      setValues((prev) => {
        let finalValue = value;
        if (["dnOrDiscount", "processingCharge", "permittedDays", "billingDaysSessions"].includes(field)) {
          finalValue = value === "" ? 0 : Number(value);
        }
        const updates: any = { [field]: finalValue };

        if (field === "attendingPattern") {
          updates.attendingPatternDays = Array.isArray(value) ? value.length : 0;
          setActualDaysInWeek(updates.attendingPatternDays);
        }

        if (["activityId", "academyEntityId", "startTime"].includes(field)) {
          const mappedField = field === "academyEntityId" ? "entityId" : field;
          onFilterChange({ [mappedField]: value });
        }
        const pattern = String(prev.chargingPattern || "").toLowerCase();
        if (field === "permittedDays") {
          setEnableCourseView(true);
          setSelectedNoOfDays(Number(finalValue));

          if (pattern === "day") {
            updates.billingDaysSessions = Number(finalValue);
            if (prev.attendingStartDate && Number(finalValue) > 0) {
              const calculatedEndDate = addDays(new Date(prev.attendingStartDate), Number(finalValue) - 1);
              updates.endDate = format(calculatedEndDate, "yyyy-MM-dd");
            }
          }
        }
        if (field === "billingDaysSessions" && pattern === "session") {
          // 1. Find the selected course to get its 'noOfDaysInWeek'
          const selectedCourse = allCourse.find(c => c.courseId === prev.courseId);
          const daysInWeek = selectedCourse?.noOfDaysInWeek || 0;

          // 2. Calculate X: billingSessions * noOfDaysInWeek
          const X = Number(finalValue) * daysInWeek;

          // 3. Update permittedDays and Dashboard views
          updates.permittedDays = X;
          setSelectedNoOfDays(X);
          setEnableCourseView(true);

          // 4. Update endDate: (startDate + X - 1)
          if (prev.attendingStartDate && X > 0) {
            const startDate = new Date(prev.attendingStartDate);
            if (!isNaN(startDate.getTime())) {
              const calculatedEndDate = addDays(startDate, X - 1);
              updates.endDate = format(calculatedEndDate, "yyyy-MM-dd");
            }
          }
        }

        return { ...prev, ...updates };
      });
    },
    [setEnableCourseView, setSelectedNoOfDays, setActualDaysInWeek, onFilterChange]
  );

  const handleFinalSubmit = () => {
    const submissionData = {
      ...values,
      attendingPattern: Array.isArray(values.attendingPattern)
        ? Number(values.attendingPattern.sort().join(""))
        : values.attendingPattern,
    };
    console.log("Final Submission Data:", submissionData);
  };

  const fields = [
    {
      name: "activityClassification",
      label: "Activity Classification",
      type: "select",
      options: options.activityClassification.map((item) => ({ label: item.value, value: item.enumCase })),
    },
    {
      name: "activityType",
      label: "Activity Type",
      type: "select",
      options: values.activityClassification
        ? options.activityTypes
          .filter((type) => type.enumCase === values.activityClassification)
          .map((item) => ({ label: item.value, value: item.value }))
        : [],
      disabled: !values.activityClassification,
    },
    {
      name: "activityId",
      label: "Activity Filter",
      type: "select",
      options: options.activities.map((a) => ({ label: a.activityName, value: a.activityId })),
      onSearch: (q: string) => fetchBaseOptions("activity", true, q),
      onLoadMore: () => fetchBaseOptions("activity"),
      isLoadingMore: pagination.activity.loading,
    },
    {
      name: "academyEntityId",
      label: "Academy Entity Filter",
      type: "select",
      options: availableEntities.map((e) => ({ label: e.name, value: e.id })),
    },
    {
      name: "startTime",
      label: "Start Time",
      type: "Time",
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      options: filteredCourses.map((c) => ({
        label: `${c.courseName} [Pattern: ${c.daysPattern || "N/A"}]`,
        value: c.courseId,
      })),
      disabled: !values.activityType || filteredCourses.length === 0,
    },
    {
      name: "chargingPattern",
      label: "Charging Pattern",
      type: "text",
      disabled: true,
    },
    {
      name: "attendingPattern",
      label: "Attending Days",
      type: "multiselect",
      options: allowedWeekDays,
      description: values.courseId ? "Course restricted days." : "Select course first.",
    },
    { name: "attendingStartDate", label: "Start Date", type: "date" },
    {
      name: "permittedDays",
      label: "Permitted Days",
      type: "number",
      disabled: values.chargingPattern?.toLowerCase() === "session"
    },
    {
      name: "billingDaysSessions",
      label: "Billing Days/Sessions",
      type: "number",
      disabled: values.chargingPattern?.toLowerCase() === "day"
    },
    {
      name: "endDate",
      label: "End Date",
      type: "date",
      disabled: true
    },
    {
      name: "batchId",
      label: "Batch",
      type: "select",
      disabled: !values.activityId || options.batches.length === 0,
      options: options.batches.map((b) => ({ label: `${b.batchName} (${b.startTime} - ${b.endTime})`, value: b.batchId })),
    },
    { name: "dnOrDiscount", label: "Discount / DN", type: "number" },
    {
      name: "dnAccountId",
      label: "DN Account",
      type: "select",
      options: availableEntities.map((e) => ({ label: e.name, value: e.id })),
    },
    { name: "processingCharge", label: "Processing Charge", type: "number" },
    { name: "billingAmount", label: "Billing Amount", type: "number", disabled: true },
    { name: "roundedAmount", label: "Rounding", type: "number", disabled: true },
    { name: "cgstAmount", label: "CGST (9%)", type: "number", disabled: true },
    { name: "sgstAmount", label: "SGST (9%)", type: "number", disabled: true },
    { name: "totalDebitAmount", label: "Total Debit Amount", type: "number", disabled: true },
    { name: "walkingName", label: "Walking Name", type: "text" },
    { name: "walkingContact", label: "Walking Contact", type: "text" },
    { name: "printRemarks", label: "Print Remarks", type: "text" },
    { name: "officeRemarks", label: "Office Remarks", type: "text" },
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
    <div className="flex flex-col w-full h-[83vh] max-w-6xl mx-auto bg-background border rounded-xl overflow-hidden shadow-2xl">
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
                {options.members.map((m) => (
                  <div
                    key={m.memberId}
                    className="p-2 hover:bg-accent cursor-pointer border-b last:border-0"
                    onClick={() => {
                      setMemberId(Number(m.memberId));
                      setSelectedMember(m);
                      setValues((v) => ({ ...v, memberId: m.memberId }));
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

        <FormContent fields={fields as any} values={values} errors={{}} loading={false} error={null} isSubmitting={false} onChange={onChange} layout="grid" />
      </div>

      <FormFooter onClose={() => setValues({})} onSubmit={handleFinalSubmit} submitLabel="Complete Enrollment" isSubmitting={false} />
    </div>
  );
};

export default EnrollmentFormNew;