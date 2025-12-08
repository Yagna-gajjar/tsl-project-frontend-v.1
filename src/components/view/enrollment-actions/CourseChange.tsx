import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  Building2,
  BookOpen,
  Layers,
  Info,
  History,
  Calculator,
  Wallet,
  Clock,
  CheckCircle2,
} from "lucide-react";

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
import type { Activity } from "@/types/activity";
import type { Academy } from "@/types/academy";
import type { Course } from "@/types/course";
import type { Batch } from "@/types/batch";
import { getAcademies } from "@/api/academy.api";
import { getCourses } from "@/api/course.api";
import { getBatch } from "@/api/batch.api";
import { getActivities } from "@/api/activity.api";
import { enrollmentChange } from "@/api/enrollmentActions.api";

const SectionHeader = ({ icon: Icon, title, colorClass }: any) => (
  <div
    className={`flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800 ${colorClass}`}
  >
    <Icon size={18} />
    <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
  </div>
);

const DetailCard = ({
  label,
  value,
  subValue,
  icon: Icon,
  type = "default",
}: any) => {
  const bgColors: any = {
    default: "bg-gray-50 dark:bg-gray-800/50",
    success:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    warning:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    info: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
    danger: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400",
  };

  return (
    <div
      className={`p-3 rounded-lg border border-gray-100 dark:border-gray-800 ${bgColors[type]} flex items-start gap-3 transition-all hover:shadow-sm`}
    >
      <div className="mt-0.5 opacity-70">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase font-bold opacity-70 mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold truncate">{value || "-"}</p>
        {subValue && <p className="text-xs opacity-80 mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
};

const CourseChange = () => {
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
  const [batches, setBatches] = useState<Batch[]>([]);

  const [values, setValues] = useState<Enrollment>({
    enrollmentId: Number(id),
    memberId: oldEnrollment?.memberId || 0,
    academyId: 0,
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
    processingCharge: 100,
    changeType: "course-change",
    oldEnrollmentId: null,
    batchName: "",
    debitAmount: 0,
  });

  const onClose = () => setValues({} as any);

  // --- Logic Helpers ---
  function calculateDays(startISO?: any, endISO?: any, inclusive = false) {
    if (!startISO || !endISO) return 0;
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
      return null;
    }
    const newDate = addDays(startDate, daysToAdd);
    return format(newDate, "yyyy-MM-dd");
  }

  // --- Derived Calculations for UI ---
  // We calculate these on the fly to show the user exactly what's happening
  const daysConsumed =
    oldEnrollment && values.startDate
      ? calculateDays(oldEnrollment.startDate, values.startDate) + 1
      : 0;

  const amountConsumed = oldEnrollment
    ? (oldEnrollment.billingRate * daysConsumed).toFixed(2)
    : "0.00";

  const getSelectedCourseName = () =>
    course.find((c) => c.courseId === values.courseId)?.courseName;
  const getSelectedAcademyName = () =>
    academy.find((a) => a.academyId === values.academyId)?.academyName;
  const getSelectedBatchName = () => {
    const b = batches.find((bt) => bt.batchId === values.batchId);
    return b ? `${b.batchName} (${b.startTime}-${b.endTime})` : null;
  };

  const [debouncedDebitAmount, setDebouncedDebitAmount] = useState(
    values.debitAmount
  );

  // --- API Effects ---
  const handleSubmit = async () => {
    try {
      const res: Response<Enrollment | any> = await enrollmentChange(values);
      if (res.success) {
        navigate("/enrollment");
      } else {
        throw new Error("Failed to change.");
      }
    } catch (err) {
      setError("Failed to submit!");
    }
  };

  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        const response: Response<Enrollment | any> = await getEnrollmentById(
          id
        );
        const data = response?.data || [];
        setOldEnrollment(data);
      } catch (err) {
        setError("Failed to fetch enrollment details");
      }
    };
    const fetchActivities = async () => {
      try {
        const res: Response<Activity | any> = await getActivities({
          limit: 100,
        });
        setActivity(res?.data || []);
      } catch (err) {
        setError("Failed to fetch activities!");
      }
    };
    fetchEnrollment();
    fetchActivities();
  }, [id]);

  useEffect(() => {
    if (!values?.activityName || !selectedActivity) return;
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
    if (!values?.courseId) return;
    const c: Course = course.filter((c) => c.courseId == values?.courseId)[0];
    const finalAmount = values?.billingAmount - (values?.processingCharge || 0);
    const { days, adjust } = AdjustDays(finalAmount / c.unitRate);
    const endDate = addDaysToDate(new Date(values?.startDate), days);
    setValues((prev: any) => ({
      ...prev,
      billingRate: Number(c.unitRate),
      commitedAmount: Number((days * c.unitRate).toFixed(2)),
      numberOfDays: days,
      discountedAmount: 0,
      adjustment: Number((adjust * c.unitRate).toFixed(2)),
      endDate: endDate,
    }));
    const loadBatches = async () => {
      try {
        const res: Response<Batch> | any = await getBatch({
          courseId: values.courseId,
        });
        setBatches(res?.data || []);
      } catch {
        setError("Failed to load batches.");
      }
    };
    loadBatches();
  }, [values?.courseId, values?.processingCharge, values?.billingAmount]);

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
    setValues((prev: any) => ({ ...prev, endDate: newEndDate }));
  }, [values?.freeDays]);

  useEffect(() => {
    if (!values?.startDate || !oldEnrollment) return;
    setValues((prev) => ({ ...prev, memberId: oldEnrollment.memberId }));
    const diff = calculateDays(oldEnrollment.startDate, values.startDate);
    const usedAmount = oldEnrollment.billingRate * (diff + 1);
    const remaining = oldEnrollment.commitedAmount - usedAmount;
    setValues((prev: any) => ({
      ...prev,
      billingAmount: Number(Number(remaining).toFixed(2)),
    }));
  }, [values.startDate, oldEnrollment]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDebitAmount(values.debitAmount);
    }, 400);
    return () => clearTimeout(handler);
  }, [values.debitAmount]);

  useEffect(() => {
    if (debouncedDebitAmount != 0 && debouncedDebitAmount) {
      setValues((prev) => ({
        ...prev,
        commitedAmount: prev.commitedAmount - debouncedDebitAmount,
      }));
    } else {
      setValues((prev) => ({
        ...prev,
        commitedAmount: prev.numberOfDays * prev.billingRate,
      }));
    }
  }, [debouncedDebitAmount]);

  const fields = [
    {
      name: "enrollmentDate",
      label: "Enrollment Date",
      type: "date",
      required: true,
    },
    { name: "startDate", label: "Start Date", type: "date", required: true },
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
      options: batches.map((b) => ({
        label: `${b.batchName} | ${b.startTime} To ${b.endTime}`,
        value: Number(b.batchId),
      })),
      required: true,
    },
    { name: "processingCharge", label: "Processing Charge", type: "number" },
    {
      name: "debitAmount",
      label: "Debit Amount",
      type: "number",
      required: false,
    },
    {
      name: "sessionUnits",
      label: "Session Units",
      type: "number",
      required: false,
    },
    { name: "keepDiscount", label: "Keep Old Discount", type: "checkbox" },
    {
      name: "commitedAmount",
      label: "Commited Amount",
      type: "number",
      required: true,
      disabled: true,
    },
    { name: "cndn", label: "CNDN", type: "number" },
    { name: "adjustment", label: "Adjustment", type: "number", disabled: true },
    { name: "openEnrollment", label: "Open Enrollment", type: "checkbox" },
    { name: "remarks", label: "Remarks", type: "textarea" },
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

    // --- FIXED: keepDiscount handling ---
    if (field === "keepDiscount") {
      const keep = Boolean(value);

      // If we don't have oldEnrollment or its billingAmount, do nothing special
      if (!oldEnrollment || !oldEnrollment.billingAmount) {
        // just set the checkbox state; other logic will compute values via effects
        setValues((prev) => ({ ...prev, keepDiscount: keep }));
      } else {
        // compute numeric discount ratio (guard divide-by-zero)
        const discountRatio =
          Number(oldEnrollment.commitedAmount || 0) /
            Number(oldEnrollment.billingAmount || 1) || 0;

        setValues((prev) => {
          // when user chooses to keep discount, apply ratio to current billingAmount (remaining balance)
          if (keep) {
            const newCommitted = Number(
              (Number(prev.commitedAmount || 0) * discountRatio).toFixed(2)
            );
            return {
              ...prev,
              commitedAmount: newCommitted,
              keepDiscount: true,
            };
          } else {
            // when user unchecks, restore commitedAmount based on numberOfDays * billingRate
            const restored = Number(
              ((prev.numberOfDays || 0) * (prev.billingRate || 0)).toFixed(2)
            );
            return { ...prev, commitedAmount: restored, keepDiscount: false };
          }
        });
      }

      // we already handled setting keepDiscount + commitedAmount; return to avoid duplicate set
      return;
    }

    setValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4 gap-6 overflow-hidden">
      {/* --- TOP: Detailed Transformation View --- */}
      <AnimatePresence>
        {oldEnrollment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-gray-950 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 shrink-0"
          >
            {/* 1. LEFT: Source (Old) */}
            <div className="lg:col-span-5 space-y-4">
              <SectionHeader
                icon={History}
                title="Previous Plan Details"
                colorClass="text-gray-500"
              />

              <div className="grid grid-cols-2 gap-3">
                <DetailCard
                  icon={Calendar}
                  label="Original Start"
                  value={oldEnrollment.startDate?.toString().slice(0, 10)}
                />
                <DetailCard
                  icon={CreditCard}
                  label="Unit Rate"
                  value={`₹${oldEnrollment.billingRate}`}
                  type="success"
                />
                <DetailCard
                  icon={Clock}
                  label="Days Consumed"
                  type="danger"
                  value={`${daysConsumed} Days`}
                  subValue={`Until ${values.startDate}`}
                />
                <DetailCard
                  icon={BookOpen}
                  label="Course Name"
                  type="info"
                  value={`${oldEnrollment.courseName}`}
                  subValue="Current Enrolled"
                />
                <DetailCard
                  icon={Calculator}
                  label="Used Amount"
                  type="danger"
                  value={`₹${amountConsumed}`}
                  subValue="Non-Refundable"
                />
                <DetailCard
                  icon={Building2}
                  label="Batch Name"
                  type="info"
                  value={`${oldEnrollment.batchName}`}
                  subValue="Current Batch"
                />
              </div>
            </div>

            {/* 2. MIDDLE: Transfer Logic */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center space-y-3 py-4 lg:py-0 relative">
              <div className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-800 to-transparent left-1/2 -translate-x-1/2 hidden lg:block"></div>

              <div className="z-10 bg-white dark:bg-gray-950 p-2">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full text-blue-600 dark:text-blue-400 shadow-sm">
                  <ArrowRight size={24} />
                </div>
              </div>

              <div className="z-10 text-center bg-white dark:bg-gray-950 px-2">
                <p className="text-xs font-medium text-gray-400 uppercase">
                  Transferring
                </p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  ₹
                  {values.billingAmount
                    ? values.billingAmount.toFixed(2)
                    : "0.00"}
                </p>
                <p className="text-[10px] text-gray-400">Balance Credit</p>
              </div>
            </div>

            {/* 3. RIGHT: Destination (New) */}
            <div className="lg:col-span-5 space-y-4">
              <SectionHeader
                icon={Layers}
                title="New Plan Configuration"
                colorClass="text-blue-600 dark:text-blue-400"
              />

              <div className="grid grid-cols-2 gap-3">
                <DetailCard
                  icon={BookOpen}
                  type="info"
                  label="Selected Course"
                  value={getSelectedCourseName() || "Select Course..."}
                  subValue={getSelectedAcademyName() || "Select Academy..."}
                />
                <DetailCard
                  icon={Calendar}
                  label="End Date"
                  value={
                    oldEnrollment.endDate
                      ? format(oldEnrollment.endDate, "dd-MM-yyyy")
                      : "-"
                  }
                />
                <DetailCard
                  icon={Wallet}
                  label="New Daily Rate"
                  value={values.billingRate ? `₹${values.billingRate}` : "-"}
                  subValue="Unit Price"
                />
                <DetailCard
                  icon={Calendar}
                  label="New Duration"
                  type="success"
                  value={
                    values.numberOfDays ? `${values.numberOfDays} Days` : "-"
                  }
                  subValue={`Ends: ${values.endDate || "-"}`}
                />
                <DetailCard
                  icon={Building2}
                  label="Batch"
                  value={
                    getSelectedBatchName()
                      ? getSelectedBatchName()!.split("|")[0]
                      : "Select Batch"
                  }
                  subValue={
                    getSelectedBatchName()
                      ? getSelectedBatchName()!.split("|")[1]
                      : ""
                  }
                />
                <DetailCard
                  icon={CheckCircle2}
                  label="Final Status"
                  type="success"
                  value={
                    values.status === "active" ? "Active Plan" : values.status
                  }
                  subValue="Ready to Submit"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- BOTTOM: Form --- */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-gray-950 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Info size={18} className="text-blue-500" />
            Modify Enrollment Details
          </h2>
          <span className="text-xs text-gray-400">
            Fill required fields below
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
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

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel="Confirm Course Change"
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseChange;
