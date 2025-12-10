import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import {
  createMembershipMaster,
  updateMembershipMaster,
} from "@/api/membershipMaster.api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { membershipMaster } from "@/types/memberShipMaster";

type Props = {
  isOpen: boolean;
  initialData?: membershipMaster;
  onClose: () => void;
  onSave: () => void;
};

const empty: membershipMaster = {
  membershipMasterId: 0,
  membershipType: "",
  introduceDate: format(new Date(), "yyyy-MM-dd") as any,
  suspendDate: undefined as unknown as Date,
  membershipDetails: "",
  membershipDurationInDays: 0,
  issueCharge: 0,
  minFBalance: 0,
  minCBalance: 0,
  minVBalance: 0,
  bookingDiscount: 0,
  graceDays: 0,
  regMemberIncluded: 0,
  guardianEntry: false,
  guestAllowed: false,
  rfid: "",
  clubAccess: false,
  birthdayVenueUsage: false,
  anniversaryVenueUsage: false,
  cancallationCharges: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function MembershipMasterFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<membershipMaster>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const intro = initialData.introduceDate
        ? format(new Date(initialData.introduceDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");

      const suspend = initialData.suspendDate
        ? format(new Date(initialData.suspendDate), "yyyy-MM-dd")
        : "";

      setValues({
        ...initialData,
        introduceDate: intro as any,
        suspendDate: suspend as unknown as Date,
        createdAt: initialData.createdAt
          ? new Date(initialData.createdAt)
          : new Date(),
        updatedAt: initialData.updatedAt
          ? new Date(initialData.updatedAt)
          : new Date(),
      });
    } else {
      setValues({
        ...empty,
        introduceDate: format(new Date(), "yyyy-MM-dd") as any,
        suspendDate: "" as unknown as Date,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);
  const onChange = (
    field: keyof membershipMaster,
    val: string | number | boolean | Date
  ) => {
    setValues((p) => ({ ...p, [field]: val } as membershipMaster));

    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!values.membershipType || String(values.membershipType).trim() === "") {
      errs.membershipType = "Membership type is required";
    }
    if (
      values.membershipDurationInDays === undefined ||
      values.membershipDurationInDays === null ||
      Number(values.membershipDurationInDays) <= 0
    ) {
      errs.membershipDurationInDays = "Duration (days) is required";
    }
    if (values.issueCharge === undefined || Number(values.issueCharge) < 0) {
      errs.issueCharge = "Issue charge is required (>= 0)";
    }
    if (!values.introduceDate) {
      errs.introduceDate = "Introduce date is required";
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
      const payload: Partial<membershipMaster> = {
        membershipType: String(values.membershipType),
        introduceDate: new Date(values.introduceDate).toISOString(),
        suspendDate: values.suspendDate
          ? new Date(values.suspendDate).toISOString()
          : undefined,
        membershipDetails: values.membershipDetails,
        membershipDurationInDays: Number(values.membershipDurationInDays),
        issueCharge: Number(values.issueCharge),
        minFBalance: Number(values.minFBalance),
        minCBalance: Number(values.minCBalance),
        minVBalance: Number(values.minVBalance),
        bookingDiscount: Number(values.bookingDiscount),
        graceDays: Number(values.graceDays),
        regMemberIncluded: Number(values.regMemberIncluded),
        guardianEntry: Boolean(values.guardianEntry),
        guestAllowed: Boolean(values.guestAllowed),
        rfid: String(values.rfid || ""),
        clubAccess: Boolean(values.clubAccess),
        birthdayVenueUsage: Boolean(values.birthdayVenueUsage),
        anniversaryVenueUsage: Boolean(values.anniversaryVenueUsage),
        cancallationCharges: Number(values.cancallationCharges),
      };

      if (initialData?.membershipMasterId) {
        await updateMembershipMaster(
          initialData.membershipMasterId,
          payload as Partial<
            Omit<
              membershipMaster,
              "membershipMasterId" | "createdAt" | "updatedAt"
            >
          >
        );
        toast({
          title: "Success",
          description: "Membership master updated successfully",
          variant: "default",
        });
      } else {
        await createMembershipMaster(
          payload as Omit<
            membershipMaster,
            "membershipMasterId" | "createdAt" | "updatedAt"
          >
        );
        toast({
          title: "Success",
          description: "Membership master created successfully",
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

  const fields:FormFieldConfig<membershipMaster>[] = [
    {
      name: "membershipType",
      label: "Membership Type",
      type: "text",
      required: true,
    },
    {
      name: "introduceDate",
      label: "Introduce Date",
      type: "Date",
      required: true,
    },
    {
      name: "suspendDate",
      label: "Suspend Date",
      type: "Date",
      required: false,
    },
    {
      name: "membershipDetails",
      label: "Details",
      type: "textarea",
      required: false,
    },
    {
      name: "membershipDurationInDays",
      label: "Duration (days)",
      type: "number",
      required: true,
    },
    {
      name: "issueCharge",
      label: "Issue Charge",
      type: "number",
      required: true,
    },
    {
      name: "minFBalance",
      label: "Min F Balance",
      type: "number",
      required: false,
    },
    {
      name: "minCBalance",
      label: "Min C Balance",
      type: "number",
      required: false,
    },
    {
      name: "minVBalance",
      label: "Min V Balance",
      type: "number",
      required: false,
    },
    {
      name: "bookingDiscount",
      label: "Booking Discount (%)",
      type: "number",
      required: false,
    },
    { name: "graceDays", label: "Grace Days", type: "number", required: false },
    {
      name: "regMemberIncluded",
      label: "Reg Members Included",
      type: "number",
      required: false,
    },
    {
      name: "guardianEntry",
      label: "Guardian Entry",
      type: "select",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
      required: false,
    },
    {
      name: "guestAllowed",
      label: "Guest Allowed",
      type: "select",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
      required: false,
    },
    { name: "rfid", label: "RFID", type: "text", required: false },
    {
      name: "clubAccess",
      label: "Club Access",
      type: "select",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
      required: false,
    },
    {
      name: "birthdayVenueUsage",
      label: "Birthday Venue Usage",
      type: "select",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
      required: false,
    },
    {
      name: "anniversaryVenueUsage",
      label: "Anniversary Venue Usage",
      type: "select",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
      required: false,
    },
    {
      name: "cancallationCharges",
      label: "Cancellation Charges",
      type: "number",
      required: false,
    },
  ];

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <div>
        <DialogContent className="max-w-3xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
          <div className="flex flex-col max-h-[90vh] overflow-hidden">
            <FormHeader
              title={
                initialData?.membershipMasterId
                  ? "Edit Membership"
                  : "Add New Membership"
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
                    field: keyof membershipMaster,
                    value: string | number | boolean
                  ) => void
                }
                layout="grid"
              />
            </div>
            <FormFooter
              onClose={onClose}
              onSubmit={handleSubmit}
              submitLabel={
                initialData?.membershipMasterId ? "Update" : "Create"
              }
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
