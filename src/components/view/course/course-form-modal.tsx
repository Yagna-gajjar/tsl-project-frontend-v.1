import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
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
import { createFullCourse } from "@/api/course.api";
import { getActivities } from "@/api/activity.api";
import { getEnumsByCategory } from "@/api/enums.api";
import { getEntities } from "@/api/entity.api";
import type { Course } from "@/types/course";
import type { Activity } from "@/types/activity";
import type { Enums } from "@/types/enums";
import type { Response } from "@/types/response";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { CoursePackage } from "@/types/coursePackage";
import type { CourseRate } from "@/types/courseRate";
import type { CourseShare } from "@/types/courseShare";
import { getMembershipMasters } from "@/api/membershipMaster.api";
import type { MembershipMaster } from "@/types/memberShipMaster";
import { toast } from "@/hooks/use-toast";
import type { Entity } from "@/types/entity";
import { SharesList } from "./course-form/share-list";
import { RatesList } from "./course-form/rate-list";
import { PackagesList } from "./course-form/package-list";
import { CourseForm } from "./course-form/course-list";
import CourseFooter from "./course-form/course-footer";

interface CourseFormState {
  course: Partial<Course> | any;
  packages: CoursePackage[];
  rates: CourseRate[];
  shares: CourseShare[];
}

const emptyCourse: Partial<Course> = {
  courseId: 0,
  courseType: "",
  activityId: 0,
  courseName: "",
  classification: "",
  entityId: 0,
  introduceDate: format(new Date(), "yyyy-MM-dd"),
  suspensionDate: "",
  chargingPattern: "",
  sessionMinutes: 60,
  noOfDaysInWeek: 1,
  daysPattern: "12345",
  minEnrollmentUnits: 1,
  maxPerson: 1,
  batchCapacity: 1,
  totalParallelBatches: 1,
  minAge: 1,
  maxAge: 100,
  gender: "Any",
  balanceUsable: "",
  enrApprovalRequired: false,
  CGSTRate: 0,
  SGSTRate: 0,
  status: "",
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
  enrChangesAllowed: 0,
  enrFreezingAllowed: 0,
  minDaysInEnr: 0,
  discountOnDayReduce: 0,
  introduceDate: format(new Date(), "yyyy-MM-dd"),
  daySelection: false,
  freezing: 0,
  createdAt: "",
  updatedAt: "",
};

