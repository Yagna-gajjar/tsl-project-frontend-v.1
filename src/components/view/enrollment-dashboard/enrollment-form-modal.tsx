import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";

import type { Enrollment } from "@/types/enrollment";
import type { Response } from "@/types/response";
import type { Activity } from "@/types/activity";
import type { Course } from "@/types/course";
import type { Member } from "@/types/member";
import type { Entity } from "@/types/entity";

import { getMembers } from "@/api/member.api";
import { getActivities } from "@/api/activity.api";
import { getCourses } from "@/api/course.api";
import { getEntities } from "@/api/entity.api";
import { createEnrollment } from "@/api/enrollment.api";

import { toast } from "@/hooks/use-toast";
import { getCourseRates } from "@/api/courseRate.api";
import type { CourseRate } from "@/types/courseRate";

type Props = {
  setRateTableData: any;
};

const EnrollmentFormNew = ({ setRateTableData }: Props) => {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [courseRateOption, setCourseRateOption] = useState<CourseRate[]>([]);
  const memberName = "djfv"
  const [values, setValues] = useState<Enrollment>({
    enrollmentId: 0,
    firstEnrollmentId: 0,
    enrollmentNo: 0,
    enrollmentDate: format(new Date(), "yyyy-MM-dd"),
    membershipMasterId: 0,
    membershipId: 0,
    accountId: 0,
    memberId: 0,
    memberName: memberName,
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

  const WEEK_DAYS = useMemo(
    () => [
      { label: "Monday", value: 1 },
      { label: "Tuesday", value: 2 },
      { label: "Wednesday", value: 3 },
      { label: "Thursday", value: 4 },
      { label: "Friday", value: 5 },
      { label: "Saturday", value: 6 },
      { label: "Sunday", value: 7 },
    ],
    []
  );

  const daysArrayToNumber = (days: number[]) => {
    return Number(days.sort((a, b) => a - b).join(""));
  };

  useEffect(() => {
    const loadInit = async () => {
      try {
        const [mRes, aRes, eRes]: [
          Response<Member[]>,
          Response<Activity[]>,
          Response<Entity[]>
        ] = await Promise.all([
          getMembers(),
          getActivities({ limit: 100 }),
          getEntities({ limit: 1000 }),
        ]);

        setMembers(mRes?.data || []);
        setActivities(aRes?.data || []);
        setEntities(eRes?.data || []);
      } catch {
        setError("Failed to load initial data");
      }
    };

    loadInit();
  }, []);

  useEffect(() => {
    if (!values.academyEntityId) return;

    const loadCourses = async () => {
      try {
        const res: Response<Course[]> = await getCourses({
          activityId: values.activityId,
          entityId: values.academyEntityId,
        });
        setCourses(res?.data || []);
      } catch {
        setError("Failed to load courses");
      }
    };

    loadCourses();
  }, [values.academyEntityId]);

  

  useEffect(() => {
    const loadCourseRate = async () => {
      const res: Response<CourseRate[]> = await getCourseRates({
        courseId: values.courseId,
      });
      const data = res?.data as CourseRate[];
      setCourseRateOption(data);
    };
    loadCourseRate();
  }, [values.courseId]);

  const onChange = useCallback((field: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubmit = async () => {
    try {
      const payload = {
        ...values,
        attendingPattern: daysArrayToNumber(values.attendingPattern),
      };

      const res: Response<Enrollment> = await createEnrollment(payload);

      if (res.success) {
        toast({
          title: "Success",
          description: "Enrollment created successfully",
          variant: "success",
        });
        navigate("/enrollment");
      } else {
        setError("Failed to create enrollment");
      }
    } catch (err) {
      console.error(err);
      setError("Enrollment creation failed");
    }
  };

  const fields = [
    {
      name: "memberName",
      label: "Member Name",
      type: "select"
    },
    {
      name: "enrollmentDate",
      label: "Enrollment Date",
      type: "Date",
      disabled: true,
    },
    {
      name: "activityId",
      label: "Activity",
      require: true,
      type: "select",
      options: activities?.map((a) => ({
        value: a.activityId,
        label: a.activityName,
      })),
    },
    {
      name: "permittedDays",
      label: "Permited Days",
      type: "number",
      require: true,
    },
    {
      name: "attendingStartDate",
      label: "Attending Start Date",
      type: "Date",
      require: true,
    },
    {
      name: "endDate",
      label: "End Date",
      type: "Date",
      require: true,
      disabled: true,
    },
    {
      name: "membersEnrolled",
      label: "Members Enrolled",
      type: "number",
    },
    {
      name: "academyEntityId",
      label: "Academy Entity",
      type: "select",
      options: entities?.map((e) => ({
        value: e.entityId,
        label: e.entityName,
      })),
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      options: courses?.map((c) => ({
        value: c.courseId,
        label: c.courseName,
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
      options: courseRateOption?.map((c) => ({
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
      <div className="overflow-auto">
        <h1 className="text-center text-blue-600 font-bold text-2xl py-2">
          Enrollment Details
        </h1>

        <FormContent
          fields={fields as any}
          values={values as any}
          errors={{}}
          loading={false}
          error={error}
          isSubmitting={false}
          onChange={onChange as any}
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
