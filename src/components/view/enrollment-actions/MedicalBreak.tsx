import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getEnrollmentById } from "@/api/enrollment.api";
import type { Response } from "@/types/response";
import type { Enrollment } from "@/types/enrollment";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import {
  format,
  parseISO,
  addDays,
  isDate,
  isValid,
  differenceInDays,
  differenceInCalendarDays,
} from "date-fns";
import type { Activity } from "@/types/activity";
import type { Academy } from "@/types/academy";
import type { Course } from "@/types/course";
import { getAcademies } from "@/api/academy.api";
import { getCourses } from "@/api/course.api";
import { getActivities } from "@/api/activity.api";
import { toast } from "@/hooks/use-toast";
import { enrollmentChange } from "@/api/enrollmentActions.api";

const FREE_DAYS = 45; // medical break fixed free days

const MedicalBreak = () => {
  const { id }: any = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const [oldEnrollment, setOldEnrollment] = useState<Enrollment>();
  const [fieldErrors] = useState<any>({});
  const [isSubmitting] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [activity, setActivity] = useState<Activity[]>([]);
  const [academy, setAcademy] = useState<Academy[]>([]);
  const [course, setCourse] = useState<Course[]>([]);
  const [values, setValues] = useState<Enrollment>({
    enrollmentId: Number(id),
    memberId: oldEnrollment?.memberId || 0,
    academyId: 0,
    adjustment: 0,
    batchId: 0,
    billingAmount: 0,
    billingRate: 0, // fixed 0 for medical break
    cndn: 0,
    commitedAmount: 0, // fixed 0 for medical break
    courseId: 0,
    discountedAmount: 0,
    discountId: 0,
    endDate: "" as any,
    enrollmentDate: format(Date.now(), "yyyy-MM-dd") as any,
    freeDays: 0,
    numberOfDays: FREE_DAYS,
    openEnrollment: false,
    sessionUnits: 0,
    startDate: format(new Date(), "yyyy-MM-dd") as any,
    status: "active",
    processingCharge: 0,
    changeType: "Medical Break",
    oldEnrollmentId: null,
  });

  const onClose = () => {
    setValues({} as any);
  };

  const handleSubmit = async () => {
    try {
      const res: Response<Enrollment | any> = await enrollmentChange(values);
      if (res.success) {
        toast({
          title: "Success",
          description: "Freezing successfully",
          variant: "success",
        });
        navigate("/enrollment");
      }
    } catch (err: any) {
      setError("Failed to submit!");
      toast({
        title: "Error",
        description: err?.message ? err.message : "Freezing Failed",
        variant: "destructive",
      });
    }
  };

  function addDaysToDate(
    startISO: string | Date | null | undefined,
    daysToAdd: number
  ): string | null {
    if (startISO == null) return null;

    let startDate: Date;
    if (isDate(startISO)) {
      startDate = startISO as Date;
    } else if (typeof startISO === "string") {
      startDate = parseISO(startISO);
      if (!isValid(startDate)) startDate = new Date(startISO);
    } else {
      console.error("addDaysToDate: unsupported startISO type:", startISO);
      return null;
    }

    if (!isValid(startDate)) {
      console.error(
        "addDaysToDate: startDate is invalid after parsing:",
        startISO
      );
      return null;
    }

    if (typeof daysToAdd !== "number" || Number.isNaN(daysToAdd)) {
      console.error(
        "addDaysToDate: daysToAdd is not a valid number:",
        daysToAdd
      );
      return null;
    }

    const newDate = addDays(startDate, daysToAdd);

    if (!isValid(newDate)) {
      console.error(
        "addDaysToDate: result date is invalid:",
        startDate,
        daysToAdd
      );
      return null;
    }

    return format(newDate, "yyyy-MM-dd");
  }

  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        const response: Response<Enrollment | any> = await getEnrollmentById(
          id
        );
        const data = response?.data;
        if (data) setOldEnrollment(data);
        setValues((prev) => ({
          ...prev,
          oldEnrollmentId: data?.enrollmentId ?? prev.oldEnrollmentId,
          memberId: data?.memberId ?? prev.memberId,
        }));
      } catch (err) {
        setError("Failed to fetch enrollment details");
      }
    };

    const fetchActivities = async () => {
      try {
        const res: Response<Activity[] | any> = await getActivities({
          limit: 100,
          activityName: "Medical Break",
        });
        const data = Array.isArray(res?.data) ? res.data : [];
        if (data.length > 0) {
          setValues((prev: any) => ({
            ...prev,
            activityName: Number(data[0].activityId),
          }));
          setSelectedActivity(data[0].activityName || "");
        }
        setActivity(data as any);
      } catch (err) {
        setError("Failed to fetch activities!");
      }
    };

    const fetchAcademies = async () => {
      try {
        const res: Response<Academy[]> | any = await getAcademies({
          limit: 100,
          search: "Medical Break",
        });
        const data = Array.isArray(res?.data) ? res.data : [];
        if (data.length > 0) {
          setValues((prev) => ({
            ...prev,
            academyId: Number(data[0].academyId),
          }));
        }
        setAcademy(data as any);
      } catch (err) {
        setError("Failed to fetch academies!");
      }
    };
    const fetchCourse = async () => {
      try {
        const res: Response<Academy[]> | any = await getCourses({
          limit: 100,
          search: "Medical Break",
        });
        const data = Array.isArray(res?.data) ? res.data : [];
        if (data.length > 0) {
          setValues((prev) => ({
            ...prev,
            courseId: Number(data[0].courseId),
          }));
        }
        setCourse(data as any);
      } catch (err) {
        setError("Failed to fetch academies!");
      }
    };

    fetchEnrollment();
    fetchActivities();
    fetchAcademies();
    fetchCourse();
  }, [id]);

  useEffect(() => {
    if (!oldEnrollment?.startDate || !values.startDate) return;

    const oldStart = parseISO(String(oldEnrollment.startDate));
    const newStart = parseISO(String(values.startDate));

    const diffDays =
      differenceInCalendarDays(newStart, oldStart) > 0
        ? differenceInCalendarDays(newStart, oldStart)
        : 0;
    console.log(diffDays);

    const newCommittedAmount =
      diffDays * Number(oldEnrollment.billingRate ?? 0);

    setValues((prev) => ({
      ...prev,
      commitedAmount: oldEnrollment.commitedAmount - newCommittedAmount,
    }));
  }, [values.startDate, oldEnrollment]);

  // Whenever startDate changes, set endDate = startDate + FREE_DAYS
  useEffect(() => {
    if (!values?.startDate) return;

    const newEnd = addDaysToDate(values.startDate, FREE_DAYS);
    setValues((prev: any) => ({
      ...prev,
      endDate: newEnd,
      numberOfDays: FREE_DAYS,
      billingRate: 0,
    }));
  }, [values.startDate]);

  // If academy changes we still load courses for that academy
  useEffect(() => {
    if (!values?.academyId) return;

    const loadCourses = async () => {
      try {
        const res: Response<Course> | any = await getCourses({
          academyId: values.academyId,
        });
        setCourse(res?.data || []);
      } catch {
        setError("Failed to load courses.");
      }
    };

    loadCourses();
  }, [values?.academyId]);

  const fields = [
    {
      name: "enrollmentDate",
      label: "Enrollment Date",
      type: "Date",
      required: true,
    },
    {
      name: "startDate",
      label: "Start Date",
      type: "Date",
      required: true,
    },
    {
      name: "endDate",
      label: "End Date",
      type: "Date",
      required: false,
      disabled: true,
    },
    {
      name: "activityName",
      label: "Activity Name",
      type: "select",
      options: activity.map((e) => ({
        label: e.activityName,
        value: Number(e.activityId),
      })),
      required: true,
    },
    {
      name: "academyId",
      label: "Academy",
      type: "select",
      options: academy.map((e) => ({
        label: e.academyName,
        value: Number(e.academyId),
      })),
      required: true,
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      options: course.map((e) => ({
        label: e.courseName,
        value: Number(e.courseId),
      })),
      required: true,
    },
    {
      name: "billingAmount",
      label: "Remaining Amount",
      type: "number",
      disabled: true,
    },
    {
      name: "processingCharge",
      label: "Processing Charge",
      type: "number",
    },
    {
      name: "sessionUnits",
      label: "Session Units",
      type: "number",
      required: false,
    },
    {
      name: "numberOfDays",
      label: "Number Of Days",
      type: "number",
      required: false,
      disabled: true,
    },
    {
      name: "commitedAmount",
      label: "Commited Amount",
      type: "number",
      required: true,
      disabled: true,
    },
    {
      name: "billingRate",
      label: "Billing Rate",
      type: "number",
      disabled: true,
    },
    {
      name: "remarks",
      label: "Remarks",
      type: "textarea",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Completed", value: "completed" },
      ],
      required: true,
    },
  ];

  const onChange = (field: string, value: any) => {
    const numFields = [
      "academyId",
      "memberId",
      "courseId",
      "numberOfDays",
      "freeDays",
    ];

    if (numFields.includes(field)) {
      value = Number(value);
    }

    if (field === "activityName") {
      const data = activity.find((e) => e.activityId === Number(value));
      setSelectedActivity(data?.activityName || "");
    }

    setValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col max-h-[90vh] overflow-hidden">
      <div className="overflow-auto">
        <FormContent
          fields={fields as any}
          values={values as any}
          errors={fieldErrors}
          loading={false}
          error={error}
          isSubmitting={isSubmitting}
          onChange={onChange as any}
          layout="grid"
        />
      </div>

      <FormFooter
        onClose={onClose}
        onSubmit={handleSubmit}
        submitLabel="Create"
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default MedicalBreak;
