"use client";

import type React from "react";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  DollarSign,
  Share2,
  Package,
  AlertCircle,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createFullCourse } from "@/api/course.api";
import { getActivities } from "@/api/activity.api";
import { getEnumsByCategory } from "@/api/enums.api";
import { getAcademies } from "@/api/academy.api";
import type { Course } from "@/types/course";
import type { Activity } from "@/types/activity";
import type { Enums } from "@/types/enums";
import type { Response } from "@/types/response";
import type { Academy } from "@/types/academy";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { CoursePackage } from "@/types/coursePackage";
import type { CourseRate } from "@/types/courseRate";
import type { CourseShare } from "@/types/courseShare";
import { getMembershipMasters } from "@/api/membershipMaster.api";
import type { MembershipMaster } from "@/types/memberShipMaster";
import { toast } from "@/hooks/use-toast";

interface CourseFormState {
  course: Partial<Course>;
  packages: CoursePackage[];
  rates: CourseRate[];
  shares: CourseShare[];
}

const emptyCourse: Partial<Course> = {
  courseId: 0,
  academyId: 0,
  courseName: "",
  introduceDate: format(new Date(), "yyyy-MM-dd"),
  sessionMinutes: 30,
  noOfDaysInWeek: 1,
  availabilityPattern: "12345",
  minEnrollmentUnits: 1,
  batchCapacity: 1,
  totalParallelBatches: 1,
  minAge: 1,
  maxAge: 100,
  gender: "Any",
};

