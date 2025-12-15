import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createCourse, updateCourse } from "@/api/course.api";
import { createCourseShare } from "@/api/courseShare.api";
import { createCoursePackage } from "@/api/coursePackage.api";

import { getActivities } from "@/api/activity.api";
import { getAcademies } from "@/api/academy.api";
import { getEnumsByCategory } from "@/api/enums.api";

import type { Course } from "@/types/course";
import type { CourseShare } from "@/types/courseShare";
import type { CoursePackage } from "@/types/coursePackage";
import type { Activity } from "@/types/activity";
import type { Academy } from "@/types/academy";
import type { Enums } from "@/types/enums";
import type { FormFieldConfig } from "@/components/form-modal/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

/* ---------------- EMPTY OBJECTS ---------------- */

const emptyCourse: Course = {
  courseId: 0,
  academyId: 0,
  courseName: "",
  courseType: null,
  classification: null,
  activityName: null,
  introduceDate: "",
  suspensionDate: null,
  chargingPattern: null,
  sessionMinutes: 30,
  noOfDaysInWeek: 1,
  availabilityPattern: "",
  minEnrollmentUnits: 1,
  batchCapacity: 1,
  totalParallelBatches: 1,
  minAge: 1,
  maxAge: 100,
  gender: "Any",
  feeClassification: null,
  changable: false,
  freezingAllowed: 0,
  createdAt: "",
  updatedAt: "",
};

