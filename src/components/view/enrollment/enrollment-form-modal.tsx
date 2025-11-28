import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { createEnrollment, updateEnrollment } from "@/api/enrollment.api";
import type { Enrollment } from "@/types/enrollment";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getAcademies } from "@/api/academy.api";
import { getCourseByAcademy } from "@/api/course.api";
import { getMembers } from "@/api/member.api";
import { toast } from "@/hooks/use-toast";

type Props = {
  isOpen: boolean;
  initialData?: Enrollment;
  onClose: () => void;
  onSave: () => void;
};

interface SelectOption {
  value: number;
  label: string;
}

const empty = {
  enrollmentId: 0,
  enrollmentDate: new Date(),
  startDate: new Date(),
  endDate: undefined,
  academyId: 0,
  courseId: 0,
  memberId: 0,
  discountId: undefined,
  freeDays: 0,
  sessionUnits: 0,
  discountAmount: 0,
  committedAmount: 0,
  openEnrollment: false,
  remark: "",
  status: "active",
} as unknown as Enrollment;

export default function EnrollmentFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Enrollment>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [academyOptions, setAcademyOptions] = useState<SelectOption[]>([]);
  const [courseOptions, setCourseOptions] = useState<SelectOption[]>([]);
  const [memberOptions, setMemberOptions] = useState<SelectOption[]>([]);
    const [courseArray, setCourseArray] = useState<unknown[]>([]);
  const loadCourses = useCallback(
    async (academyId?: number) => {
      console.log(academyId, " is my academyId");
      try {
        // Pass academyId as a query parameter if it exists and is valid
        const courseRes = await getCourseByAcademy(
          academyId && academyId > 0 ? academyId : undefined
        );

        // Handle Course data
          const courseArray = Array.isArray(courseRes.data) ? courseRes.data : [];
          setCourseArray(courseArray);
        const courseopts: SelectOption[] = courseArray.map(
          (course: unknown) => {
            const c = course as Record<string, unknown>;
            return {
              value: c.courseId as number,
              label: c.courseName as string,
            };
          }
        );
        setCourseOptions(courseopts);

        // Check if the currently selected course is still valid
        if (
          academyId &&
          values.courseId &&
          !courseopts.some((opt) => opt.value === values.courseId)
        ) {
          // If the current course is no longer an option, clear it
          setValues((p) => ({ ...p, courseId: 0 }));
        }
      } catch (e) {
        console.error("Failed to load courses:", e);
        toast({
          title: "Error",
          description: "Failed to load courses.",
          variant: "destructive",
        });
        setCourseOptions([]);
      }
    },
    [values.courseId]
  );

  useEffect(() => {
    const loadData = async () => {
      // 1. Reset state based on initialData/isOpen
      if (initialData) {
        setValues(initialData);
      } else {
        setValues(empty);
      }
      setFieldErrors({});
      setError(null);

      // 2. Load static options (Academies and Members)
      const [resAcademy, resMember] = await Promise.all([
        getAcademies(),
        getMembers(),
      ]);

      // Handle Academy data
      const academyArray = Array.isArray(resAcademy) ? resAcademy : [];
      const academyopts: SelectOption[] = academyArray.map(
        (academy: unknown) => {
          const a = academy as Record<string, unknown>;
          return {
            value: a.academyId as number,
            label: a.academyName as string,
          };
        }
      );
      setAcademyOptions(academyopts);

      // Handle Member data
      const memberRes = resMember as unknown as Record<string, unknown>;
      const memberArray = Array.isArray(memberRes?.data)
        ? (memberRes.data as unknown[])
        : Array.isArray(resMember)
        ? (resMember as unknown[])
        : [];

      const memberopts: SelectOption[] = memberArray.map((member: unknown) => {
        const m = member as Record<string, unknown>;
        return {
          value: m.memberId as number,
          label:
            (m.memberFirstName as string) +
            " " +
            ((m.memberLastName as string) || ""),
        };
      });
      setMemberOptions(memberopts);

      // 3. Load Courses based on the initial academyId (if editing)
      // or load all courses (if no initial academyId, though typically it's present for an enrollment)
      //   const initialAcademyId = initialData?.academyId || 0;
      //   await loadCourses(initialAcademyId);
    };

    if (isOpen) {
      loadData();
    }
  }, [initialData, isOpen]);

    useEffect(() => {
        const course = courseArray.find((course) => {
            console.log(course.courseId, values.courseId, " is my comparison");
            if (course.courseId === Number(values.courseId)) {
                return course;
            }
        });
        console.log(course, " is my fees");
        setValues((p) => ({
          ...p,
          committedAmount: Number(course?.fees) || 0,
        }));
    },[values.courseId]);
    
  const onChange = (
    field: keyof Enrollment,
    val: string | number | boolean | Date
  ) => {
    setValues((p) => ({ ...p, [field]: val }));

    // NEW LOGIC: If academyId changes, reload courses and reset courseId
    if (field === "academyId") {
      const newAcademyId = Number(val);
      loadCourses(newAcademyId);
      // Reset courseId when a new academy is selected
      setValues((p) => ({ ...p, courseId: 0, academyId: newAcademyId }));
    }

    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!values.academyId || Number(values.academyId) === 0) {
      errs.academyId = "Academy is required";
    }
    if (!values.courseId || Number(values.courseId) === 0) {
      errs.courseId = "Course is required";
    }
    if (!values.memberId || Number(values.memberId) === 0) {
      errs.memberId = "Member is required";
    }
    if (!values.startDate) {
      errs.startDate = "Start date is required";
    }
    if (!values.committedAmount || Number(values.committedAmount) === 0) {
      errs.committedAmount = "Committed amount is required";
    }
    if (!values.status || String(values.status).trim() === "") {
      errs.status = "Status is required";
    }
    return errs;
  }, [values]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: Partial<Enrollment> = {
        academyId: Number(values.academyId),
        courseId: Number(values.courseId),
        memberId: Number(values.memberId),
        enrollmentDate: values.enrollmentDate,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        discountId: values.discountId || undefined,
        freeDays: Number(values.freeDays) || 0,
        sessionUnits: Number(values.sessionUnits) || 0,
        discountAmount: Number(values.discountAmount) || 0,
        committedAmount: Number(values.committedAmount),
        openEnrollment: values.openEnrollment || false,
        remark: values.remark || undefined,
        status: values.status,
      };

      if (initialData?.enrollmentId) {
        await updateEnrollment(
          initialData.enrollmentId,
          payload as Omit<
            Enrollment,
            "enrollmentId" | "createdAt" | "updatedAt"
          >
        );
        toast({
          title: "Success",
          description: "Enrollment updated successfully",
        });
      } else {
        await createEnrollment(
          payload as Omit<
            Enrollment,
            "enrollmentId" | "createdAt" | "updatedAt"
          >
        );
        toast({
          title: "Success",
          description: "Enrollment created successfully",
        });
      }
      onSave();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values, initialData, onSave, onClose]);

  const fields = [
    {
      name: "academyId",
      label: "Academy",
      type: "select",
      options: academyOptions,
      required: true,
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      options: courseOptions,
      required: true,
    },
    {
      name: "memberId",
      label: "Member",
      type: "select",
      options: memberOptions,
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
    },
    {
      name: "freeDays",
      label: "Free Days",
      type: "number",
      required: false,
    },
    {
      name: "sessionUnits",
      label: "Session Units",
      type: "number",
      required: false,
    },
    {
      name: "discountAmount",
      label: "Discount Amount",
      type: "number",
      required: false,
      disabled: true,
    },
    {
      name: "committedAmount",
      label: "Committed Amount",
      type: "number",
      required: true,
      disabled: true,
    },
    {
      name: "openEnrollment",
      label: "Open Enrollment",
      type: "checkbox",
      required: false,
    },
    {
      name: "remark",
      label: "Remark",
      type: "textarea",
      required: false,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any;

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <div>
        <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
          <div className="flex flex-col max-h-[90vh] overflow-hidden">
            <FormHeader
              title={
                initialData?.enrollmentId
                  ? "Edit Enrollment"
                  : "Add New Enrollment"
              }
              onClose={onClose}
            />
            <div className="overflow-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}
              <FormContent
                fields={fields}
                values={values}
                errors={fieldErrors}
                loading={false}
                error={error}
                isSubmitting={isSubmitting}
                onChange={
                  onChange as (
                    field: keyof Enrollment,
                    value: string | number | boolean
                  ) => void
                }
                layout="grid"
              />
            </div>
            <FormFooter
              onClose={onClose}
              onSubmit={handleSubmit}
              submitLabel={initialData?.enrollmentId ? "Update" : "Create"}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
