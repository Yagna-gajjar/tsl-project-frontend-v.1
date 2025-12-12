import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getEnrollmentById } from "@/api/enrollment.api";
import type { Response } from "@/types/response";
import type { Enrollment } from "@/types/enrollment";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import {
  format,
  differenceInCalendarDays,
  parseISO,
  addDays,
  isDate,
} from "date-fns";
import type { Course } from "@/types/course";
import { getCourseById } from "@/api/course.api";
import { getBatch } from "@/api/batch.api";
import type { Batch } from "@/types/batch";
import { enrollmentChange } from "@/api/enrollmentActions.api";

const DefreezeEnrollment = () => {
  const { id }: any = useParams();
  const [error, setError] = useState<string>("");
  const [oldEnrollment, setOldEnrollment] = useState<Enrollment>();
  const [fieldErrors] = useState<any>({});
  const [isSubmitting] = useState<boolean>(false);
  const [course, setCourse] = useState<Course>();
  const [lastEnrollment, setLastEnrollment] = useState<Enrollment | any>();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [values, setValues] = useState<Enrollment>({
    enrollmentId: Number(id),
    memberId: oldEnrollment?.memberId || 0,
    academyId: 0,
    academyName: "",
    activityName: "",
    courseName: "",
    adjustment: 0,
    batchId: 0,
    billingAmount: 0,
    billingRate: 0,
    cndn: 0,
    commitedAmount: 0,
    courseId: 0,
    discountedAmount: 0,
    discountId: 0,
    endDate: 0 as any,
    enrollmentDate: format(Date.now(), "yyyy-MM-dd") as any,
    freeDays: 0,
    numberOfDays: 0,
    openEnrollment: false,
    sessionUnits: 0,
    startDate: format(new Date(), "yyyy-MM-dd") as any,
    status: "active",
    processingCharge: 0,
    changeType: "Defreeze",
  });
  const onClose = () => {
    setValues({} as any);
  };

  const handleSubmit = async () => {
    try {
      await enrollmentChange(values);
      navigate("/enrollment");
    } catch (err) {
      setError("Failed to submit!");
    }
  };
  function calculateDays(startISO?: any, endISO?: any, inclusive = false) {
    if (!startISO || !endISO) return 0; // or return null, throw error, etc.
    // Extract only the date part (yyyy-mm-dd)
    const startDate = parseISO(startISO.slice(0, 10));
    const endDate = parseISO(endISO.slice(0, 10));

    let diff = differenceInCalendarDays(endDate, startDate);
    diff -= 1;
    if (inclusive) diff += 1;
    return diff;
  }
  function addDaysToDate(
    startISO: string | Date | null | undefined,
    daysToAdd: number
  ) {
    if (!startISO) return null;

    let startDate: any;

    if (isDate(startISO)) {
      startDate = startISO;
    } else if (typeof startISO === "string") {
      const dateOnly = startISO.slice(0, 10);
      startDate = parseISO(dateOnly);
    } else {
      console.error("Invalid date format:", startISO);
      return null;
    }

    const newDate = addDays(startDate, daysToAdd);

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
      } catch (err) {
        setError("Failed to fetch enrollment details");
      }
    };

    fetchEnrollment();
  }, [id]);

  useEffect(() => {
    if (!oldEnrollment?.oldEnrollmentId) return;

    let mounted = true;

    const fetchCourse = async (id: number) => {
      try {
        const res: Response<Course> = await getCourseById(id);
        if (!mounted) return;
        setCourse(res?.data || {} as Course);
        setValues((prev) => ({
          ...prev,
          activityName: res?.data!.activityName || "",
        }));
        return res.data;
      } catch (err) {
        console.error("fetchCourse error:", err);
        if (mounted) setError("Failed to fetch course");
        throw err;
      }
    };

    const fetchOldEnrollmentAndBatches = async () => {
      try {
        const response: Response<Batch[] | any> = await getEnrollmentById(Number(oldEnrollment.oldEnrollmentId));
        const data = response?.data;
        if (!data) {
          setError("No enrollment data returned");
          return;
        }

        if (!mounted) return;
        setLastEnrollment(data);

        // ensure courseId exists
        if (!data.courseId && data.courseId !== 0) {
          console.error("Missing courseId on enrollment data:", data);
          setError("Missing courseId in enrollment");
          return;
        }

        try {
          await fetchCourse(Number(data.courseId));
        } catch (err) {
        }

        setValues((prev) => ({
          ...prev,
          activityName: data.activityName || "",
          academyName: data.academyName || "",
          courseName: data.courseName || "",
          courseId: data.courseId,
          batchId: data.batchId,
          academyId: data.academyId,
        }));

        // --- Attempt to fetch batches. Try the two most common argument shapes ---
        try {
          let batchRes;

          // Try object param first
          try {
            batchRes = await getBatch({ courseId: data.courseId });
          } catch (errObj) {
            console.warn(
              "getBatch(object) failed, trying primitive id. error:",
              errObj
            );
            // Try primitive param fallback
            batchRes = await getBatch({
              courseId: Number(data.courseId)
            });
          }

          const batchesData = batchRes?.data ?? [];
          if (mounted) setBatches(batchesData);
        } catch (err) {
          console.error("Failed to load batches:", err);
          if (mounted) setError("Failed to load batches.");
        }

      } catch (err) {
        console.error("fetchOldEnrollmentAndBatches error:", err);
        if (mounted) setError("Failed to fetch enrollment details");
      }
    };

    fetchOldEnrollmentAndBatches();

    return () => {
      mounted = false;
    };
  }, [oldEnrollment]);

  useEffect(() => {
    if (!course?.courseId) return;

    const finalAmount = values?.billingAmount - (values?.processingCharge || 0);

    const { days, adjust } = AdjustDays(finalAmount / course.unitRate);

    const endDate = addDaysToDate(new Date(values?.startDate), days);
    setValues((prev: any) => ({
      ...prev,
      billingRate: Number(course.unitRate),
      commitedAmount: Number(days * course.unitRate),
      numberOfDays: days,
      discountedAmount: 0,
      adjustment: Number(adjust * course.unitRate),
      endDate: endDate,
    }));
  }, [values?.courseId, values?.processingCharge, values?.billingAmount]);

  const AdjustDays = (days: number) => {
    const roundedDays = Math.floor(days);
    const newAdjust = Math.abs(roundedDays - days);

    return {
      days: Number(roundedDays.toFixed(2)),
      adjust: Number(newAdjust.toFixed(2)),
    };
  };

  useEffect(() => {
    if (!values?.endDate) return;
    const newEndDate = addDaysToDate(
      values?.startDate,
      values?.freeDays + values?.numberOfDays
    );
    setValues((prev: any) => ({
      ...prev,
      endDate: newEndDate,
    }));
  }, [values?.freeDays]);

  useEffect(() => {
    if (!values?.startDate || !oldEnrollment) return;

    setValues((prev: any) => ({
      ...prev,
      memberId: oldEnrollment?.memberId,
    }));

    const diff = calculateDays(oldEnrollment?.startDate, values.startDate);

    const usedAmount = oldEnrollment?.billingRate * (diff + 1);

    const remaining = oldEnrollment?.billingAmount - usedAmount;

    setValues((prev) => ({
      ...prev,
      billingAmount: remaining,
    }));
  }, [values.startDate, oldEnrollment]);

  const fields = [
    {
      name: "enrollmentDate",
      label: "Enrollment Date",
      type: "date",
      required: true,
    },
    {
      name: "startDate",
      label: "Start Date",
      type: "date",
      required: true,
    },
    {
      name: "endDate",
      label: "End Date",
      type: "date",
      required: false,
      disabled: true,
    },
    {
      name: "activityName",
      label: "Activity Name",
      type: "text",
      required: true,
    },
    {
      name: "academyName",
      label: "Academy",
      type: "text",
      required: true,
    },
    {
      name: "courseName",
      label: "Course",
      type: "text",
      required: true,
    },
    {
      name: "batchId",
      label: "Batch",
      type: "select",
      required: true,
      options: batches.map((b) => ({
        value: b.batchId,
        label: b.batchName,
      })),
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
    // {
    // 	name: "discountedAmount",
    // 	label: "Discounted Amount",
    // 	type: "number",
    // 	required: false,
    // 	disabled: true,
    // },
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
      name: "adjustment",
      label: "Adjustment",
      type: "number",
      disabled: true,
    },
    // {
    // 	name: "discountId",
    // 	label: "Discount ID",
    // 	type: "number",
    // 	required: false,
    // 	disabled: true
    // },
    // {
    // 	name: "isDiscounted",
    // 	label: "Do you want to remove applied discount?",
    // 	type: "checkbox",
    // 	required: false,
    // },
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

export default DefreezeEnrollment;
