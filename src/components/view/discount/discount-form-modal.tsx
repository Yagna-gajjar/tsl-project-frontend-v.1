import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { createDiscount, updateDiscount } from "@/api/discount.api";
import type { Discount } from "@/types/discount";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getCourses } from "@/api/course.api";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  initialData?: Discount;
  onClose: () => void;
  onSave: () => void;
};

interface SelectOption {
  value: number;
  label: string;
}

const empty = {
  discountId: 0,
  aboveUnits: 0,
  courseId: 0,
  discountPercentage: 0,
  introduceDate: new Date(),
  suspendDate: undefined,
  status: "active",
} as unknown as Discount;

export default function DiscountFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Discount>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [courseOptions, setCourseOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (initialData) {
        setValues(initialData);
      } else {
        setValues(empty);
      }
      setFieldErrors({});
      setError(null);

      const resCourse: Response = await getCourses();
      
      // Handle Course data
      const courseArray = Array.isArray(resCourse.data) ? resCourse.data : [];
      const courseopts: SelectOption[] = courseArray.map(
        (course: unknown) => {
          const c = course as Record<string, unknown>;
          return {
            value: c.courseId as number,
            label: (c.courseName as string) || "",
          };
        }
      );

      setCourseOptions(courseopts);
    };

    if (isOpen) {
      loadData();
    }
  }, [initialData, isOpen]);

  const onChange = (
    field: keyof Discount,
    val: string | number | boolean | Date
  ) => {
    setValues((p) => ({ ...p, [field]: val }));

    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!values.courseId || Number(values.courseId) === 0) {
      errs.courseId = "Course is required";
    }
    if (!values.aboveUnits || Number(values.aboveUnits) === 0) {
      errs.aboveUnits = "Above units is required";
    }
    if (!values.discountPercentage || Number(values.discountPercentage) === 0) {
      errs.discountPercentage = "Discount percentage is required";
    }
    if (!values.introduceDate) {
      errs.introduceDate = "Introduce date is required";
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
      const payload: Partial<Discount> = {
        courseId: Number(values.courseId),
        aboveUnits: Number(values.aboveUnits),
        discountPercentage: Number(values.discountPercentage),
        introduceDate: values.introduceDate,
        suspendDate: values.suspendDate || undefined,
        status: values.status,
      };

      if (initialData?.discountId) {
        await updateDiscount(
          initialData.discountId,
          payload as Omit<Discount, "discountId" | "createdAt" | "updatedAt">
        );
        toast({
          title: "Success",
          description: "Discount updated successfully",
          variant: "default",
        });
      } else {
        await createDiscount(
          payload as Omit<Discount, "discountId" | "createdAt" | "updatedAt">
        );
        toast({
          title: "Success",
          description: "Discount created successfully",
          variant: "default",
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
      name: "courseId",
      label: "Course",
      type: "select",
      options: courseOptions,
      required: true,
    },
    {
      name: "aboveUnits",
      label: "Above Units",
      type: "number",
      required: true,
    },
    {
      name: "discountPercentage",
      label: "Discount Percentage",
      type: "number",
      required: true,
    },
    {
      name: "introduceDate",
      label: "Introduce Date",
      type: "date",
      required: true,
    },
    {
      name: "suspendDate",
      label: "Suspend Date",
      type: "date",
      required: false,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
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
                initialData?.discountId
                  ? "Edit Discount"
                  : "Add New Discount"
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
                    field: keyof Discount,
                    value: string | number | boolean
                  ) => void
                }
                layout="grid"
              />
            </div>
            <FormFooter
              onClose={onClose}
              onSubmit={handleSubmit}
              submitLabel={initialData?.discountId ? "Update" : "Create"}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