const emptyShare: CourseShare = {
  courseShareId: 0,
  academyId: 0,
  shareType: "",
  share: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const emptyPackage: CoursePackage = {
  coursePackageId: 0,
  courseId: 0,
  linkType: "",
  activityType: "",
  createdAt: "",
  updatedAt: "",
};

/* ---------------- PROPS ---------------- */

type Props = {
  isOpen: boolean;
  initialData?: Course;
  onClose: () => void;
  onSave: () => void;
};

export default function CourseCreateWithShareAndPackageForm({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  /* ---------------- STATE ---------------- */

  const [course, setCourse] = useState<Course>(emptyCourse);
  const [shares, setShares] = useState<CourseShare[]>([]);
  const [packages, setPackages] = useState<CoursePackage[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [courseTypes, setCourseTypes] = useState<Enums[]>([]);

  /* ---------------- LOAD MASTER DATA ---------------- */

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      const [a, ac, ct] = await Promise.all([
        getActivities({ limit: 500 }),
        getAcademies({ limit: 500 }),
        getEnumsByCategory("courseType"),
      ]);

      setActivities(a?.data ?? []);
      setAcademies(ac?.data ?? []);
      setCourseTypes(ct?.data ?? []);
    };

    load();
  }, [isOpen]);

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    if (initialData) {
      setCourse({
        ...initialData,
        introduceDate: initialData.introduceDate
          ? format(new Date(initialData.introduceDate), "yyyy-MM-dd")
          : "",
        suspensionDate: initialData.suspensionDate
          ? format(new Date(initialData.suspensionDate), "yyyy-MM-dd")
          : null,
      });
    } else {
      setCourse(emptyCourse);
      setShares([]);
      setPackages([]);
    }

    setErrors({});
    setError(null);
  }, [initialData, isOpen]);

  /* ---------------- COURSE CHANGE ---------------- */

  const onCourseChange = (field: keyof Course, value: any) => {
    setCourse((p) => ({ ...p, [field]: value }));
  };

  /* ---------------- VALIDATION ---------------- */

  const validate = () => {
    const e: Record<string, string> = {};

    if (!course.courseName) e.courseName = "Required";
    if (!course.activityName) e.activityName = "Required";
    if (!course.courseType) e.courseType = "Required";
    if (!course.introduceDate) e.introduceDate = "Required";

    shares.forEach((s, i) => {
      if (!s.academyId) e[`share-${i}`] = "Academy required in share";
      if (!s.shareType) e[`shareType-${i}`] = "Share type required";
      if (s.share <= 0 || s.share > 100)
        e[`shareValue-${i}`] = "Share must be 1–100";
    });

    packages.forEach((p, i) => {
      if (!p.activityType) e[`package-activity-${i}`] = "Activity required";
      if (!p.linkType) e[`package-link-${i}`] = "Link type required";
    });

    return e;
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      setIsSubmitting(false);
      return;
    }

    try {
      let courseId = initialData?.courseId;

      if (courseId) {
        await updateCourse(courseId, course);
      } else {
        const res = await createCourse(course);
        courseId = res?.data?.courseId;
      }

      if (!courseId) throw new Error("Course creation failed");

      for (const s of shares) {
        await createCourseShare({ ...s, courseId });
      }

      for (const p of packages) {
        await createCoursePackage({ ...p, courseId });
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [course, shares, packages]);

  /* ---------------- COURSE FIELDS ---------------- */

  const fields: FormFieldConfig<Course>[] = [
    { name: "courseName", label: "Course Name", type: "text", required: true },
    {
      name: "activityName",
      label: "Activity",
      type: "select",
      required: true,
      options: activities.map((a) => ({
        label: a.activityName,
        value: a.activityName,
      })),
    },
    {
      name: "courseType",
      label: "Course Type",
      type: "select",
      required: true,
      options: courseTypes.map((c) => ({
        label: c.value,
        value: c.value,
      })),
    },
    { name: "introduceDate", label: "Introduce Date", type: "Date" },
  ];

  if (!isOpen) return null;

  /* ---------------- RENDER ---------------- */

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hiddenn">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          <FormHeader
            title={initialData ? "Edit Course" : "Create Course"}
            onClose={onClose}
          />

          <div className="max-h-[75vh] overflow-auto">
            <FormContent
              fields={fields}
              values={course}
              errors={errors}
              loading={loading}
              onChange={onCourseChange}
              layout="grid"
            />
            <div className="px-4 bg-background">
              {/* -------- SHARES -------- */}
              <section className="p-4 border border-gray-200 rounded-lg shadow-sm mb-6">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-xl font-bold text-foreground">
                    Course Shares
                  </h3>
                  <Button
                    onClick={() => setShares((s) => [...s, emptyShare])}
                    // Assuming a default primary style for the Button component
                  >
                    + Add Share
                  </Button>
                </div>

                <div className="space-y-4">
                  {shares.map((s, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_1fr_0.5fr_max-content] gap-3 items-center"
                    >
                      {/* Academy Select (Shadcn) */}
                      <Select
                        value={String(s.academyId)}
                        onValueChange={(value) => {
                          const v = [...shares];
                          v[i].academyId = Number(value);
                          setShares(v);
                        }}
                      >
                        <SelectTrigger className="border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150">
                          <SelectValue placeholder="Select Academy" />
                        </SelectTrigger>
                        <SelectContent>
                          {academies.map((a) => (
                            <SelectItem
                              key={a.academyId}
                              value={String(a.academyId)}
                            >
                              {a.academyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Share Type Input (Shadcn) */}
                      <Input
                        placeholder="Share Type (e.g., Commission)"
                        value={s.shareType}
                        onChange={(e) => {
                          const v = [...shares];
                          v[i].shareType = e.target.value;
                          setShares(v);
                        }}
                        className="border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                      />

                      {/* Percentage Input (Shadcn + wrapper for %) */}
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="%"
                          value={s.share}
                          onChange={(e) => {
                            const v = [...shares];
                            v[i].share = Number(e.target.value);
                            setShares(v);
                          }}
                          className="border border-gray-300 rounded-lg pr-8 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                          %
                        </span>
                      </div>

                      {/* Remove Button (Updated Styling) */}
                      <button
                        onClick={() =>
                          setShares((x) => x.filter((_, idx) => idx !== i))
                        }
                        aria-label="Remove Share"
                      >
                        <div className="text-gray-500 hover:bg-red-500 hover:text-background p-1 ml-2 rounded-lg transition duration-150">
                          <X className="w-5 h-5" />
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* -------- PACKAGES -------- */}
              <section className="p-4 border border-gray-200 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-xl font-bold">Course Packages</h3>
                  <Button
                    onClick={() => setPackages((p) => [...p, emptyPackage])}
                    // Assuming a default primary style for the Button component
                  >
                    + Add Package
                  </Button>
                </div>

                <div className="space-y-4">
                  {packages.map((p, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_1fr_max-content] gap-3 items-center"
                    >
                      {/* Activity Select (Shadcn) */}
                      <Select
                        value={p.activityType}
                        onValueChange={(value) => {
                          const v = [...packages];
                          v[i].activityType = value;
                          setPackages(v);
                        }}
                      >
                        <SelectTrigger className="border border-gray-300 rounded-lg transition duration-150">
                          <SelectValue placeholder="Select Activity Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {activities.map((a) => (
                            <SelectItem
                              key={a.activityId}
                              value={a.activityName}
                            >
                              {a.activityName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Link Type Select (Shadcn) */}
                      <Select
                        value={p.linkType}
                        onValueChange={(value) => {
                          const v = [...packages];
                          v[i].linkType = value;
                          setPackages(v);
                        }}
                      >
                        <SelectTrigger className="border border-gray-300 rounded-lg transition duration-150">
                          <SelectValue placeholder="Select Link Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="locationShare">
                            Location Share
                          </SelectItem>
                          {/* Add other options as needed */}
                        </SelectContent>
                      </Select>

                      {/* Remove Button (Updated Styling) */}
                      <button
                        onClick={() =>
                          setPackages((x) => x.filter((_, idx) => idx !== i))
                        }
                        aria-label="Remove Package"
                      >
                        <div className="text-gray-500 hover:bg-red-500 hover:text-background p-1 ml-2 rounded-lg transition duration-150">
                          <X className="w-5 h-5" />
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
          <FormFooter
            onSubmit={handleSubmit}
            onClose={onClose}
            submitLabel={initialData ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
