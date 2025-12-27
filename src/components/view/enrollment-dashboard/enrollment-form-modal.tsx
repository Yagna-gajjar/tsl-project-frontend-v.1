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
import TransactionFormModal from "../transaction/transaction-form-modal";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/types/transaction";

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
  const [values, setValues] = useState<Partial<Enrollment & { membershipMasterId: number }>>({
    activityClassification: null,
    activityType: null,
    chargingPattern: "",
    billingDaysSessions: 0,
    patternDiscount: 1,
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
    costToMember: 0,
    memberApprovalStatus: null,
    academyApprovalStatus: null,
    finalTSLApproval: null,
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

  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [transactionData, setTransactionData] = useState<Partial<Transaction>>({
    transactionType: "receipt"
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

  const handleAddTransactionDetailsa = async () => {
    setValues((prev)=>({
      ...prev,
      payment: transactionData
    }))
    console.log("Payment Added", transactionData);
    toast({
      title: "Success",
      description: "Payment"
    })
  }

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
    const { activityId, academyEntityId, attendingPattern, startTime, courseId } = values;

    // Find the selected course to get sessionMinutes
    const selectedCourse = allCourse.find(c => c.courseId === courseId);
    const patternStr = Array.isArray(attendingPattern) ? attendingPattern.sort().join("") : attendingPattern;

    if (activityId && academyEntityId && patternStr && patternStr.length > 0 && startTime && selectedCourse) {

      // 1. Calculate endTime: startTime + sessionMinutes
      const [startHours, startMins] = startTime.split(":").map(Number);
      const sessionMinutes = selectedCourse.sessionMinutes || 0;

      // Convert to total minutes, add session, then convert back to HH:mm
      const totalMinutes = (startHours * 60) + startMins + sessionMinutes;
      const endHours = Math.floor(totalMinutes / 60) % 24; // Use % 24 to handle midnight wrap
      const endMins = totalMinutes % 60;

      const formattedEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      // 2. Pass both startTime and calculated endTime to the API
      getBatch({
        activityId,
        entityId: academyEntityId,
        daysPattern: patternStr,
        startTime: String(startTime),
        endTime: formattedEndTime,
        limit: 1000
      }).then((res) => {
        const data = res?.data || [];
        setOptions((prev) => ({ ...prev, batches: data }));
        setBatchTableData(data);
      });
    } else {
      setOptions((prev) => ({ ...prev, batches: [] }));
      setBatchTableData([]);
    }
  }, [
    values.activityId,
    values.academyEntityId,
    values.attendingPattern,
    values.startTime,
    values.courseId,
    allCourse,
    setBatchTableData
  ]);

  useEffect(() => {
    if (values.courseId) {
      getCourseRates({ courseId: values.courseId, limit: 1000 }).then((res) => {
        if (res?.data) setRateTableData(res.data);
      });

      const course = filteredCourses.find((c) => c.courseId === values.courseId);
      if (course) {
        const pattern = String(course.chargingPattern || "").toLowerCase();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let updates: any = {
          attendingPattern: String(course.daysPattern || "").split(""),
          attendingPatternDays: course.noOfDaysInWeek,
          chargingPattern: course.chargingPattern,
        };

        if (pattern === "unit" || pattern === "school") {
          const introDate = new Date(course.introduceDate);
          const suspDate = new Date(course?.suspensionDate as any);
          const finalStart = introDate < today ? today : introDate;
          const diffTime = suspDate.getTime() - finalStart.getTime();
          const calcPermittedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

          updates = {
            ...updates,
            billingDaysSessions: 1,
            attendingStartDate: format(finalStart, "yyyy-MM-dd"),
            endDate: format(suspDate, "yyyy-MM-dd"),
            permittedDays: calcPermittedDays,
          };

          setSelectedNoOfDays(calcPermittedDays);
          setEnableCourseView(true);
        }

        setActualDaysInWeek(course.noOfDaysInWeek);
        setSelectedCourseDayInWeek(course.noOfDaysInWeek);
        setValues((prev: any) => ({ ...prev, ...updates }));
      }
    }
  }, [values.courseId, filteredCourses]);

  useEffect(() => {
    const pattern = String(values.chargingPattern || "").toLowerCase();
    if (pattern === "unit" || pattern === "school") return;

    if (values.permittedDays && values.attendingStartDate) {
      const startDate = new Date(values.attendingStartDate);
      if (!isNaN(startDate.getTime())) {
        const endDate = format(addDays(startDate, Number(values.permittedDays)), "yyyy-MM-dd");
        setValues((prev) => (prev.endDate === endDate ? prev : { ...prev, endDate }));
      }
    }
  }, [values.attendingStartDate, values.permittedDays, values.chargingPattern]);

  useEffect(() => {
    if (selectedRate) {
      // 1. Initial assignment from selectedRate
      const rackPrice = parseFloat(selectedRate.unitRate) || 0;
      const patternDiscount = parseFloat(selectedRate.patternDiscount) || 0;
      const dnOrDiscount = Number(values.dnOrDiscount) || 0;
      const sessions = Number(values.billingDaysSessions) || 1; // Prevent division by zero
      const hasDnAccount = values.dnAccountId !== null && values.dnAccountId !== 0;

      // 2. Define local variables based on your formulas
      const x = rackPrice * patternDiscount;
      const y = sessions > 0 ? dnOrDiscount / sessions : 0;

      let billingRate = 0;
      let costToMember = 0;

      if (!hasDnAccount) {
        billingRate = parseFloat((x - y).toFixed(2));
        costToMember = parseFloat((x - y).toFixed(2));
      } else {
        billingRate = x;
        costToMember = parseFloat((x - y).toFixed(2));
      }

      const days = Number(values.permittedDays) || 0;
      const billingAmount = parseFloat((billingRate * days).toFixed(2));
      const cgst = parseFloat((billingAmount * 0.09).toFixed(2));
      const sgst = parseFloat((billingAmount * 0.09).toFixed(2));
      const procCharge = Number(values.processingCharge) || 0;

      const totalDebit = billingAmount + cgst + sgst + procCharge;
      const roundedTotal = Math.ceil(totalDebit);
      const roundingDiff = parseFloat((roundedTotal - totalDebit).toFixed(2));

      setValues((prev) => ({
        ...prev,
        courseRateId: selectedRate.courseRateId,
        rackPrice: rackPrice,
        patternDiscount: patternDiscount,
        costToMember: parseFloat(costToMember.toFixed(2)),
        billingRate: parseFloat(billingRate.toFixed(2)),
        billingAmount: billingAmount,
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalDebitAmount: roundedTotal,
        roundedAmount: roundingDiff,
        membershipMasterId: selectedRate.membershipMasterId,
      }));
    }
  }, [
    selectedRate,
    values.dnOrDiscount,
    values.dnAccountId,
    values.billingDaysSessions,
    values.permittedDays,
    values.processingCharge
  ]);

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
          const selectedCourse = allCourse.find(c => c.courseId === prev.courseId);
          const daysInWeek = selectedCourse?.noOfDaysInWeek || 0;
          const X = Number(finalValue) * daysInWeek;
          updates.permittedDays = X;
          setSelectedNoOfDays(X);
          setEnableCourseView(true);
          if (prev.attendingStartDate && X > 0) {
            const startDate = new Date(prev.attendingStartDate);
            if (!isNaN(startDate.getTime())) {
              const calculatedEndDate = addDays(startDate, X - 1);
              updates.endDate = format(calculatedEndDate, "yyyy-MM-dd");
            }
          }
        }
        if (field === "attendingStartDate" && (pattern === "unit" || pattern === "school")) {
          const newStart = new Date(value);
          const fixedEnd = new Date(prev.endDate as string);

          if (!isNaN(newStart.getTime()) && !isNaN(fixedEnd.getTime())) {
            const diffTime = fixedEnd.getTime() - newStart.getTime();
            const newPermitted = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            updates.permittedDays = newPermitted;
            setSelectedNoOfDays(newPermitted);
          }
        }
        return { ...prev, ...updates };
      });
    },
    [setEnableCourseView, setSelectedNoOfDays, setActualDaysInWeek, onFilterChange]
  );

  useEffect(() => {
    setTransactionData({
      amount: values.totalDebitAmount
    })
  }, [values.totalDebitAmount]);

  const handleFinalSubmit = () => {
    const submissionData = {
      ...values,
      processingCharge: (values?.processingCharge ?? 0) + (values?.roundedAmount ?? 0),
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
      disabled: ["day", "unit"].includes(values.chargingPattern?.toLowerCase() as string)
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
    {
      name: "membersEnrolled",
      label: "Members Enrolled",
      type: "number",
      disabled: values.chargingPattern?.toLowerCase() !== "school"
    },
    { name: "dnOrDiscount", label: "Discount / DN", type: "number" },
    {
      name: "dnAccountId",
      label: "DN Account",
      type: "select",
      options: availableEntities.map((e) => ({ label: e.name, value: e.id })),
    },
    { name: "billingRate", label: "Billing Rate", type: "number", disabled: true },
    { name: "rackPrice", label: "Rack Price", type: "number", disabled: true },
    { name: "costToMember", label: "Cost To Member", type: "number", disabled: true },
    { name: "billingAmount", label: "Billing Amount", type: "number", disabled: true },
    { name: "roundedAmount", label: "Rounding", type: "number", disabled: true },
    { name: "cgstAmount", label: "CGST (9%)", type: "number", disabled: true },
    { name: "sgstAmount", label: "SGST (9%)", type: "number", disabled: true },
    { name: "totalDebitAmount", label: "Total Debit Amount", type: "number", disabled: true },
    { name: "processingCharge", label: "Processing Charge", type: "number" },
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
    <>
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
          <Button className="ml-5" onClick={() => { setPaymentFormOpen(true) }}>Open Payment</Button>
        </div>
        <FormFooter onClose={() => setValues({})} onSubmit={handleFinalSubmit} submitLabel="Complete Enrollment" isSubmitting={false} />
      </div>
      {values.totalDebitAmount && <TransactionFormModal
        isOpen={paymentFormOpen}
        initialData={transactionData as any}
        onClose={() => {
          setPaymentFormOpen(false);
        }}
        onSave={handleAddTransactionDetailsa}
      />}
    </>

  );
};

export default EnrollmentFormNew;