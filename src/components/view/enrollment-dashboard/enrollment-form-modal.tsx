import { useEffect, useState } from "react";

import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";

import type { Academy } from "@/types/academy";
import type { Activity } from "@/types/activity";
import type { Batch } from "@/types/batch";
import type { Course } from "@/types/course";
import type { Member } from "@/types/member";
import type { Enrollment } from "@/types/enrollment";
import type { Discount } from "@/types/discount";
import type { Response } from "@/types/response";

import { getMembers } from "@/api/member.api";
import { getActivities } from "@/api/activity.api";
import { getAcademies } from "@/api/academy.api";
import { getCourses } from "@/api/course.api";
import { getBatch } from "@/api/batch.api";
import { getDiscounts } from "@/api/discount.api";
import { createEnrollment } from "@/api/enrollment.api";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const EnrollmentFormNew = ({
  memberId,
  memberName,
}: {
  memberId: number;
  memberName: string;
}) => {
  const [error, setError] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [academy, setAcademy] = useState<Academy[]>([]);
  const [course, setCourse] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [discount, setDiscount] = useState<Discount>();

  const navigate = useNavigate();

  const [values, setValues] = useState<Enrollment>({
    memberId: Number(memberId),
    memberName: memberName ?? "Not Selected",
    academyId: 0,
    adjustment: 0,
    batchId: 0,
    billingAmount: 0,
    billingRate: 0,
    cndn: 0,
    commitedAmount: 0,
    courseId: 0,
    discountedAmount: 0,
    endDate: 0 as any,
    enrollmentDate: format(Date.now(), "yyyy-MM-dd") as any,
    enrollmentId: 0,
    freeDays: 0,
    numberOfDays: 0,
    openEnrollment: false,
    sessionUnits: 0,
    startDate: format(Date.now(), "yyyy-MM-dd") as any,
    status: "active",
  });

  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<Course>();
  const [debouncedDays, setDebouncedDays] = useState(values.numberOfDays);
  const [debouncedCndn, setDebouncedCndn] = useState(values.cndn);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDays(values.numberOfDays);
    }, 400);

    return () => clearTimeout(handler);
  }, [values.numberOfDays]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCndn(values.cndn);
    }, 400);

    return () => clearTimeout(handler);
  }, [values.cndn]);

  useEffect(() => {
    const loadInit = async () => {
      try {
        const [mRes, aRes]: [Response<Member>, Response<Activity>] | any =
          await Promise.all([
            getMembers(),
            getActivities({
              limit: 100,
            }),
          ]);

        setMembers(mRes?.data || []);
        setActivity(aRes?.data || []);
      } catch {
        setError("Failed to load members or activities.");
      }
    };
    loadInit();
  }, []);

  useEffect(() => {
    setValues((prev) => ({
      ...prev,
      memberName: memberName,
    }));
  }, [memberName]);

  useEffect(() => {
    if (!values?.activityName) return;
    if (!selectedActivity) return;

    const loadAcademies = async () => {
      try {
        const res: Response<Academy> | any = await getAcademies({
          search: selectedActivity,
        });
        setAcademy(res?.data || []);
      } catch {
        setError("Failed to load academies.");
      }
    };

    loadAcademies();
  }, [values?.activityName]);

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

  useEffect(() => {
    if (!values?.courseId) return;

    const c: Course = course.find((c) => c.courseId == values?.courseId)!;
    setSelectedCourse(c);

    const { amount, adjust } = AdjustBillingAmount(
      c.minEnrollmentUnit * c.unitRate
    );
    setValues((prev) => ({
      ...prev,
      numberOfDays: c.minEnrollmentUnit,
      billingRate: c.unitRate,
      billingAmount: c.minEnrollmentUnit * c.unitRate,
      commitedAmount: amount,
      discountedAmount: 0,
      adjustment: adjust,
    }));

    const loadBatches = async () => {
      try {
        const res: Response<Batch[]> | any = await getBatch({
          courseId: values.courseId,
        });

        const allBatches = res?.data || [];

        // Keep only batches where activeMemberCount / batchCapacity < 1
        const filtered = allBatches.filter((batch) => {
          const count = Number(batch.activeMemberCount) || 0;
          const capacity = Number(batch.batchCapacity) || 0;

          // Avoid division by zero
          if (capacity === 0) return false;

          return count / capacity < 1;
        });

        setBatches(filtered);
      } catch (err) {
        setError("Failed to load batches.");
      }
    };

    loadBatches();
    fetchDiscount();
  }, [values?.courseId]);

  // ------------------------------------------------------
  // DISCOUNT APPLY
  // ------------------------------------------------------
  useEffect(() => {
    if (values.isDiscounted) {
      const { amount, adjust } = AdjustBillingAmount(values.billingAmount);
      setValues((prev) => ({
        ...prev,
        discountId: 0,
        discountedAmount: 0,
        commitedAmount: amount,
        adjustment: adjust,
      }));

      return;
    }

    const discountedAmount =
      (values.billingAmount * (discount?.discountPercentage ?? 0)) / 100;
    const { amount, adjust } = AdjustBillingAmount(
      values.billingAmount - discountedAmount
    );
    setValues((prev) => ({
      ...prev,
      discountId: discount?.discountId ?? 0,
      discountedAmount: discountedAmount ?? 0.0,
      commitedAmount: amount,
      adjustment: adjust,
    }));
  }, [discount, values.isDiscounted]);

  useEffect(() => {
    fetchDiscount();
  }, [debouncedDays]);

  useEffect(() => {
    if (!debouncedCndn || debouncedCndn === 0) {
      if (!selectedCourse) return;

      const originalBillingAmount =
        values?.numberOfDays * selectedCourse.unitRate;

      const { amount, adjust } = AdjustBillingAmount(originalBillingAmount);
      setValues((prev) => ({
        ...prev,
        billingRate: selectedCourse.unitRate,
        commitedAmount: amount,
        adjustment: adjust,
      }));

      return;
    }

    if (!discount || !values.numberOfDays || !debouncedCndn) return;

    const unitRate = Number(selectedCourse?.unitRate ?? 0);
    const percentage = Number(discount?.discountPercentage ?? 0);
    const fp = Number(((unitRate * percentage) / 100).toFixed(2));
    const sp = Number((debouncedCndn / values.numberOfDays).toFixed(2));
    const effectiveBillingRate = Number((fp - sp).toFixed(2));

    const { amount, adjust } = AdjustBillingAmount(
      effectiveBillingRate * values?.numberOfDays
    );
    setValues((prev) => ({
      ...prev,
      billingRate: effectiveBillingRate,
      billingAmount: (selectedCourse?.unitRate ?? 0) * values?.numberOfDays,
      commitedAmount: amount,
      adjustment: adjust,
    }));
  }, [debouncedCndn]);

  useEffect(() => {
    if (!values.startDate || !debouncedDays) return;

    const start = new Date(values.startDate);
    const end = new Date(start);

    end.setDate(start.getDate() + Number(debouncedDays));

    setValues((prev: any) => ({
      ...prev,
      endDate: format(end, "yyyy-MM-dd"),
    }));
  }, [values.startDate, debouncedDays]);

  const AdjustBillingAmount = (amount: number) => {
    const roundedAmount = Math.ceil(amount);
    const newAdjust = roundedAmount - amount;

    return {
      amount: Number(roundedAmount.toFixed(2)),
      adjust: Number(newAdjust.toFixed(2)),
    };
  };

  const onChange = (field: string, value: any) => {
    const numFields = [
      "academyId",
      "memberId",
      "courseId",
      "batchId",
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

  const handleSubmit = async () => {
    try {
      const res: Response<Enrollment> = await createEnrollment(values);
      if (res.success) {
        toast({
          title: "Success",
          description: "successfully enrollment",
          variant: "success",
        });
        navigate("/enrollment");
      }
    } catch {
      setError("Failed to make enrollment.");
    }
  };

  const onClose = () => {
    setValues({} as any);
  };

  const fields = [
    {
      name: "memberName",
      label: "Member",
      required: true,
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
      name: "batchId",
      label: "Batch",
      type: "select",
      options: batches.map((b) => {
        // const seatsLeft = b.batchCapacity - b.activeMemberCount;

        // Format times nicely (HH:MM)
        const format = (t: string) => t.slice(0, 5);

        const label = `${b.batchName}  |  ${format(b.startTime)}-${format(
          b.endTime
        )}  |  Seats: ${b.activeMemberCount} / ${b.batchCapacity}`;

        return {
          label,
          value: Number(b.batchId),
        };
      }),

      required: true,
    },
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
      name: "freeDays",
      label: "Free Days",
      type: "number",
      required: false,
      disabled: true,
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
    },
    {
      name: "discountId",
      label: "Discount ID",
      type: "number",
      required: false,
      disabled: true,
    },
    {
      name: "isDiscounted",
      label: "Do you want to remove applied discount?",
      type: "checkbox",
      required: false,
    },
    {
      name: "discountedAmount",
      label: "Discounted Amount",
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
      name: "billingAmount",
      label: "Billing Amount",
      type: "number",
      disabled: true,
    },
    {
      name: "billingRate",
      label: "Billing Rate",
      type: "number",
      disabled: true,
    },
    {
      name: "cndn",
      label: "CNDN",
      type: "number",
    },
    {
      name: "adjustment",
      label: "Adjustment",
      type: "number",
      disabled: true,
    },
    {
      name: "openEnrollment",
      label: "Open Enrollment",
      type: "checkbox",
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

  const fetchDiscount = async () => {
    if (!values?.courseId) return;
    if (!values?.numberOfDays) return;
    try {
      const res: Response<Discount> | any = await getDiscounts({
        courseId: Number(values?.courseId),
        aboveUnits: Number(values?.numberOfDays),
        sortBy: "aboveUnits",
        sortOrder: "DESC",
        status: "active",
      });
      const data = res.data[0];
      setValues((prev) => ({
        ...prev,
        discountId: data?.discountId || 0,
        billingAmount: values?.numberOfDays * values?.billingRate,
        commitedAmount: values?.numberOfDays * values?.billingRate,
      }));
      setDiscount(data);
    } catch {
      setError("Failed to load discount.");
    }
  };

  return (
    <div className="flex flex-col max-h-[90vh] overflow-hidden">
      <div className="overflow-auto">
        {memberName && (
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
        )}
      </div>

      <FormFooter
        onClose={onClose}
        onSubmit={handleSubmit}
        submitLabel="Create"
        isSubmitting={false}
      />
    </div>
  );
};

export default EnrollmentFormNew;
