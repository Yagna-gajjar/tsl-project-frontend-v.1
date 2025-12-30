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
import { Button } from "@/components/ui/button";
import EnrollmentReceiptModal from "../transaction/transaction-form";
import { createEnrollment } from "@/api/enrollment.api";
import type { Response } from "@/types/response";
import { getAuthorities } from "@/api/authority.api";
import type { Authority } from "@/types/authority";
import { useAuth } from "@/contexts/authContext";
import type { FormFieldConfig } from "@/components/form-modal/types";

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
    status: "created",
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
    attendingPattern: [],
    walkingContact: "",
    costToMember: 0,
    memberApprovalStatus: null,
    academyApprovalStatus: null,
    finalTSLApproval: null,
  });

  const { user } = useAuth();

  const [options, setOptions] = useState({
    members: [] as Member[],
    activities: [] as Activity[],
    batches: [] as Batch[],
    activityClassification: [] as Enums[],
    activityTypes: [] as Enums[],
    visibility: [] as Enums[],
  });

  const [pagination, setPagination] = useState({
    member: { page: 1, hasMore: true, loading: false },
    activity: { page: 1, hasMore: true, loading: false },
  });

  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
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

  const selectedCourse = useMemo(() =>
    filteredCourses.find((c) => c.courseId === values.courseId),
    [values.courseId, filteredCourses]
  );

  useEffect(() => {
    if (values.courseId) {
      // 1. Fetch new rates
      getCourseRates({ courseId: values.courseId, limit: 1000 }).then((res) => {
        if (res?.data) setRateTableData(res.data);
      });

      const resetFinancials = {
        rackPrice: 0, patternDiscount: 0, dnOrDiscount: 0, billingDaysSessions: 0,
        billingRate: 0, billingAmount: 0, cgstAmount: 0, sgstAmount: 0,
        totalDebitAmount: 0, roundedAmount: 0, costToMember: 0,
        processingCharge: 0, courseRateId: 0,
      };

      if (selectedCourse) { // Using the memo here
        const pattern = String(selectedCourse.chargingPattern || "").toLowerCase();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let updates: any = {
          ...resetFinancials,
          attendingPattern: String(selectedCourse.daysPattern || "").split(""),
          attendingPatternDays: selectedCourse.noOfDaysInWeek,
          chargingPattern: selectedCourse.chargingPattern,
        };

        if (pattern === "unit" || pattern === "school") {
          const introDate = new Date(selectedCourse.introduceDate);
          const suspDate = new Date(selectedCourse?.suspensionDate as any);
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

        setActualDaysInWeek(selectedCourse.noOfDaysInWeek);
        setSelectedCourseDayInWeek(selectedCourse.noOfDaysInWeek);
        setValues((prev: any) => ({ ...prev, ...updates }));
      } else {
        setValues((prev: any) => ({ ...prev, ...resetFinancials }));
      }
    }
  }, [values.courseId, selectedCourse]);

  const getVisibilityValueByName = (name: string): boolean => {
    const item = options.visibility.find(
      (v) => v.value.toLowerCase() === name.toLowerCase()
    );
    return Boolean(item?.enumCase);
  };

  const fetchBaseOptions = useCallback(
    async (type: "member" | "activity", isInitial = false, search = "") => {
      const current = pagination[type];
      if (current.loading || (!current.hasMore && !isInitial && !search)) return;
      setPagination((prev) => ({ ...prev, [type]: { ...prev[type], loading: true } }));
      try {
        const page = isInitial ? 1 : current.page;
        const res =
          type === "member"
            ? await getMembers({ limit: PAGE_SIZE, page, search, status: getVisibilityValueByName("member") == false ? "active" : "inactive" })
            // Use 'classification' as the key if that's what your API expects for Activity Type
            : await getActivities({ limit: PAGE_SIZE, page, search, activityType: values.activityType ?? undefined });

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
    [pagination, values.activityType, options.visibility] // Added dependencies
  );

  useEffect(() => {
    getEnumsByCategory("ACTIVITY STATUS").then((res) => setOptions((p) => ({ ...p, activityClassification: res?.data || [] })));
    getEnumsByCategory("ACTIVITY TYPE").then((res) => setOptions((p) => ({ ...p, activityTypes: res?.data || [] })));
    getEnumsByCategory("STATUSVISIBLE").then((res) => setOptions((p) => ({ ...p, visibility: res?.data || [] })));
    fetchBaseOptions("activity", true);
    setTimeout(() => {
      if (user) {
        setValues((prev) => ({
          ...prev,
          createdBy: Number(user.memberId),
        }));
      }
    }, 200);
  }, []);

  useEffect(() => {
    if (values.activityType) {
      getCourses({
        classification: values.activityType,
        limit: 10000,
        suspenspedCourse: getVisibilityValueByName("course")
      }).then((res) => {
        if (res.success) setAllCourse(res?.data || []);
        else toast({ title: "Error", description: "Failed to load courses", variant: "destructive" });
      });

      fetchBaseOptions("activity", true);
      setValues(prev => ({ ...prev, activityId: undefined }));
    }
  }, [values.activityType, values.activityClassification]);

  useEffect(() => {
    if (!memberSearch.trim()) return;
    const timer = setTimeout(async () => {
      setMemberLoading(true);
      try {
        const res = await getMembers({ search: memberSearch, limit: 10, page: 1, status: getVisibilityValueByName("member") == false ? "active" : "inactive" });
        setOptions((prev) => ({ ...prev, members: res?.data || [] }));
      } finally {
        setMemberLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  useEffect(() => {
    const { activityId, academyEntityId, attendingPattern, startTime, courseId } = values;

    const selectedCourse = allCourse.find(c => c.courseId === courseId);
    const patternStr = Array.isArray(attendingPattern) ? attendingPattern.sort().join("") : attendingPattern;

    if (activityId && academyEntityId && patternStr && patternStr.length > 0 && startTime && selectedCourse) {

      const [startHours, startMins] = startTime.split(":").map(Number);
      const sessionMinutes = selectedCourse.sessionMinutes || 0;

      const totalMinutes = (startHours * 60) + startMins + sessionMinutes;
      const endHours = Math.floor(totalMinutes / 60) % 24; // Use % 24 to handle midnight wrap
      const endMins = totalMinutes % 60;

      const formattedEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      getBatch({
        activityId,
        entityId: academyEntityId,
        daysPattern: patternStr,
        startTime: String(startTime),
        endTime: formattedEndTime,
        limit: 1000,
        status: getVisibilityValueByName("batch") ? "inactive" : "active"
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
    const fetchMemberAuthority = async () => {
      try {
        const res: Response<Authority[]> = await getAuthorities({
          accountId: values.accountId,
          active: true
        });
        if (res?.data) {
          const authority = res.data[0];
          setValues((prev) => ({
            ...prev,
            memberApprovalStatus: authority?.memberId ?? null,
          }));
        }
      } catch {
        toast({ title: "Error", description: "Failed to load member authority", variant: "destructive" });
      }
    }

    if (values.accountId) {
      fetchMemberAuthority();
    }
  }, [values.accountId]);

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
    const selectedCourse = allCourse.find(c => c.courseId === values.courseId);

    if (selectedRate && selectedCourse && values.billingDaysSessions && values.billingDaysSessions > 0) {

      const cgstRate = Number(selectedCourse?.cgstRate) ?? 0;
      const sgstRate = Number(selectedCourse?.sgstRate) ?? 0;

      const rackPrice = parseFloat(selectedRate.unitRate) || 0;
      const patternDiscount = parseFloat(selectedRate.patternDiscount) || 0;
      const dnOrDiscount = Number(values.dnOrDiscount) || 0;
      const processingCharge = Number(values.processingCharge) || 0;
      const billingDaysSessions = Number(values.billingDaysSessions) || 1;
      const membersEnrolled = Number(values.membersEnrolled) || 1;
      const hasDnAccount = values.dnAccountId !== null && values.dnAccountId !== 0;

      let baseRateD = 0;
      if (!hasDnAccount) {
        baseRateD = (rackPrice * patternDiscount) - (dnOrDiscount / billingDaysSessions);
      } else {
        baseRateD = (rackPrice * patternDiscount);
      }
      const A = ((baseRateD * billingDaysSessions) + processingCharge);
      const B = 100 + sgstRate + cgstRate;
      const C = A * (B / 100);
      const X = Math.ceil(C);
      const E = X - C;
      const roundedAmount = ((100 * E) / B);
      const billingRate = baseRateD;
      const costToMember = ((rackPrice * patternDiscount) - (dnOrDiscount / billingDaysSessions));
      const billingAmount = billingRate * billingDaysSessions * membersEnrolled;
      const cgstAmount = (billingAmount + processingCharge + roundedAmount) * (cgstRate / 100);
      const sgstAmount = (billingAmount + processingCharge + roundedAmount) * (sgstRate / 100);
      const totalDebitAmount = (costToMember * billingDaysSessions * membersEnrolled) + cgstAmount + sgstAmount + processingCharge + roundedAmount;

      setValues((prev) => ({
        ...prev,
        courseRateId: selectedRate.courseRateId,
        rackPrice: parseFloat(rackPrice.toFixed(4)),
        patternDiscount: parseFloat(patternDiscount.toFixed(2)),
        roundedAmount: parseFloat(roundedAmount.toFixed(2)),
        billingRate: parseFloat(billingRate.toFixed(2)),
        costToMember: parseFloat(costToMember.toFixed(2)),
        billingAmount: parseFloat(billingAmount.toFixed(2)),
        cgstAmount: parseFloat(cgstAmount.toFixed(2)),
        sgstAmount: parseFloat(sgstAmount.toFixed(2)),
        totalDebitAmount: parseFloat(totalDebitAmount.toFixed(4)),
        membershipMasterId: selectedRate.membershipMasterId,
        membershipId: selectedRate.membershipId,
        accountId: selectedRate.accountId
      }));
    }
  }, [
    selectedRate,
    values.dnOrDiscount,
    values.dnAccountId,
    values.billingDaysSessions,
    values.membersEnrolled,
    values.processingCharge,
    values.courseId,
    allCourse
  ]);

  useEffect(() => {
    if (!options.activityClassification.length) return;

    const courseEnum = options.activityClassification.find(
      (e) => e.value === "Courses"
    );

    if (courseEnum) {
      setValues((prev) => ({
        ...prev,
        activityClassification: courseEnum.enumCase,
      }));
    }
  }, [options.activityClassification]);

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

  const handleFinalSubmit = async () => {
    const submissionData = {
      ...values,
      processingCharge: (values?.processingCharge ?? 0) + (values?.roundedAmount ?? 0),
      attendingPattern: Array.isArray(values.attendingPattern)
        ? Number(values.attendingPattern.sort().join(""))
        : values.attendingPattern,
    };
    console.log(submissionData);
    return;
    try {
      const eRes: Response<Enrollment> = await createEnrollment(submissionData as any);
      if (eRes.success) {
        toast({
          title: "Success",
          description: "Enrollment created successfully"
        });
        setValues({});
      } else {
        throw new Error("Failed to craete Enrollment");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to created Enrollment",
        variant: "destructive"
      })
    }
  };

  const allowedWeekDays = useMemo(() => {
    if (!selectedCourse || !selectedCourse.daysPattern) return ALL_WEEK_DAYS;
    const pattern = String(selectedCourse.daysPattern);
    return ALL_WEEK_DAYS.filter((day) => pattern.includes(String(day.value)));
  }, [selectedCourse]);

  // const currentCgst = Number(selectedCourse?.cgstRate) || 0;
  // const currentSgst = Number(selectedCourse?.sgstRate) || 0;

  const pattern = String(values.chargingPattern || "").toLowerCase();

  const fields: FormFieldConfig<Enrollment>[] = [
    {
      name: "activityClassification",
      label: "Activity Classification",
      type: "select",
      options: options.activityClassification
        .filter(item => item.value !== "System")
        .map(item => ({
          label: item.value,
          value: item.enumCase
        })),
        colSpan: 1,
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
      colSpan: 1,
    },
    {
      name: "activityId",
      label: "Activity",
      type: "select",
      options: options.activities.map((a) => ({ label: a.activityName, value: a.activityId })),
      onSearch: async (query: string) => await fetchBaseOptions("activity", true, query),
      onLoadMore: () => fetchBaseOptions("activity"),
      isLoadingMore: pagination.activity.loading,
      colSpan: 1,
    },
    {
      name: "startTime",
      label: "Desired Start Time",
      type: "time",
      colSpan: 1,
    },
    {
      name: "academyEntityId",
      label: "Services Provider Name",
      type: "select",
      options: availableEntities.map((e) => ({ label: e.name, value: e.id })),
      disabled: !values.activityId,
    },
    {
      name: "courseId",
      label: "Service Identification Code",
      type: "select",
      options: filteredCourses.map((c) => ({
        label: `${c.courseName} [Pattern: ${c.daysPattern || "N/A"}]`,
        value: c.courseId,
      })),
      disabled: !values.activityType || filteredCourses.length === 0,
    },
    {
      name: "attendingPattern",
      label: "Member Will Attend On WeekDays",
      type: "multiselect",
      options: allowedWeekDays,
      description: values.courseId ? "Course restricted days." : "Select course first.",
      colSpan: 2,
    },
    {
      name: "attendingStartDate", label: "Desired Start Date", type: "date", colSpan: 1
    },
    {
      name: "permittedDays",
      label: "Duration(permitted) in Days",
      type: "number",
      hidden: pattern !== "day",
      disabled: pattern !== "day",
      colSpan: 1
    },
    {
      name: "billingDaysSessions",
      label: pattern === "session"
        ? "No of Sessions"
        : (pattern === "unit" || pattern === "school")
          ? "No of Units"
          : "Billing Days/Sessions",
      type: "number",
      hidden: pattern === "day",
      disabled: pattern === "day",
      colSpan: 1
    },
    {
      name: "membersEnrolled",
      label: "Members Being Enrolled",
      type: "number",
      disabled: values.chargingPattern?.toLowerCase() !== "school",
      colSpan: 1
    },
    // {
    //   name: "batchId",
    //   label: "Batch",
    //   type: "select",
    //   disabled: !values.activityId || options.batches.length === 0,
    //   options: options.batches.map((b) => ({ label: `${b.batchName} (${b.startTime} - ${b.endTime})`, value: b.batchId })),
    //   colSpan: "full"
    // },
    {
      name: "dnAccountId",
      label: "DN Account",
      type: "select",
      options: availableEntities.map((e) => ({ label: e.name, value: e.id })),
    },
    {
      name: "dnOrDiscount", label: "Adjustment Amount", type: "number"
    },
    {
      name: "processingCharge", label: "TSL Processing Charges", type: "number"
    },
    {
      name: "walkingName", label: "Walking Name", type: "text"
    },
    {
      name: "walkingContact", label: "Walking Contact", type: "text"
    },
    {
      name: "printRemarks", label: "Enrolment Remarks", type: "text"
    },
    {
      name: "officeRemarks", label: "Internal Remarks", type: "text"
    },
    {
      name: "openEnrollment", label: "Is the Enrolment Open", type: "checkbox"
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Created", value: "created" },
        { label: "BillingComplete", value: "billingComplete" },
        { label: "Draft", value: "draft" },
        { label: "BillGenerated", value: "billGenerated" },
        { label: "History", value: "history" },
        { label: "Locked", value: "locked" },
      ],
    },
  ];

  useEffect(()=>{
    console.log(values.status," status changed");
  },[values.status]);
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
          <FormContent fields={fields} values={values} errors={{}} loading={false} error={null} isSubmitting={false} onChange={onChange} layout="grid" />
          {values.totalDebitAmount != 0 &&
            <Button className="ml-5" onClick={() => { setPaymentFormOpen(true) }}>Pay ({values.totalDebitAmount}) Now</Button>
          }        </div>
        <FormFooter
          onClose={() => setValues({})}
          onSubmit={handleFinalSubmit}
          submitLabel={
            values.status === "created"
              ? "Complete Enrollment"
              : values.status === "draft"
                ? "Save as Draft"
                : `${values.status} enrollment`
          }
          isSubmitting={false}
          disabled={values.totalDebitAmount === 0}
        />

      </div>

      {values.totalDebitAmount && <EnrollmentReceiptModal
        isOpen={paymentFormOpen}
        onClose={() => setPaymentFormOpen(false)}
        setTransactionData={setValues}
        initialData={{
          crEntityId: values.academyEntityId,
          crAccountId: values.accountId,
          crMemberId: values.memberId,
          crMsNo: selectedRate?.membershipId ?? null,
          amount: values.totalDebitAmount,
          crAccountName: selectedRate?.accountName ?? "No Name Found",
          crMemberFirstName: selectedMember?.memberFirstName,
          crMemberLastName: selectedMember?.memberLastName,
        }}
      />}
    </>

  );
};

export default EnrollmentFormNew;