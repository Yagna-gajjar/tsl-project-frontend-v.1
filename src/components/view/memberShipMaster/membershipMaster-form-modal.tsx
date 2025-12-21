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
  entityname: "",
  introductionDate: format(new Date(), "yyyy-MM-dd"),
  suspensionDate: undefined as unknown as Date,
  membershipDetails: "",
  durationDays: 1,
  minIssueCharge: 0,
  caDepositPR: 0,
  cBalPrInCa: 0,
  vBalPrInCa: 0,
  graceDays: 0,
  guestAllowed: false,
  clubAccess: false,
  birthdayVenueUsage: 0,
  anniversaryVenueUsage: 0,
  cancelChargesPrOnCa: 0,
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

  const [entityOpt, setEntityOpt] = useState<Entity[]>([]);
  const [entityPage, setEntityPage] = useState(1);
  const [hasMoreEntity, setHasMoreEntity] = useState(true);
  const [loadingEntity, setLoadingEntity] = useState(false);
  const PAGE_SIZE = 20;

  const fetchEntity = useCallback(
    async (isInitial = false) => {
      if (loadingEntity || (!hasMoreEntity && !isInitial)) return;
      setLoadingEntity(true);
      try {
        const page = isInitial ? 1 : entityPage;
        const response: Response<Entity[]> = await getEntities({
          limit: PAGE_SIZE,
          page,
        });
        const items = response?.data || ([] as Entity[]);
        setEntityOpt((prev) => (isInitial ? items : [...prev, ...items]));
        setHasMoreEntity(items.length === PAGE_SIZE);
        setEntityPage(page + 1);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch members",
          variant: "destructive",
        });
      } finally {
        setLoadingEntity(false);
      }
    },
    [loadingEntity, hasMoreEntity, entityPage]
  );

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
    fetchEntity();
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
        entityId: Number(values.entityId),
        introductionDate: new Date(values.introductionDate).toISOString(),
        suspensionDate: values.suspensionDate
          ? new Date(values.suspensionDate).toISOString()
          : undefined,
        billingEntityOfFamily: values.billingEntityOfFamily,
        membershipDetails: values.membershipDetails,
        durationDays: Number(values.durationDays),
        caDepositPR: Number(values.caDepositPR),
        minIssueCharge: Number(values.minIssueCharge),
        perMemberRegCharge: Number(values.perMemberRegCharge),
        memberLimit: Number(values.memberLimit),
        caPerMemberPerMonth: Number(values.caPerMemberPerMonth),
        disOnCaUptoMembers: Number(values.disOnCaUptoMembers),
        descreaseCaByPercentage: Number(values.descreaseCaByPercentage),
        fBalPrInCa: Number(values.fBalPrInCa),
        cBalPrInCa: Number(values.cBalPrInCa),
        vBalPrInCa: Number(values.vBalPrInCa),
        graceDays: Number(values.graceDays),
        guestAllowed: Boolean(values.guestAllowed),
        clubAccess: Boolean(values.clubAccess),
        birthdayVenueUsage: Number(values.birthdayVenueUsage),
        anniversaryVenueUsage: Number(values.anniversaryVenueUsage),
        cancelChargesPrOnCa: Number(values.cancelChargesPrOnCa),
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
      name: "entityId",
      label: "EntityName",
      type: "select",
      options: entityOpt?.map((e) => ({
        value: e.entityId,
        label: e.entityName,
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
      name: "caDepositPR",
      label: "CA Deposit (%)",
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
      name: "caPerMemberPerMonth",
      label: "Commitment / Month / Member",
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
      name: "disOnCaUptoMembers",
      label: "Discount On CA Upto Members",
      type: "number",
      required: false,
    },
    {
      name: "descreaseCaByPercentage",
      label: "Decrease Commitment by PR (%)",
      type: "number",
      required: false,
    },
    {
      name: "fBalPrInCa",
      label: "Fee Balance PR In CA",
      type: "number",
      required: false,
    },
    {
      name: "cBalPrInCa",
      label: "C Balance PR In CA",
      type: "number",
      required: false,
    },
    {
      name: "vBalPrInCa",
      label: "V Balance PR In CA",
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
      name: "cancelChargesPrOnCa",
      label: "Cancellation Charges PR on CA",
      type: "number",
      required: false,
    },
    {
      name: "status",
      label: "Status",
      type: "text",
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
