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
import { toast } from "@/hooks/use-toast";
import type { Entity } from "@/types/entity";
import { SharesList } from "./course-form/share-list";
import { RatesList } from "./course-form/rate-list";
import { PackagesList } from "./course-form/package-list";
import { CourseForm } from "./course-form/course-list";
import CourseFooter from "./course-form/course-footer";
import { getCourseRates, createCourseRate, updateCourseRate, deleteCourseRate } from "@/api/courseRate.api";
import { getCourseShares, createCourseShare, updateCourseShare, deleteCourseShare } from "@/api/courseShare.api";
import { getCoursePackages, createCoursePackage, updateCoursePackage, deleteCoursePackage } from "@/api/coursePackage.api";
import { createFullCourse, updateCourse } from "@/api/course.api";
import { getAccounts } from "@/api/account.api";
import type { Account } from "@/types/account";

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
  avbFrom: format(new Date(), "HH-mm"),
  avbTo: format(new Date(), "HH-mm"),
  chargingPattern: "",
  noOfDaysInWeek: 1,
  daysPattern: "12345",
  maxPerson: 1,
  batchCapacity: 1,
  totalParallelBatches: 1,
  minAge: 1,
  maxAge: 100,
  gender: "O",
  balanceUsable: "",
  enrApprovalRequired: false,
  cgstRate: 0,
  sgstRate: 0,
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

