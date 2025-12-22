import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createCourseRate, updateCourseRate } from "@/api/courseRate.api";
import { getCourses } from "@/api/course.api";

import type { CourseRate } from "@/types/courseRate";
import type { Course } from "@/types/course";
import type { FormFieldConfig } from "@/components/form-modal/types";
import { format } from "date-fns";
import { getMemberships } from "@/api/membership.api";
import type { MembershipMaster } from "@/types/memberShipMaster";

const emptyRate: CourseRate | any = {
  courseRateId: 0,
  courseId: 0,
  membershipMasterId: 0,
  membershipType: "",
  aboveUnits: 0,
  unitRate: 0,
  introduceDate: "",
  freezing: 0,
  createdAt: "",
  updatedAt: "",
};

type Props = {
  isOpen: boolean;
  initialData?: CourseRate;
  preSelectedCourseId?: number;
  onClose: () => void;
  onSave: () => void;
};

export default function CourseRateFormModal({
  isOpen,
  initialData,
  preSelectedCourseId,
  onClose,
  onSave,
}: Props) {
  const [rate, setRate] = useState<CourseRate>(emptyRate);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [membershipMaster, setMembershipMaster] = useState<MembershipMaster[]>(
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    const loadMasters = async () => {
      setLoading(true);
      try {
        const [cRes, eRes] = await Promise.all([
          getCourses({ limit: 1000 }),
          getMemberships({ limit: 1000 }),
        ]);
        setCourses(cRes?.data ?? []);
        console.log(eRes?.data);

        setMembershipMaster(eRes?.data ?? [] as any);
      } catch (e) {
        console.error("Failed to load master data", e);
      } finally {
        setLoading(false);
      }
    };
    loadMasters();
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setRate({
        ...initialData,
        introduceDate: initialData.introduceDate
          ? format(new Date(initialData.introduceDate), "yyyy-MM-dd")
          : "",
      });
    } else {
      setRate({
        ...emptyRate,
        courseId: preSelectedCourseId || 0,
        introduceDate: format(new Date(), "yyyy-MM-dd"),
      });
    }
    setErrors({});
  }, [initialData, isOpen, preSelectedCourseId]);

  const handleChange = (field: keyof CourseRate, value: any) => {
    setRate((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setErrors({});

    const e: Record<string, string> = {};
    if (!rate.courseId) e.courseId = "Course is required";
    if (!rate.unitRate && rate.unitRate !== 0) e.unitRate = "Required";
    if (!rate.introduceDate) e.introduceDate = "Required";

    if (Object.keys(e).length) {
      setErrors(e);
      setIsSubmitting(false);
      return;
    }

    try {
      if (initialData?.courseRateId) {
        await updateCourseRate(initialData.courseRateId, rate);
      } else {
        await createCourseRate(rate);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [rate, initialData, onSave, onClose]);

  const fields: FormFieldConfig<CourseRate>[] = [
    {
      name: "courseId",
      label: "Course",
      type: "select",
      required: true,
      options: courses.map((c) => ({
        label: c.courseName,
        value: c.courseId,
      })),
      disabled: !!preSelectedCourseId && !initialData,
    },
    {
      name: "membershipMasterId",
      label: "Membership Master",
      type: "select",
      options: membershipMaster?.map((e) => ({
        label: String(e.membershipMasterId),
        value: e.membershipType,
      })),
    },
    {
      name: "unitRate",
      label: "Unit Rate",
      type: "number",
      required: true,
    },
    {
      name: "aboveUnits",
      label: "Above Units",
      type: "number",
    },
    {
      name: "freezing",
      label: "Freezing Cost",
      type: "number",
    },
    {
      name: "introduceDate",
      label: "Introduce Date",
      type: "Date",
      required: true,
    }
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <FormHeader
          title={initialData ? "Edit Rate" : "Add Rate"}
          onClose={onClose}
        />
        <div className="max-h-[75vh] overflow-auto">
          <FormContent
            error={""}
            fields={fields}
            values={rate}
            errors={errors}
            loading={loading}
            isSubmitting={false}
            onChange={handleChange}
            layout="grid"
          />
        </div>
        <FormFooter
          onSubmit={handleSubmit}
          onClose={onClose}
          submitLabel={initialData ? "Update" : "Create"}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}