const defaultShares: CourseShare[] = [
  {
    courseShareId: 0,
    entityId: 8,
    courseId: 0,
    roleInCourse: "TSL Charges",
    share: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    courseShareId: 0,
    entityId: 8,
    courseId: 0,
    roleInCourse: "Facility Charges",
    share: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    courseShareId: 0,
    entityId: 8,
    courseId: 0,
    roleInCourse: "SGST",
    share: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    courseShareId: 0,
    entityId: 8,
    courseId: 0,
    roleInCourse: "CGST",
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
  const [entityOptions, setEntityOptions] = useState<Entity[]>([]);
  const [entityTypeOptions, setEntityTypeOptions] = useState<
    MembershipMaster[]
  >([]);
  const [shareEntityOptions, setShareEntityOptions] = useState<Entity[]>([]);

  const loadMasterData = useCallback(async () => {
    if (!isOpen) return;

    try {
      setLoadingOptions(true);
      setGlobalError(null);

      const [actRes, typeRes, membershipMasterRes, entityRes] =
        await Promise.all([
          getActivities({ limit: 500 }),
          getEnumsByCategory("courseType"),
          getMembershipMasters({ limit: 500 }),
          getEntities({ limit: 500 }),
        ]);

      setActivityOptions((actRes as Response<Activity[]>)?.data ?? []);
      setCourseTypeOptions((typeRes as Response<Enums[]>)?.data ?? []);
      setEntityTypeOptions(
        (membershipMasterRes as Response<MembershipMaster[]>)?.data ?? []
      );
      setShareEntityOptions((entityRes as Response<Entity[]>)?.data ?? []);

      await loadCourseAcademies();
    } catch {
      console.error("error");
    } finally {
      setLoadingOptions(false);
    }
  }, [isOpen]);

  const loadCourseAcademies = useCallback(async () => {
    try {
      const res: Response<Entity[]> = await getEntities({
        limit: 200,
      });
      const items = res?.data as Entity[];

      setEntityOptions(items);
    } catch {
      setEntityOptions([]);
    }
  }, []);

  useEffect(() => {
    loadMasterData();
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
        daysPattern: initialData.course.daysPattern
          ? numberToWeekArray(initialData.course.daysPattern as string)
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
    if (!c.activityId) e.activityName = "Activity is required";
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
      !c.daysPattern ||
      (Array.isArray(c.daysPattern) && c.daysPattern.length === 0)
    ) {
      e.daysPattern = "Select at least one weekday";
    }
    if (!c.entityId || c.entityId <= 0) e.entityId = "Entity is required";
    if (!c.classification) e.classification = "Classification is required";

    if (formState.rates.length === 0)
      e.rates = "At least one Course Rate must be added.";
    if (formState.shares.length === 0)
      e.shares = "At least one Course Share must be added.";

    const totalShare = formState.shares.reduce((sum, s) => {
      if (s.roleInCourse === "CGST" || s.roleInCourse === "SGST") {
        return sum;
      }
      return sum + (s.share || 0);
    }, 0);

    if (totalShare !== 100) {
      e.sharesTotal = `Total share must equal 100% (current: ${totalShare}%)`;
    }

    formState.rates.forEach((r, i) => {
      if (!r.unitRate) e[`rate_${i}_unitRate`] = "Rate required";
      if (!r.introduceDate) e[`rate_${i}_introduceDate`] = "Date required";
    });

    formState.shares.forEach((s, i) => {
      if (!s.entityId || s.entityId <= 0)
        e[`share_${i}_entityId`] = "Entity required";
      if (!s.roleInCourse) e[`share_${i}_roleInCourse`] = "Type required";
      if (s.share === undefined || s.share < 0 || s.share > 100)
        e[`share_${i}_share`] = "Share (0-100) required";
    });

    formState.packages.forEach((p, i) => {
      if (!p.linkType) e[`package_${i}_linkType`] = "Link Type required";
    });

    return e;
  }, [formState]);

  const handleSubmit = useCallback(async () => {
    console.log("1234567890");

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
        formState.course.daysPattern as any
      );
      const updatedFormState = {
        ...formState,
        course: {
          ...formState.course,
          daysPattern: String(availabilityCode),
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
    } catch {
      toast({
        title: "Failed",
        description: "failed to create course",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, validate, onSave, onClose]);

  const handleCourseChange = (
    field: keyof Course,
    value: string | number | boolean | null | string[]
  ) => {
    setFormState((p) => ({ ...p, course: { ...p.course, [field]: value } }));

    if (field === "activityId") {
      const activityId = value ? Number(value) : null;
      const selectedActivity = activityOptions.find(
        (a) => a.activityId === activityId
      );
      console.log(selectedActivity);

      setFormState((p: any) => ({
        ...p,
        course: {
          ...p.course,
          activityId,
          entityId: 0,
          classification: selectedActivity?.activityType ?? null,
        },
      }));
      loadCourseAcademies();
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

      if (field !== "share") {
        shares[index] = { ...current, [field]: value };
        return { ...p, shares };
      }

      const newValue = Number(value) || 0;
      const oldValue = current.share || 0;
      const delta = newValue - oldValue;

      const isTax = TAX_SHARE_TYPES.includes(current.roleInCourse || "");

      shares[index] = { ...current, share: newValue };

      if (isTax) {
        const otherTaxIndex = shares.findIndex(
          (s, i) =>
            i !== index && TAX_SHARE_TYPES.includes(s.roleInCourse || "")
        );

        if (otherTaxIndex !== -1) {
          shares[otherTaxIndex] = {
            ...shares[otherTaxIndex],
            share: newValue,
          };
        }

        return { ...p, shares };
      }

      const tslIndex = shares.findIndex(
        (s) => s.roleInCourse === "TSL Charges"
      );

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
    field: any,
    value: any
  ) => {
    setFormState((p) => {
      const updatedArray: any = [...p[key] as any];
      updatedArray[index] = {
        ...updatedArray[index],
        [field]: value,
      };
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
        entityId: 0,
        courseId: 0,
        roleInCourse: "",
        share: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (newItem) {
      setFormState((p: any) => ({
        ...p,
        [key]: [...p[key], newItem],
      }));
    }
  };

  const removeArrayItem = (key: keyof CourseFormState, index: number) => {
    setFormState((p: any) => ({
      ...p,
      [key]: p[key].filter((_: any, i: number) => i !== index),
    }));
  };

  const totalShare = useMemo(
    () => formState.shares.reduce((sum, s) => sum + (s.share || 0), 0),
    [formState.shares]
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0 overflow-hidden">
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
          <div className="flex-1 overflow-hidden min-h-[500px] flex flex-col">
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
                    entityOptions={entityOptions}
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
                    entityOptions={shareEntityOptions}
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
          <CourseFooter
            formState={formState}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onClose={onClose}
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}