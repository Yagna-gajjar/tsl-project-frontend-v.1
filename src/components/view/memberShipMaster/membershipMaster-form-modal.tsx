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
import type { MembershipMaster } from "@/types/memberShipMaster";
import type { Response } from "@/types/response";
import { getEntities } from "@/api/entity.api";
import type { Entity } from "@/types/entity";

type Props = {
  isOpen: boolean;
  initialData?: MembershipMaster;
  onClose: () => void;
  onSave: () => void;
};

const empty: MembershipMaster = {
  membershipMasterId: 0,
  membershipType: "",
  introductionDate: format(new Date(), "yyyy-MM-dd"),
  suspensionDate: undefined as unknown as Date,
  membershipDetails: "",
  durationDays: 1,
  minIssueCharge: 0,
  minDeposite: 0,
  minCBalance: 0,
  giftVoucher: 0,
  bookingDiscount: 0,
  graceDays: 0,
  regMemberIncluded: 0,
  guardianEntry: false,
  guestAllowed: false,
  rfid: "",
  clubAccess: false,
  birthdayVenueUsage: 0,
  anniversaryVenueUsage: 0,
  cancellationCharges: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  perMemberRegCharge: 0,
};

export default function MembershipMasterFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<MembershipMaster>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [identityTypeOpt, setIdentityTypeOpt] = useState<Entity[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const intro = initialData.introductionDate
        ? format(new Date(initialData.introductionDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");

      const suspend = initialData.suspensionDate
        ? format(new Date(initialData.suspensionDate), "yyyy-MM-dd")
        : "";

      setValues({
        ...initialData,
        introductionDate: intro,
        suspensionDate: suspend as unknown as Date,
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
        introductionDate: format(new Date(), "yyyy-MM-dd"),
        suspensionDate: "" as unknown as Date,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const fetchIdentyType = async () => {
      const res: Response<Entity[]> = await getEntities();
      const resOpt = res?.data as Entity[];
      setIdentityTypeOpt(resOpt);
    };

    fetchIdentyType();

    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  const onChange = (
    field: keyof MembershipMaster,
    val: string | number | boolean | Date
  ) => {
    setValues((p) => ({ ...p, [field]: val } as MembershipMaster));

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
      values.durationDays === undefined ||
      values.durationDays === null ||
      Number(values.durationDays) <= 0
    ) {
      errs.durationDays = "Duration (days) is required and must be > 0";
    }
    if (
      values.minIssueCharge === undefined ||
      Number(values.minIssueCharge) < 0
    ) {
      errs.minIssueCharge = "Issue charge is required (>= 0)";
    }
    if (!values.introductionDate) {
      errs.introductionDate = "Introduce date is required";
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
      const payload: Partial<MembershipMaster> = {
        membershipType: String(values.membershipType),
        introductionDate: new Date(values.introductionDate).toISOString(),
        suspensionDate: values.suspensionDate
          ? new Date(values.suspensionDate).toISOString()
          : undefined,
        billingEntityOfFamily: values.billingEntityOfFamily,
        membershipDetails: values.membershipDetails,
        durationDays: Number(values.durationDays),
        minIssueCharge: Number(values.minIssueCharge),
        perMemberRegCharge: Number(values.perMemberRegCharge),
        minDeposite: Number(values.minDeposite),
        minCBalance: Number(values.minCBalance),
        giftVoucher: Number(values.giftVoucher),
        bookingDiscount: Number(values.bookingDiscount),
        graceDays: Number(values.graceDays),
        regMemberIncluded: Number(values.regMemberIncluded),
        guardianEntry: Boolean(values.guardianEntry),
        guestAllowed: Boolean(values.guestAllowed),
        rfid: String(values.rfid || ""),
        clubAccess: Boolean(values.clubAccess),
        birthdayVenueUsage: Number(values.birthdayVenueUsage),
        anniversaryVenueUsage: Number(values.anniversaryVenueUsage),
        cancellationCharges: Number(values.cancellationCharges),
      };

      if (initialData?.membershipMasterId) {
        await updateMembershipMaster(
          initialData.membershipMasterId,
          payload as Partial<
            Omit<
              MembershipMaster,
              "MembershipMasterId" | "createdAt" | "updatedAt"
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
            MembershipMaster,
            "MembershipMasterId" | "createdAt" | "updatedAt"
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

  const fields: FormFieldConfig<MembershipMaster>[] = [
    {
      name: "membershipType",
      label: "Membership Type",
      type: "text",
      required: true,
    },
    {
      name: "identityTypeId",
      label: "Identity Type",
      type: "select",
      options: identityTypeOpt?.map((i) => ({
        value: i.entityId,
        label: i.entityName,
      })),
      required: true,
    },
    {
      name: "introductionDate",
      label: "Introduce Date",
      type: "Date",
      required: true,
    },
    {
      name: "suspensionDate",
      label: "Suspend Date",
      type: "Date",
      required: false,
    },
    {
      name: "billingEntityOfFamily",
      label: "Billing Entity Of Family",
      type: "text",
      required: false,
    },
    {
      name: "membershipDetails",
      label: "Details",
      type: "textarea",
      required: false,
    },
    {
      name: "durationDays",
      label: "Duration (days)",
      type: "number",
      required: true,
    },
    {
      name: "minDeposite",
      label: "Minimum Deposit",
      type: "number",
      required: true,
    },
    {
      name: "minIssueCharge",
      label: "Issue Charge",
      type: "number",
      required: true,
    },
    {
      name: "perMemberRegCharge",
      label: "Per Member Registration Charge",
      type: "number",
      required: true,
    },
    {
      name: "commPerMonthPerMember",
      label: "Commission / Month / Member",
      type: "number",
      required: false,
    },
    {
      name: "memberLimit",
      label: "Member Limit",
      type: "number",
      required: false,
    },
    {
      name: "commDiscountPerMember",
      label: "Commission Discount / Member",
      type: "number",
      required: false,
    },
    {
      name: "decreaseCommByPR",
      label: "Decrease Commission by PR",
      type: "number",
      required: false,
    },
    {
      name: "feePaymentComm",
      label: "Fee Payment Commission",
      type: "number",
      required: false,
    },
    {
      name: "minCBalance",
      label: "Minimum C Balance",
      type: "number",
      required: false,
    },
    {
      name: "giftVoucher",
      label: "Gift Voucher",
      type: "number",
      required: false,
    },
    {
      name: "bookingDiscount",
      label: "Booking Discount (%)",
      type: "number",
      required: false,
    },
    {
      name: "graceDays",
      label: "Grace Days",
      type: "number",
      required: false,
    },
    {
      name: "regMemberIncluded",
      label: "Registered Members Included",
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
    {
      name: "rfid",
      label: "RFID",
      type: "text",
      required: false,
    },
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
      label: "Birthday Venue Usage (count)",
      type: "number",
      required: false,
    },
    {
      name: "anniversaryVenueUsage",
      label: "Anniversary Venue Usage (count)",
      type: "number",
      required: false,
    },
    {
      name: "cancellationCharges",
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
                    field: keyof MembershipMaster,
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