const emptyPackage: CoursePackage = {
  coursePackageId: 0,
  courseId: 0,
  linkType: "locationShare",
  activityId: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const emptyRate: CourseRate = {
  courseRateId: 0,
  courseId: 0,
  membershipMasterId: 0,
  membershipType: "",
  aboveUnits: 0,
  unitRate: 0,
  introduceDate: format(new Date(), "yyyy-MM-dd"),
  changable: false,
  freezing: 0,
  createdAt: "",
  updatedAt: "",
};

const defaultShares: CourseShare[] = [
  {
    courseShareId: 0,
    academyId: 8,
    courseId: 0,
    shareType: "TSL Charges",
    share: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    courseShareId: 0,
    academyId: 8,
    courseId: 0,
    shareType: "Facility Charges",
    share: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    courseShareId: 0,
    academyId: 8,
    courseId: 0,
    shareType: "SGST",
    share: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    courseShareId: 0,
    academyId: 8,
    courseId: 0,
    shareType: "CGST",
    share: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const initialFormState: CourseFormState = {
  course: emptyCourse,
  packages: [],
  rates: [],
  shares: defaultShares,
};

type Props = {
  isOpen: boolean;
  initialData?: CourseFormState;
  onClose: () => void;
  onSave: () => void;
};

const WEEKDAY_OPTIONS = [
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
  { label: "Sunday", value: "7" },
];

const weekArrayToNumber = (arr?: string[]): string => {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const map: Record<string, string> = {
    monday: "1",
    tuesday: "2",
    wednesday: "3",
    thursday: "4",
    friday: "5",
    saturday: "6",
    sunday: "7",
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
  };
  const nums = arr
    .map((v) => (typeof v === "string" ? v.toLowerCase() : ""))
    .map((k) => map[k] || "")
    .filter((v) => v !== "");

  if (nums.length === 0) return "";
  nums.sort((a, b) => a.localeCompare(b));
  return nums.join("");
};

const numberToWeekArray = (code?: string | null): string[] => {
  if (!code) return [];
  const map: Record<string, string> = {
    "1": "monday",
    "2": "tuesday",
    "3": "wednesday",
    "4": "thursday",
    "5": "friday",
    "6": "saturday",
    "7": "sunday",
  };
  return Array.from(code)
    .map((ch) => map[ch] || "")
    .filter((v) => v !== "");
};

export default function CourseFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [formState, setFormState] = useState<CourseFormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [activityOptions, setActivityOptions] = useState<Activity[]>([]);
  const [courseTypeOptions, setCourseTypeOptions] = useState<Enums[]>([]);
  const [academyOptions, setAcademyOptions] = useState<Academy[]>([]);
  const [entityTypeOptions, setEntityTypeOptions] = useState<
    MembershipMaster[]
  >([]);
  const [shareAcademyOptions, setShareAcademyOptions] = useState<Academy[]>([]);

  const loadMasterData = useCallback(
    async (activityName?: string | null) => {
      if (!isOpen) return;

      try {
        setLoadingOptions(true);
        setGlobalError(null);

        const [actRes, typeRes, entityRes, academyRes] = await Promise.all([
          getActivities({ limit: 500 }),
          getEnumsByCategory("courseType"),
          getMembershipMasters({ limit: 500 }),
          getAcademies({ limit: 500 }),
        ]);

        setActivityOptions((actRes as Response<Activity[]>)?.data ?? []);
        setCourseTypeOptions((typeRes as Response<Enums[]>)?.data ?? []);
        setEntityTypeOptions(
          (entityRes as Response<MembershipMaster[]>)?.data ?? []
        );
        setShareAcademyOptions((academyRes as Response<Academy[]>)?.data ?? []);

        if (activityName) {
          await loadCourseAcademies(activityName);
        }
      } catch (e) {
        setGlobalError("Failed to load necessary master data.");
        console.error(e);
      } finally {
        setLoadingOptions(false);
      }
    },
    [isOpen]
  );

  const loadCourseAcademies = useCallback(async (activityName: string) => {
    if (!activityName) {
      setAcademyOptions([]);
      return;
    }
    try {
      const res = await getAcademies({
        academyType: activityName,
        limit: 200,
      });

      const items = Array.isArray(res?.data ?? res) ? res.data ?? res : [];

      setAcademyOptions(items as Academy[]);
    } catch {
      setAcademyOptions([]);
    }
  }, []);

  useEffect(() => {
    loadMasterData(initialData?.course.activityName);
  }, [loadMasterData, initialData]);

  useEffect(() => {
    if (initialData) {
      const courseData = {
        ...initialData.course,
        introduceDate: initialData.course.introduceDate
          ? format(new Date(initialData.course.introduceDate), "yyyy-MM-dd")
          : "",
        suspensionDate: initialData.course.suspensionDate
          ? format(new Date(initialData.course.suspensionDate), "yyyy-MM-dd")
          : null,
        availabilityPattern: initialData.course.availabilityPattern
          ? numberToWeekArray(initialData.course.availabilityPattern as string)
          : [],
      };

      const ratesData = initialData.rates.map((r) => ({
        ...r,
        introduceDate: r.introduceDate
          ? format(new Date(r.introduceDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
      }));

      setFormState({
        ...initialFormState,
        ...initialData,
        course: courseData,
        rates: ratesData,
      });
    } else {
      setFormState(initialFormState);
    }
    setErrors({});
    setGlobalError(null);
  }, [initialData, isOpen]);

  const validate = useCallback((): Record<string, string> => {
    const e: Record<string, string> = {};
    const c = formState.course;

    if (!c.courseName?.trim()) e.courseName = "Course name is required";
    if (!c.activityName) e.activityName = "Activity is required";
    if (!c.courseType) e.courseType = "Course type is required";
    if (!c.introduceDate) e.introduceDate = "Introduce date is required";
    if (c.sessionMinutes === undefined || c.sessionMinutes <= 0)
      e.sessionMinutes = "Session minutes must be > 0";
    if (c.noOfDaysInWeek === undefined || c.noOfDaysInWeek <= 0)
      e.noOfDaysInWeek = "Days per week must be > 0";
    if (c.minEnrollmentUnits === undefined || c.minEnrollmentUnits <= 0)
      e.minEnrollmentUnits = "Min enrollment units must be > 0";
    if (c.batchCapacity === undefined || c.batchCapacity <= 0)
      e.batchCapacity = "Batch capacity must be > 0";
    if (c.totalParallelBatches === undefined || c.totalParallelBatches <= 0)
      e.totalParallelBatches = "Parallel batches must be > 0";
    if (c.minAge === undefined || c.minAge <= 0)
      e.minAge = "Min age must be > 0";
    if (c.maxAge === undefined || c.maxAge <= 0)
      e.maxAge = "Max age must be > 0";
    if (c.minAge! > c.maxAge!)
      e.maxAge = "Max age must be greater than min age";
    if (
      !c.availabilityPattern ||
      (Array.isArray(c.availabilityPattern) &&
        c.availabilityPattern.length === 0)
    ) {
      e.availabilityPattern = "Select at least one weekday";
    }
    if (!c.academyId || c.academyId <= 0) e.academyId = "Academy is required";
    if (!c.classification) e.classification = "Classification is required";

    if (formState.rates.length === 0)
      e.rates = "At least one Course Rate must be added.";
    if (formState.shares.length === 0)
      e.shares = "At least one Course Share must be added.";

    const totalShare = formState.shares.reduce(
      (sum, s) => sum + (s.share || 0),
      0
    );
    if (totalShare !== 100) {
      e.sharesTotal = `Total share must equal 100% (current: ${totalShare}%)`;
    }

    formState.rates.forEach((r, i) => {
      if (!r.unitRate) e[`rate_${i}_unitRate`] = "Rate required";
      if (!r.introduceDate) e[`rate_${i}_introduceDate`] = "Date required";
    });

    formState.shares.forEach((s, i) => {
      if (!s.academyId || s.academyId <= 0)
        e[`share_${i}_academyId`] = "Academy required";
      if (!s.shareType) e[`share_${i}_shareType`] = "Type required";
      if (s.share === undefined || s.share < 0 || s.share > 100)
        e[`share_${i}_share`] = "Share (0-100) required";
    });

    formState.packages.forEach((p, i) => {
      if (!p.linkType) e[`package_${i}_linkType`] = "Link Type required";
    });

    return e;
  }, [formState]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setGlobalError(null);

    const vErrors = validate();
    if (Object.keys(vErrors).length) {
      setErrors(vErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const availabilityCode = weekArrayToNumber(
        formState.course.availabilityPattern as string[]
      );
      const updatedFormState = {
        ...formState,
        course: {
          ...formState.course,
          availabilityPattern: String(availabilityCode),
          suspensionDate: formState.course.suspensionDate || null,
        },
      };

      const res = await createFullCourse(updatedFormState);

      if (res?.success) {
        toast({
          title: "success",
          description: "course crerated successfully",
          variant: "success",
        });
      } else {
        throw "failed to make course";
      }

      onSave();
      onClose();
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "An error occurred during save."
      );
      toast({
        title: "Failed",
        description: "failed to create course",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, validate, onSave, onClose]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && isOpen) {
        // Don't submit if focused on textarea or if in a select dropdown
        const target = e.target as HTMLElement;
        if (
          target.tagName === "TEXTAREA" ||
          target.getAttribute("role") === "combobox" ||
          target.closest('[role="dialog"][data-state="open"]')
        ) {
          return;
        }
        e.preventDefault();
        handleSubmit();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleGlobalKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isOpen, handleSubmit]);

  const handleCourseChange = (
    field: keyof Course,
    value: string | number | boolean | null | string[]
  ) => {
    setFormState((p) => ({ ...p, course: { ...p.course, [field]: value } }));

    if (field === "activityName") {
      const activityName = value ? String(value) : null;
      const selectedActivity = activityOptions.find(
        (a) => a.activityName === activityName
      );

      setFormState((p) => ({
        ...p,
        course: {
          ...p.course,
          activityName,
          academyId: 0,
          classification: selectedActivity?.activityType ?? null,
        },
      }));
      loadCourseAcademies(activityName || "");
    }

    setErrors((e) => {
      const copy = { ...e };
      delete copy[field];
      return copy;
    });
  };

  const TAX_SHARE_TYPES = ["CGST", "SGST"];

  const handleShareChange = (
    index: number,
    field: keyof CourseShare,
    value: any
  ) => {
    setFormState((p) => {
      const shares = [...p.shares];
      const current = shares[index];

      // Non-share fields (academyId, shareType, etc.)
      if (field !== "share") {
        shares[index] = { ...current, [field]: value };
        return { ...p, shares };
      }

      const newValue = Number(value) || 0;
      const oldValue = current.share || 0;
      const delta = newValue - oldValue;

      const isTax = TAX_SHARE_TYPES.includes(current.shareType || "");

      // Update current share
      shares[index] = { ...current, share: newValue };

      // 1️⃣ CGST / SGST → mirror to the other tax, DO NOT touch TSL
      if (isTax) {
        const otherTaxIndex = shares.findIndex(
          (s, i) => i !== index && TAX_SHARE_TYPES.includes(s.shareType || "")
        );

        if (otherTaxIndex !== -1) {
          shares[otherTaxIndex] = {
            ...shares[otherTaxIndex],
            share: newValue,
          };
        }

        return { ...p, shares };
      }

      // 2️⃣ Non-GST share → adjust TSL only
      const tslIndex = shares.findIndex((s) => s.shareType === "TSL Charges");

      if (tslIndex !== -1 && tslIndex !== index) {
        shares[tslIndex] = {
          ...shares[tslIndex],
          share: Math.max(0, shares[tslIndex].share - delta),
        };
      }

      return { ...p, shares };
    });
  };

  const handleArrayChange = <T extends keyof CourseFormState>(
    key: T,
    index: number,
    field: keyof CourseFormState[T][number],
    value: any
  ) => {
    setFormState((p) => {
      const updatedArray = [...p[key]];
      updatedArray[index] = {
        ...updatedArray[index],
        [field]: value,
      } as CourseFormState[T][number];
      return { ...p, [key]: updatedArray };
    });
  };

  const addArrayItem = (key: keyof CourseFormState) => {
    let newItem;
    if (key === "packages") newItem = { ...emptyPackage };
    else if (key === "rates") newItem = { ...emptyRate };
    else if (key === "shares") {
      newItem = {
        courseShareId: 0,
        academyId: 0,
        courseId: 0,
        shareType: "",
        share: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (newItem) {
      setFormState((p) => ({
        ...p,
        [key]: [...p[key], newItem],
      }));
    }
  };

  const removeArrayItem = (key: keyof CourseFormState, index: number) => {
    setFormState((p) => ({
      ...p,
      [key]: p[key].filter((_, i) => i !== index),
    }));
  };

  const totalShare = useMemo(
    () => formState.shares.reduce((sum, s) => sum + (s.share || 0), 0),
    [formState.shares]
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col h-full max-h-[95vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <DialogHeader className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                {formState.course.courseId
                  ? "Edit Course & Sub-Entities"
                  : "Create New Course"}
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {(globalError ||
                errors.rates ||
                errors.shares ||
                errors.sharesTotal) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mx-6 mt-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {globalError || "Please review errors below"}
                    </p>
                    {errors.rates && <p className="mt-1">• {errors.rates}</p>}
                    {errors.shares && <p className="mt-1">• {errors.shares}</p>}
                    {errors.sharesTotal && (
                      <p className="mt-1">• {errors.sharesTotal}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Tabs
              defaultValue="course"
              className="flex flex-col flex-1 overflow-hidden"
            >
              <TabsList className="mx-6 mt-4 grid w-auto grid-cols-4 bg-primary/5">
                <TabsTrigger
                  value="course"
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Course</span>
                </TabsTrigger>
                <TabsTrigger
                  value="rates"
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Rates ({formState.rates.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="shares"
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Shares ({formState.shares.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="packages"
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Package className="w-4 h-4" />
                  <span>Packages ({formState.packages.length})</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <TabsContent value="course" className="mt-4">
                  <CourseForm
                    course={formState.course}
                    errors={errors}
                    loading={loadingOptions}
                    activityOptions={activityOptions}
                    academyOptions={academyOptions}
                    courseTypeOptions={courseTypeOptions}
                    onChange={handleCourseChange}
                  />
                </TabsContent>

                <TabsContent value="rates" className="mt-4">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Course Rates
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Define pricing tiers for this course
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => addArrayItem("rates")}
                      className="gap-2"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Rate
                    </Button>
                  </div>
                  <RatesList
                    rates={formState.rates}
                    entityTypeOptions={entityTypeOptions}
                    errors={errors}
                    onChange={(i, f, v) => handleArrayChange("rates", i, f, v)}
                    onRemove={(i) => removeArrayItem("rates", i)}
                  />
                </TabsContent>

                <TabsContent value="shares" className="mt-4">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Course Shares
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        Distribute revenue shares • Total:{" "}
                        <span
                          className={cn(
                            "font-semibold",
                            totalShare === 100
                              ? "text-primary"
                              : "text-destructive"
                          )}
                        >
                          {totalShare}%
                        </span>
                        {totalShare === 100 && (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => addArrayItem("shares")}
                      className="gap-2"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Share
                    </Button>
                  </div>
                  <SharesList
                    shares={formState.shares}
                    academyOptions={shareAcademyOptions}
                    errors={errors}
                    onChange={handleShareChange}
                    onRemove={(i) => removeArrayItem("shares", i)}
                  />
                </TabsContent>

                <TabsContent value="packages" className="mt-4">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Course Packages
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Link activities and define package types
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => addArrayItem("packages")}
                      className="gap-2"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Package
                    </Button>
                  </div>
                  <PackagesList
                    packages={formState.packages}
                    activityOptions={activityOptions}
                    errors={errors}
                    onChange={(i, f, v) =>
                      handleArrayChange("packages", i, f, v)
                    }
                    onRemove={(i) => removeArrayItem("packages", i)}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-32"
            >
              {isSubmitting
                ? "Saving..."
                : formState.course.courseId
                ? "Update Course"
                : "Create Course"}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function CourseForm({
  course,
  errors,
  loading,
  activityOptions,
  academyOptions,
  courseTypeOptions,
  onChange,
}: {
  course: Partial<Course>;
  errors: Record<string, string>;
  loading: boolean;
  activityOptions: Activity[];
  academyOptions: Academy[];
  courseTypeOptions: Enums[];
  onChange: (field: keyof Course, value: any) => void;
}) {
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(
    Array.isArray(course.availabilityPattern) ? course.availabilityPattern : []
  );

  useEffect(() => {
    setSelectedWeekdays(
      Array.isArray(course.availabilityPattern)
        ? course.availabilityPattern
        : []
    );
  }, [course.availabilityPattern]);

  const toggleWeekday = (day: string) => {
    const newSelection = selectedWeekdays.includes(day)
      ? selectedWeekdays.filter((d) => d !== day)
      : [...selectedWeekdays, day];
    setSelectedWeekdays(newSelection);
    onChange("availabilityPattern", newSelection);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <Label htmlFor="courseName">Course Name*</Label>
        <Input
          id="courseName"
          value={course.courseName || ""}
          onChange={(e) => onChange("courseName", e.target.value)}
          placeholder="Enter course name"
        />
        {errors.courseName && (
          <p className="text-xs text-destructive mt-1">{errors.courseName}</p>
        )}
      </div>

      <div>
        <Label htmlFor="introduceDate">Introduce Date*</Label>
        <Input
          id="introduceDate"
          type="date"
          value={course.introduceDate || ""}
          onChange={(e) => onChange("introduceDate", e.target.value)}
        />
        {errors.introduceDate && (
          <p className="text-xs text-destructive mt-1">
            {errors.introduceDate}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="suspensionDate">Suspension Date</Label>
        <Input
          id="suspensionDate"
          type="date"
          value={course.suspensionDate || ""}
          onChange={(e) => onChange("suspensionDate", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="activityName">Activity*</Label>
        <Select
          value={course.activityName || ""}
          onValueChange={(v) => onChange("activityName", v)}
        >
          <SelectTrigger id="activityName" disabled={loading}>
            <SelectValue placeholder="Select Activity" />
          </SelectTrigger>
          <SelectContent>
            {activityOptions.map((a) => (
              <SelectItem key={a.activityId} value={a.activityName}>
                {a.activityName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.activityName && (
          <p className="text-xs text-destructive mt-1">{errors.activityName}</p>
        )}
      </div>

      <div>
        <Label htmlFor="academyId">Academy*</Label>
        <Select
          value={course.academyId ? String(course.academyId) : ""}
          onValueChange={(v) => onChange("academyId", Number(v))}
        >
          <SelectTrigger
            id="academyId"
            disabled={loading || !course.activityName}
          >
            <SelectValue placeholder="Select Academy" />
          </SelectTrigger>
          <SelectContent>
            {academyOptions.map((a) => (
              <SelectItem key={a.academyId} value={String(a.academyId)}>
                {a.academyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.academyId && (
          <p className="text-xs text-destructive mt-1">{errors.academyId}</p>
        )}
      </div>

      <div>
        <Label htmlFor="classification">Classification (Auto)</Label>
        <Input
          id="classification"
          value={course.classification || ""}
          disabled
        />
      </div>

      <div>
        <Label htmlFor="courseType">Course Type*</Label>
        <Select
          value={course.courseType || ""}
          onValueChange={(v) => onChange("courseType", v)}
        >
          <SelectTrigger id="courseType">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            {courseTypeOptions.map((c) => (
              <SelectItem key={c.id} value={c.value}>
                {c.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.courseType && (
          <p className="text-xs text-destructive mt-1">{errors.courseType}</p>
        )}
      </div>

      <div>
        <Label htmlFor="sessionMinutes">Session Minutes*</Label>
        <Input
          id="sessionMinutes"
          type="number"
          value={course.sessionMinutes || ""}
          onChange={(e) => onChange("sessionMinutes", Number(e.target.value))}
        />
        {errors.sessionMinutes && (
          <p className="text-xs text-destructive mt-1">
            {errors.sessionMinutes}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="noOfDaysInWeek">Days Per Week*</Label>
        <Input
          id="noOfDaysInWeek"
          type="number"
          value={course.noOfDaysInWeek || ""}
          onChange={(e) => onChange("noOfDaysInWeek", Number(e.target.value))}
        />
        {errors.noOfDaysInWeek && (
          <p className="text-xs text-destructive mt-1">
            {errors.noOfDaysInWeek}
          </p>
        )}
      </div>

      <div className="col-span-2">
        <Label>Available On*</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {WEEKDAY_OPTIONS.map((day) => (
            <Button
              key={day.value}
              type="button"
              variant={
                selectedWeekdays.includes(day.label.toLowerCase())
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => toggleWeekday(day.label.toLowerCase())}
              className="flex-1 min-w-[80px]"
            >
              {day.label}
            </Button>
          ))}
        </div>
        {errors.availabilityPattern && (
          <p className="text-xs text-destructive mt-1">
            {errors.availabilityPattern}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="minEnrollmentUnits">Min Enrollment Units*</Label>
        <Input
          id="minEnrollmentUnits"
          type="number"
          value={course.minEnrollmentUnits || ""}
          onChange={(e) =>
            onChange("minEnrollmentUnits", Number(e.target.value))
          }
        />
        {errors.minEnrollmentUnits && (
          <p className="text-xs text-destructive mt-1">
            {errors.minEnrollmentUnits}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="batchCapacity">Batch Capacity*</Label>
        <Input
          id="batchCapacity"
          type="number"
          value={course.batchCapacity || ""}
          onChange={(e) => onChange("batchCapacity", Number(e.target.value))}
        />
        {errors.batchCapacity && (
          <p className="text-xs text-destructive mt-1">
            {errors.batchCapacity}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="totalParallelBatches">Parallel Batches*</Label>
        <Input
          id="totalParallelBatches"
          type="number"
          value={course.totalParallelBatches || ""}
          onChange={(e) =>
            onChange("totalParallelBatches", Number(e.target.value))
          }
        />
        {errors.totalParallelBatches && (
          <p className="text-xs text-destructive mt-1">
            {errors.totalParallelBatches}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="minAge">Min Age*</Label>
        <Input
          id="minAge"
          type="number"
          value={course.minAge || ""}
          onChange={(e) => onChange("minAge", Number(e.target.value))}
        />
        {errors.minAge && (
          <p className="text-xs text-destructive mt-1">{errors.minAge}</p>
        )}
      </div>

      <div>
        <Label htmlFor="maxAge">Max Age*</Label>
        <Input
          id="maxAge"
          type="number"
          value={course.maxAge || ""}
          onChange={(e) => onChange("maxAge", Number(e.target.value))}
        />
        {errors.maxAge && (
          <p className="text-xs text-destructive mt-1">{errors.maxAge}</p>
        )}
      </div>

      <div>
        <Label htmlFor="gender">Gender*</Label>
        <Select
          value={course.gender || ""}
          onValueChange={(v) => onChange("gender", v as any)}
        >
          <SelectTrigger id="gender">
            <SelectValue placeholder="Select Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Any">Any</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="chargingPattern">Charging Pattern</Label>
        <Select
          value={course.chargingPattern || ""}
          onValueChange={(v) => onChange("chargingPattern", v)}
        >
          <SelectTrigger id="chargingPattern">
            <SelectValue placeholder="Select Pattern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Unit">Unit</SelectItem>
            <SelectItem value="Day">Day</SelectItem>
            <SelectItem value="Session">Session</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="feeClassification">Fee Classification</Label>
        <Input
          id="feeClassification"
          value={course.feeClassification || ""}
          onChange={(e) => onChange("feeClassification", e.target.value)}
        />
      </div>
    </div>
  );
}

interface RatesListProps {
  rates: CourseRate[];
  entityTypeOptions: MembershipMaster[];
  errors: Record<string, string>;
  onChange: (index: number, field: keyof CourseRate, value: any) => void;
  onRemove: (index: number) => void;
}

const RatesList = ({
  rates,
  entityTypeOptions,
  errors,
  onChange,
  onRemove,
}: RatesListProps) => {
  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    isLastField: boolean
  ) => {
    if (
      e.key === "Tab" &&
      !e.shiftKey &&
      isLastField &&
      index === rates.length - 1
    ) {
      e.preventDefault();
      // Add new rate when Tab on last field of last row
      // This will trigger the parent's addArrayItem function if called with a dummy value for a required field
      onChange(rates.length, "unitRate", 0); // Trigger add via parent by changing an empty rate
      // Attempt to focus the first field of the newly added row
      setTimeout(() => {
        const nextInput = document.querySelector<HTMLInputElement>(
          `#rate_${rates.length}_membershipMasterId`
        );
        if (nextInput) {
          nextInput.focus();
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr,1fr,1fr,0.8fr,0.8fr,0.8fr,60px] gap-1 px-2 py-1 bg-muted/50 text-xs font-semibold border-b">
        <div>Membership Type</div>
        <div>Unit Rate*</div>
        <div>Introduce Date*</div>
        <div>Above Units</div>
        <div>Freezing</div>
        <div>Changeable</div>
        <div></div>
      </div>

      <AnimatePresence mode="popLayout">
        {rates.map((rate, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.15 }}
            layout
            className="grid grid-cols-[1fr,1fr,1fr,0.8fr,0.8fr,0.8fr,60px] gap-1 px-2 py-1 border-b hover:bg-muted/30 items-center"
          >
            <div>
              <Select
                value={rate.membershipMasterId || 0}
                onValueChange={(v) =>
                  onChange(index, "membershipMasterId", Number(v))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypeOptions.map((e) => (
                    <SelectItem
                      key={e.membershipMasterId}
                      value={e.membershipMasterId}
                    >
                      {e.membershipType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors[`rate_${index}_entityType`] && (
                <p className="text-[10px] text-destructive mt-0.5">
                  {errors[`rate_${index}_entityType`]}
                </p>
              )}
            </div>

            <div>
              <Input
                type="number"
                className="h-8 text-xs"
                id={`rate_${index}_unitRate`}
                value={rate.unitRate}
                onChange={(e) =>
                  onChange(index, "unitRate", Number(e.target.value))
                }
              />
              {errors[`rate_${index}_unitRate`] && (
                <p className="text-[10px] text-destructive mt-0.5">
                  {errors[`rate_${index}_unitRate`]}
                </p>
              )}
            </div>

            <div>
              <Input
                type="date"
                className="h-8 text-xs"
                id={`rate_${index}_introduceDate`}
                value={rate.introduceDate}
                onChange={(e) =>
                  onChange(index, "introduceDate", e.target.value)
                }
              />
              {errors[`rate_${index}_introduceDate`] && (
                <p className="text-[10px] text-destructive mt-0.5">
                  {errors[`rate_${index}_introduceDate`]}
                </p>
              )}
            </div>

            <div>
              <Input
                type="number"
                className="h-8 text-xs"
                id={`rate_${index}_aboveUnits`}
                value={rate.aboveUnits}
                onChange={(e) =>
                  onChange(index, "aboveUnits", Number(e.target.value))
                }
              />
            </div>

            <div>
              <Input
                type="number"
                className="h-8 text-xs"
                id={`rate_${index}_freezing`}
                value={rate.freezing}
                onChange={(e) =>
                  onChange(index, "freezing", Number(e.target.value))
                }
                onKeyDown={(e) => handleKeyDown(e, index, true)}
              />
            </div>

            <div className="flex items-center justify-center">
              <Checkbox
                checked={rate.changable}
                onCheckedChange={(checked) =>
                  onChange(index, "changable", Boolean(checked))
                }
              />
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {rates.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-muted-foreground text-sm"
        >
          <p>No rates added yet. Click "Add Rate" to get started.</p>
        </motion.div>
      )}
    </div>
  );
};

interface SharesListProps {
  shares: CourseShare[];
  academyOptions: Academy[];
  errors: Record<string, string>;
  onChange: (index: number, field: keyof CourseShare, value: any) => void;
  onRemove: (index: number) => void;
}

const SharesList = ({
  shares,
  academyOptions,
  errors,
  onChange,
  onRemove,
}: SharesListProps) => {
  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    isLastField: boolean
  ) => {
    if (
      e.key === "Tab" &&
      !e.shiftKey &&
      isLastField &&
      index === shares.length - 1
    ) {
      e.preventDefault();
      // Add new share when Tab on last field of last row
      // This will trigger the parent's addArrayItem function if called with a dummy value for a required field
      onChange(shares.length, "academyId", 0); // Trigger add via parent by changing an empty share
      // Attempt to focus the first field of the newly added row
      setTimeout(() => {
        const nextInput = document.querySelector<HTMLInputElement>(
          `#share_${shares.length}_academyId`
        );
        if (nextInput) {
          nextInput.focus();
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[2fr,1.5fr,1fr,60px] gap-1 px-2 py-1 bg-muted/50 text-xs font-semibold border-b">
        <div>Academy*</div>
        <div>Share Type*</div>
        <div>Share (%)*</div>
        <div></div>
      </div>

      <AnimatePresence mode="popLayout">
        {shares.map((share, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.15 }}
            layout
            className="grid grid-cols-[2fr,1.5fr,1fr,60px] gap-1 px-2 py-1 border-b hover:bg-muted/30 items-center"
          >
            <div>
              <Select
                value={String(share.academyId || "")}
                onValueChange={(v) => onChange(index, "academyId", Number(v))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select Academy" />
                </SelectTrigger>
                <SelectContent>
                  {academyOptions.map((a) => (
                    <SelectItem key={a.academyId} value={String(a.academyId)}>
                      {a.academyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors[`share_${index}_academyId`] && (
                <p className="text-[10px] text-destructive mt-0.5">
                  {errors[`share_${index}_academyId`]}
                </p>
              )}
            </div>

            <div>
              <Input
                className="h-8 text-xs"
                id={`share_${index}_shareType`}
                value={share.shareType}
                onChange={(e) => onChange(index, "shareType", e.target.value)}
                disabled={share.shareType === "TSL Charges"}
              />
              {errors[`share_${index}_shareType`] && (
                <p className="text-[10px] text-destructive mt-0.5">
                  {errors[`share_${index}_shareType`]}
                </p>
              )}
            </div>

            <div>
              <Input
                type="number"
                min={0}
                max={100}
                className={cn(
                  "h-8 text-xs",
                  share.share > 0 && "font-semibold",
                  share.shareType === "TSL Charges" && "text-primary"
                )}
                id={`share_${index}_share`}
                value={share.share}
                onChange={(e) =>
                  onChange(index, "share", Number(e.target.value))
                }
                onKeyDown={(e) => handleKeyDown(e, index, true)}
              />
              {errors[`share_${index}_share`] && (
                <p className="text-[10px] text-destructive mt-0.5">
                  {errors[`share_${index}_share`]}
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

interface PackagesListProps {
  packages: CoursePackage[];
  activityOptions: Activity[];
  errors: Record<string, string>;
  onChange: (index: number, field: keyof CoursePackage, value: any) => void;
  onRemove: (index: number) => void;
}

const PackagesList = ({
  packages,
  activityOptions,
  errors,
  onChange,
  onRemove,
}: PackagesListProps) => {
  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    isLastField: boolean
  ) => {
    if (
      e.key === "Tab" &&
      !e.shiftKey &&
      isLastField &&
      index === packages.length - 1
    ) {
      e.preventDefault();
      // Add new package when Tab on last field of last row
      // This will trigger the parent's addArrayItem function if called with a dummy value for a required field
      onChange(packages.length, "activityId", 0); // Trigger add via parent by changing an empty package
      // Attempt to focus the first field of the newly added row
      setTimeout(() => {
        const nextInput = document.querySelector<HTMLInputElement>(
          `#pkg_${packages.length}_activityId`
        );
        if (nextInput) {
          nextInput.focus();
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr,1fr,60px] gap-1 px-2 py-1 bg-muted/50 text-xs font-semibold border-b">
        <div>Activity</div>
        <div>Link Type*</div>
        <div></div>
      </div>

      <AnimatePresence mode="popLayout">
        {packages.map((pkg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.15 }}
            layout
            className="grid grid-cols-[1fr,1fr,60px] gap-1 px-2 py-1 border-b hover:bg-muted/30 items-center"
          >
            <div>
              <Select
                value={String(pkg.activityId || "")}
                onValueChange={(v) => onChange(index, "activityId", Number(v))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select Activity" />
                </SelectTrigger>
                <SelectContent>
                  {activityOptions.map((a) => (
                    <SelectItem key={a.activityId} value={String(a.activityId)}>
                      {a.activityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors[`package_${index}_activityId`] && (
                <p className="text-[10px] text-destructive mt-0.5">
                  {errors[`package_${index}_activityId`]}
                </p>
              )}
            </div>

            <div>
              <Select
                value={pkg.linkType}
                onValueChange={(v) => {
                  onChange(index, "linkType", v);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select Link Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pre">Pre</SelectItem>
                  <SelectItem value="post">Post</SelectItem>
                </SelectContent>
              </Select>
              {errors[`package_${index}_linkType`] && (
                <p className="text-[10px] text-destructive mt-0.5">
                  {errors[`package_${index}_linkType`]}
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {packages.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-muted-foreground text-sm"
        >
          <p>No packages added yet. Click "Add Package" to get started.</p>
        </motion.div>
      )}
    </div>
  );
};
