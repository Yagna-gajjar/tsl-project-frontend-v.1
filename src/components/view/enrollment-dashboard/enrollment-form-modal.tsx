import { useEffect, useState, useCallback, useMemo } from "react";
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
import type { Enrollment } from "@/types/enrollment";
import type { Batch } from "@/types/batch";
import type { Response } from "@/types/response";

const ALL_WEEK_DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 7 },
];

const EnrollmentFormNew = ({ setRateTableData }: { setRateTableData: any }) => {
  const [values, setValues] = useState<Partial<Enrollment>>({
    enrollmentDate: format(new Date(), "yyyy-MM-dd"),
    attendingStartDate: format(new Date(), "yyyy-MM-dd"),
    membersEnrolled: 1,
    status: "active",
    openEnrollment: false,
    permittedDays: 0,
  });

  const [memberOptions, setMemberOptions] = useState<any[]>([]);
  const [activityOptions, setActivityOptions] = useState<any[]>([]);
  const [courseOptions, setCourseOptions] = useState<any[]>([]);
  const [entityOptions, setEntityOptions] = useState<any[]>([]);
  const [batchOptions, setBatchOptions] = useState<any[]>([]);

  const [pagination, setPagination] = useState({
    member: { page: 1, hasMore: true, loading: false },
    activity: { page: 1, hasMore: true, loading: false },
    entity: { page: 1, hasMore: true, loading: false },
  });

  const PAGE_SIZE = 20;

  const allowedWeekDays = useMemo(() => {
    const selectedCourse = courseOptions.find(c => c.courseId === values.courseId);
    if (!selectedCourse || !selectedCourse.daysPattern) return ALL_WEEK_DAYS;

    const pattern = String(selectedCourse.daysPattern);
    return ALL_WEEK_DAYS.filter(day => pattern.includes(String(day.value)));
  }, [values.courseId, courseOptions]);

  useEffect(() => {
    if (Array.isArray(values.attendingPattern)) {
      const allowedIds = allowedWeekDays.map(d => Number(d.value));
      const filtered = values.attendingPattern.filter((val: any) => allowedIds.includes(Number(val)));

      if (filtered.length !== values.attendingPattern.length) {
        setValues((prev: any) => ({ ...prev, attendingPattern: filtered }));
      }
    }
  }, [allowedWeekDays, values.attendingPattern]);

  const fetchOptions = useCallback(async (type: 'member' | 'activity' | 'entity', isInitial = false, search = "") => {
    const current = pagination[type];
    if (current.loading || (!current.hasMore && !isInitial && !search)) return;

    setPagination(prev => ({ ...prev, [type]: { ...prev[type], loading: true } }));

    try {
      const page = isInitial ? 1 : current.page;
      let res;
      if (type === 'member') res = await getMembers({ limit: PAGE_SIZE, page, search });
      else if (type === 'activity') res = await getActivities({ limit: PAGE_SIZE, page, search });
      else if (type === 'entity') res = await getEntities({ limit: PAGE_SIZE, page, search });

      const items = res?.data || [];
      if (type === 'member') setMemberOptions(prev => (isInitial || search) ? items : [...prev, ...items]);
      else if (type === 'activity') setActivityOptions(prev => (isInitial || search) ? items : [...prev, ...items]);
      else if (type === 'entity') setEntityOptions(prev => (isInitial || search) ? items : [...prev, ...items]);

      setPagination(prev => ({
        ...prev,
        [type]: { page: page + 1, hasMore: items.length === PAGE_SIZE, loading: false }
      }));
    } catch (err) {
      setPagination(prev => ({ ...prev, [type]: { ...prev[type], loading: false } }));
    }
  }, [pagination]);

  useEffect(() => {
    if (!values.courseId) {
      setRateTableData([]);
      return;
    }
    getCourseRates({ courseId: values.courseId, limit: 10000 }).then(res => {
      if (res?.data) setRateTableData(res.data);
    });
  }, [values.courseId, setRateTableData]);

  useEffect(() => {
    if (values.attendingStartDate && values.permittedDays) {
      const calculatedEndDate = addDays(values.attendingStartDate, Number(values.permittedDays));
      const formatted = format(calculatedEndDate, "yyyy-MM-dd");
      if (values.endDate !== formatted) {
        setValues(prev => ({ ...prev, endDate: formatted }));
      }
    }
  }, [values.attendingStartDate, values.permittedDays, values.endDate]);

  useEffect(() => {
    if (!values.activityId) {
      setCourseOptions([]);
      setBatchOptions([]);
      return;
    }

    getCourses({
      activityId: values.activityId,
      entityId: values.academyEntityId,
      limit: 10000
    }).then(res => {
      setCourseOptions(res?.data || []);
    });

    getBatch({
      activityId: values.activityId,
      entityId: values.academyEntityId,
      limit: 10000
    }).then((res: Response<Batch[]>) => {
      setBatchOptions(res?.data || []);
    });
  }, [values.activityId, values.academyEntityId]);

  useEffect(() => {
    fetchOptions('member', true);
    fetchOptions('activity', true);
    fetchOptions('entity', true);
  }, []);

  const onChange = useCallback((field: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const fields = [
    {
      name: "memberId",
      label: "Member Name",
      type: "select",
      options: memberOptions.map(m => ({ label: `${m.memberFirstName} ${m.memberLastName}`, value: m.memberId })),
      onSearch: (q: string) => fetchOptions('member', true, q),
      onLoadMore: () => fetchOptions('member'),
      isLoadingMore: pagination.member.loading,
    },
    {
      name: "activityId",
      label: "Activity",
      type: "select",
      options: activityOptions.map(a => ({ label: a.activityName, value: a.activityId })),
      onSearch: (q: string) => fetchOptions('activity', true, q),
      onLoadMore: () => fetchOptions('activity'),
      isLoadingMore: pagination.activity.loading,
    },
    {
      name: "academyEntityId",
      label: "Academy Entity",
      type: "select",
      options: entityOptions.map(e => ({ label: e.entityName, value: e.entityId })),
      onSearch: (q: string) => fetchOptions('entity', true, q),
      onLoadMore: () => fetchOptions('entity'),
      isLoadingMore: pagination.entity.loading,
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      disabled: !values.activityId,
      options: courseOptions.map(c => ({
        label: `${c.courseName} [Pattern: ${c.daysPattern || 'N/A'}]`,
        value: c.courseId
      })),
    },
    {
      name: "batchId",
      label: "Batch",
      type: "select",
      disabled: !values.activityId,
      options: batchOptions.map(b => ({
        label: `${b.batchName} (${b.startTime} - ${b.endTime})`,
        value: b.batchId
      })),
    },
    { name: "attendingStartDate", label: "Start Date", type: "date" },
    { name: "permittedDays", label: "Permitted Days", type: "number" },
    { name: "endDate", label: "End Date", type: "date", disabled: true },
    {
      name: "attendingPattern",
      label: "Attending Days",
      type: "multiselect",
      options: allowedWeekDays,
      description: values.courseId ? "Showing only days allowed by the selected course pattern." : "Please select a course first."
    },
    { name: "billingDaysSessions", label: "Sessions", type: "number" },
    { name: "unitRate", label: "Unit Rate", type: "number" },
    { name: "billingRate", label: "Billing Rate", type: "number" },
    { name: "cgstAmount", label: "CGST", type: "number" },
    { name: "sgstAmount", label: "SGST", type: "number" },
    { name: "totalDebitAmount", label: "Total Amount", type: "number" },
    { name: "walkingName", label: "Walk-in Name", type: "text" },
    { name: "walkingContact", label: "Walk-in Contact", type: "text" },
    {
      name: "status", label: "Status", type: "select", options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Cancelled", value: "cancelled" },
      ]
    },
    { name: "openEnrollment", label: "Open Enrollment", type: "checkbox" },
  ];

  const handleSave = () => {
    const finalPattern = Array.isArray(values.attendingPattern)
      ? values.attendingPattern.sort().join('')
      : values.attendingPattern;

    console.log("Saving Enrollment:", { ...values, attendingPattern: finalPattern });
    toast({ title: "Success", description: "Enrollment Prepared for Save" });
  };

  return (
    <div className="flex flex-col w-full h-[80vh] max-w-5xl mx-auto bg-background border rounded-xl overflow-hidden shadow-2xl transition-all">
      <div className="flex-shrink-0 border-b p-6 bg-muted/5">
        <h1 className="text-center text-blue-600 font-bold text-2xl">Enrollment Registration</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
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

      <div className="flex-shrink-0">
        <FormFooter
          onClose={() => { }}
          onSubmit={handleSave}
          submitLabel="Save Enrollment"
          isSubmitting={false}
        />
      </div>
    </div>
  );
};

export default EnrollmentFormNew;