const defaultShares: CourseShare[] = [
  {
    courseShareId: 0,
    accountId: 8,
    courseId: 0,
    roleInCourse: "TSL",
    share: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    courseShareId: 0,
    accountId: 8,
    courseId: 0,
    roleInCourse: "Facility",
    share: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    courseShareId: 0,
    accountId: 8,
    courseId: 0,
    roleInCourse: "SGST",
    share: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    courseShareId: 0,
    accountId: 8,
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

const TAX_SHARE_TYPES = ["CGST", "SGST"];

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

  const [originalState, setOriginalState] = useState<CourseFormState | null>(null);
  const [activityOptions, setActivityOptions] = useState<Activity[]>([]);
  const [courseTypeOptions, setCourseTypeOptions] = useState<Enums[]>([]);
  const [courseStatusOptions, setCourseStatusOptions] = useState<Enums[]>([]);
  const [roleInCourse, setRoleInCourse] = useState<Enums[]>([]);
  const [entityOptions, setEntityOptions] = useState<Entity[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [shareEntityOptions, setShareEntityOptions] = useState<Account[]>([]);
  const [selectedMembership, setSelectedMembership] = useState<number | null>(null);

  const loadMasterData = useCallback(async () => {
    if (!isOpen) return;

    try {
      setLoadingOptions(true);
      setGlobalError(null);

      const [actRes, typeRes, accountRes, roleInCourseRes, statusRes] =
        await Promise.all([
          getActivities({ limit: 500 }),
          getEnumsByCategory("COURSETYPE"),
          getAccounts({ limit: 5000, excludeEntityId: 20 }),
          getEnumsByCategory("ROLEINCOURSE"),
          getEnumsByCategory("COURSESTATUS"),
        ]);

      setActivityOptions((actRes as Response<Activity[]>)?.data ?? []);
      setCourseTypeOptions((typeRes as Response<Enums[]>)?.data ?? []);
      setRoleInCourse((roleInCourseRes as Response<Enums[]>)?.data ?? []);
      setShareEntityOptions((accountRes as Response<Account[]>)?.data ?? []);
      setCourseStatusOptions((statusRes as Response<Enums[]>)?.data ?? []);

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

  const fetchRelationalData = useCallback(async (courseId: number, courseShell: any) => {
    try {
      setIsFetchingData(true);

      const [ratesRes, sharesRes, packagesRes] = await Promise.all([
        getCourseRates({ courseId }),
        getCourseShares({ courseId }),
        getCoursePackages({ courseId }),
      ]);

      const fetchedRates = ratesRes.data || [];
      const fetchedShares = sharesRes.data || [];
      const fetchedPackages = packagesRes.data || [];

      const fullData = {
        course: courseShell,
        rates: fetchedRates,
        shares: fetchedShares,
        packages: fetchedPackages,
      };
      setFormState(fullData);
      setOriginalState(JSON.parse(JSON.stringify(fullData)));

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load relational data",
        variant: "destructive",
      });
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    if (isOpen && initialData?.course?.courseId) {
      const courseId = initialData.course.courseId;
      const courseShell = {
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

      fetchRelationalData(courseId, courseShell);
    } else if (isOpen && !initialData) {
      setFormState(initialFormState);
      setOriginalState(JSON.parse(JSON.stringify(initialFormState)));
    }
  }, [isOpen, initialData, fetchRelationalData]);

  const validate = useCallback((): Record<string, string> => {
    const e: Record<string, string> = {};
    const c = formState.course;

    if (!c.courseName?.trim()) e.courseName = "Course name is required";
    if (!c.activityId) e.activityName = "Activity is required";
    if (!c.courseType) e.courseType = "Course type is required";
    if (!c.introduceDate) e.introduceDate = "Introduce date is required";
    if (c.noOfDaysInWeek === undefined || c.noOfDaysInWeek <= 0)
      e.noOfDaysInWeek = "Days per week must be > 0";
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
      return sum + Number(s.share || 0);
    }, 0);

    if (totalShare !== 100) {
      e.sharesTotal = `Total share must equal 100% (current: ${totalShare}%)`;
    }

    formState.shares.forEach((s, i) => {
      if (!s.accountId || s.accountId <= 0)
        e[`share_${i}accountId`] = "Entity required";
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
    setIsSubmitting(true);
    setGlobalError(null);

    const vErrors = validate();
    setErrors(vErrors);
    if (Object.keys(vErrors).length) {
      setIsSubmitting(false);
      return;
    }
    try {
      const availabilityCode = weekArrayToNumber(formState.course.daysPattern as any);
      const isUpdate = !!formState.course.courseId;
      const courseId = formState.course.courseId;

      const courseData = {
        ...formState.course,
        daysPattern: String(availabilityCode),
        suspensionDate: formState.course.suspensionDate || null,
      };

      if (isUpdate) {
        const courseRes = await updateCourse(courseId, courseData);
        if (!courseRes?.success) {
          throw new Error(courseRes?.message || "Failed to update course");
        }

        const originalRates = originalState?.rates || [];
        const currentRates = formState.rates;

        for (const originalRate of originalRates) {
          if (!currentRates.find(r => r.courseRateId === originalRate.courseRateId)) {
            await deleteCourseRate(Number(originalRate.courseRateId));
          }
        }

        for (const rate of currentRates) {
          const rateData = {
            courseId,
            membershipMasterId: rate.membershipMasterId,
            aboveUnits: rate.aboveUnits || 0,
            unitRate: rate.unitRate,
            introduceDate: rate.introduceDate || new Date().toISOString(),
            suspensionDate: rate.suspensionDate || null,
            enrChangesAllowed: rate.enrChangesAllowed ?? false,
            enrFreezingAllowed: rate.enrFreezingAllowed ?? false,
            minDaysInEnr: rate.minDaysInEnr || 0,
            discountOnDayReduce: rate.discountOnDayReduce || 0,
            status: rate.status || "active",
          };

          const rateRes = rate.courseRateId && rate.courseRateId > 0
            ? await updateCourseRate(rate.courseRateId, rateData as any)
            : await createCourseRate(rateData as any);

          if (!rateRes?.success) {
            throw new Error(rateRes?.message || "Failed to save course rate");
          }
        }

        const originalShares = originalState?.shares || [];
        const currentShares = formState.shares;

        for (const originalShare of originalShares) {
          if (!currentShares.find(s => s.courseShareId === originalShare.courseShareId)) {
            await deleteCourseShare(Number(originalShare.courseShareId));
          }
        }

        for (const share of currentShares) {
          const shareData = {
            courseId,
            accountId: share.accountId,
            roleInCourse: share.roleInCourse,
            share: share.share || 0,
            cgst: share.cgst || 0,
            sgst: share.sgst || 0,
            approvalAuthorityId: share.approvalAuthorityId || null,
          };

          const shareRes = share.courseShareId && share.courseShareId > 0
            ? await updateCourseShare(share.courseShareId, shareData as any)
            : await createCourseShare(shareData as any);

          if (!shareRes?.success) {
            throw new Error(shareRes?.message || "Failed to save course share");
          }
        }

        // 4. Handle Packages - Compare with original and apply changes
        const originalPackages = originalState?.packages || [];
        const currentPackages = formState.packages;

        // Delete removed packages
        for (const originalPkg of originalPackages) {
          if (!currentPackages.find(p => p.coursePackageId === originalPkg.coursePackageId)) {
            await deleteCoursePackage(Number(originalPkg.coursePackageId));
          }
        }

        // Create or update packages
        for (const pkg of currentPackages) {
          const pkgData = {
            courseId,
            linkType: pkg.linkType,
            activityId: pkg.activityId || null,
            approvalAuthorityId: pkg.approvalAuthorityId || null,
          };

          const pkgRes = pkg.coursePackageId && pkg.coursePackageId > 0
            ? await updateCoursePackage(pkg.coursePackageId, pkgData as any)
            : await createCoursePackage(pkgData as any);

          if (!pkgRes?.success) {
            throw new Error(pkgRes?.message || "Failed to save course package");
          }
        }

        toast({ title: "Success", description: "Course updated successfully", variant: "default" });
      } else {
        // CREATE MODE - Use createFullCourse for atomic transaction
        const createPayload = {
          course: courseData,
          packages: formState.packages.map(p => ({
            linkType: p.linkType,
            activityId: p.activityId || null,
            approvalAuthorityId: p.approvalAuthorityId || null,
          })),
          rates: formState.rates.map(r => ({
            membershipMasterId: r.membershipMasterId,
            aboveUnits: r.aboveUnits || 0,
            unitRate: r.unitRate,
            introduceDate: r.introduceDate || new Date().toISOString(),
            suspensionDate: r.suspensionDate || null,
            enrChangesAllowed: r.enrChangesAllowed ?? false,
            enrFreezingAllowed: r.enrFreezingAllowed ?? false,
            minDaysInEnr: r.minDaysInEnr || 0,
            discountOnDayReduce: r.discountOnDayReduce || 0,
            status: r.status || "active",
          })),
          shares: formState.shares.map(s => ({
            accountId: s.accountId,
            roleInCourse: s.roleInCourse,
            share: s.share || 0,
            cgst: s.cgst || 0,
            sgst: s.sgst || 0,
            approvalAuthorityId: s.approvalAuthorityId || null,
          })),
        };

        const res = await createFullCourse(createPayload);
        if (!res?.success) {
          throw new Error(res?.message || "Failed to create course");
        }
        toast({ title: "Success", description: "Course created successfully", variant: "default" });
      }

      onSave();
      onClose();
    } catch (error: any) {
      setGlobalError(error?.message || "Failed to save course");
      toast({ title: "Error", description: error?.message || "Failed to save", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, originalState, validate, onSave, onClose]);

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
      shares[index] = { ...current, share: newValue };

      const isTax = TAX_SHARE_TYPES.includes(current.roleInCourse || "");

      if (isTax) {
        shares.forEach((s, i) => {
          if (
            i !== index &&
            TAX_SHARE_TYPES.includes(s.roleInCourse || "")
          ) {
            shares[i] = { ...s, share: newValue };
          }
        });
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
    else if (key === "rates") {

      if (selectedMembership === 0 || selectedMembership == null) {
        toast({
          title: "error",
          description: "need to select membership",
          variant: "destructive"
        })
      } else {
        newItem = {
          membershipMasterId: selectedMembership,
          courseRateId: 0,
          courseId: 0,
          membershipType: "",
          aboveUnits: 0,
          unitRate: 0,
          enrChangesAllowed: 0,
          enrFreezingAllowed: 0,
          minDaysInEnr: 0,
          discountOnDayReduce: 0,
          introduceDate: format(new Date(), "yyyy-MM-dd"),
          daySelection: false,
        }
      }
    }
    else if (key === "shares") {
      newItem = {
        courseShareId: 0,
        accountId: 0,
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
    () => formState.shares.reduce((sum, s) => sum + Number(s.share || 0), 0),
    [formState.shares]
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0 overflow-hidden">
        {isFetchingData ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading course details...</p>
          </div>
        ) : (
          <motion.div>
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
                        courseStatusOptions={courseStatusOptions}
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
                        selectedMembership={selectedMembership}
                        setSelectedMembership={setSelectedMembership as any}
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
                        roleInCourse={roleInCourse as any}
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

              <CourseFooter
                formState={formState}
                handleSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                onClose={onClose}
              />
            </motion.div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}