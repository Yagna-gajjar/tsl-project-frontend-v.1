"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createMember, updateMember } from "@/api/member.api";
import type { Member } from "@/types/member";
import { toast } from "@/hooks/use-toast";
import type { FormFieldConfig } from "../../form-modal/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Member> | null;
  onSaved?: (row: Member) => void;
  layout?: "grid" | "list";
};

const validateEmail = (email?: string) => {
  if (!email) return false;
  const s = String(email).trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(s);
};

const validatePhone = (phone?: string) => {
  if (!phone) return false;
  const s = String(phone).trim();
  const digits = s.replace(/\D/g, "");
  return digits.length == 10;
};

export function MemberFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  layout = "grid",
}: Props) {
  const isEdit = Boolean(initialData && initialData.memberId);

  const empty: Partial<Member> = {
    familyId: initialData?.familyId ?? undefined,
    memberFirstName: initialData?.memberFirstName ?? "",
    memberMiddleName: initialData?.memberMiddleName ?? "",
    memberLastName: initialData?.memberLastName ?? "",
    dob: initialData?.dob ? new Date(initialData.dob) : undefined,
    email: initialData?.email ?? "",
    relationship: initialData?.relationship ?? "",
    bloodGroup: initialData?.bloodGroup,
    gender: initialData?.gender ?? "male",
    status: initialData?.status ?? "active",
    schoolName: initialData?.schoolName ?? "",
    qualification: initialData?.qualification ?? "",
    idProofType: initialData?.idProofType,
    idProofNumber: initialData?.idProofNumber ?? "",
    contactNumber: initialData?.contactNumber ?? "",
    transportMode: initialData?.transportMode ?? "self drive",
    addressId: initialData?.addressId ?? undefined,
    remarks: initialData?.remarks ?? "",
  };

  const [values, setValues] = useState<Partial<Member>>(empty);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues({ ...empty, ...(initialData ?? {}) });
    setError(null);
    setFieldErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen]);

  const onChange = (field: keyof Member, val: any) => {
    setValues((p) => ({ ...p, [field]: val }));
    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const fields: FormFieldConfig[] = [
    {
      name: "familyId",
      label: "Family ID",
      type: "text",
      required: true,
      disabled: true,
    },
    {
      name: "memberFirstName",
      label: "First Name",
      type: "text",
      required: true,
    },
    { name: "memberMiddleName", label: "Middle Name", type: "text" },
    { name: "memberLastName", label: "Last Name", type: "text" },
    { name: "dob", label: "DOB", type: "date", required: true },
    { name: "email", label: "Email", type: "text" },
    { name: "contactNumber", label: "Contact Number", type: "text" },
    { name: "relationship", label: "Relationship", type: "text" },
    {
      name: "bloodGroup",
      label: "Blood Group",
      type: "select",
      options: [
        { label: "A+", value: "A+" },
        { label: "A-", value: "A-" },
        { label: "B+", value: "B+" },
        { label: "B-", value: "B-" },
        { label: "AB+", value: "AB+" },
        { label: "AB-", value: "AB-" },
        { label: "O+", value: "O+" },
        { label: "O-", value: "O-" },
      ],
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      options: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" },
      ],
      required: true,
    },
    {
      name: "transportMode",
      label: "Transport Mode",
      type: "select",
      options: [
        { label: "Self drive", value: "self drive" },
        { label: "Parents", value: "parents" },
        { label: "Van", value: "van" },
        { label: "Walking", value: "walking" },
        { label: "Other", value: "other" },
      ],
      required: true,
    },
    { name: "addressId", label: "Address ID", type: "text", required: true },
    { name: "schoolName", label: "School Name", type: "text" },
    { name: "qualification", label: "Qualification", type: "text" },
    {
      name: "idProofType",
      label: "ID Proof Type",
      type: "select",
      options: [
        { label: "Aadhar Card", value: "aadhar card" },
        { label: "PAN Card", value: "pan card" },
        { label: "Voter ID", value: "voter id" },
        { label: "Passport", value: "passport" },
        { label: "Driving License", value: "driving license" },
        { label: "Other", value: "other" },
      ],
    },
    { name: "idProofNumber", label: "ID Proof Number", type: "text" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Block", value: "block" },
      ],
    },
    { name: "remarks", label: "Remarks", type: "text" },
  ];

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    const newFieldErrors: Record<string, string> = {};

    // required checks
    if (!values.familyId && values.familyId !== 0)
      newFieldErrors.familyId = "Family ID is required";
    if (!values.memberFirstName || String(values.memberFirstName).trim() === "")
      newFieldErrors.memberFirstName = "First name is required";
    if (!values.dob) newFieldErrors.dob = "Date of birth is required";
    if (!values.gender) newFieldErrors.gender = "Gender is required";
    if (!values.transportMode)
      newFieldErrors.transportMode = "Transport mode is required";
    if (!values.addressId && values.addressId !== 0)
      newFieldErrors.addressId = "Address ID is required";

    // conditional validations
    const emailVal = String(values.email ?? "").trim();
    if (emailVal && !validateEmail(emailVal))
      newFieldErrors.email = "Enter a valid email";

    const contactVal = String(values.contactNumber ?? "").trim();
    if (contactVal && !validatePhone(contactVal))
      newFieldErrors.contactNumber =
        "Enter a valid contact number (10 digits)";

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: Partial<Member> = {
        familyId: Number(values.familyId),
        memberFirstName: String(values.memberFirstName ?? "").trim(),
        memberMiddleName: values.memberMiddleName ?? "",
        memberLastName: values.memberLastName ?? "",
        dob: values.dob ? new Date(values.dob) : undefined,
        email: emailVal || undefined,
        relationship: values.relationship ?? "",
        bloodGroup: values.bloodGroup as any,
        gender: values.gender as any,
        status: values.status as any,
        schoolName: values.schoolName ?? "",
        qualification: values.qualification ?? "",
        idProofType: values.idProofType as any,
        idProofNumber: values.idProofNumber ?? "",
        contactNumber: contactVal || undefined,
        transportMode: values.transportMode as any,
        addressId: Number(values.addressId),
        remarks: values.remarks ?? "",
      };

      let res: any;
      if (isEdit && initialData?.memberId) {
        res = await updateMember(Number(initialData.memberId), payload);
      } else {
        res = await createMember(payload as Member);
      }

      // Unified success handling
      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;

      const row = res?.data ?? res;

      if (!ok) {
        const msg = res?.message ?? "Failed to save";

        setError(msg);
        toast({
          title: "Save failed",
          description: msg,
          variant: "destructive",
        });

        return;
      }

      // SUCCESS TOAST
      toast({
        title: isEdit ? "Member updated" : "Member created",
        description: `${String(
          row?.memberFirstName ?? payload.memberFirstName
        )} saved successfully.`,
        variant: "success",
      });

      onSaved?.(row as Member);
      onClose();
    } catch (err: any) {
      const message = err?.message ?? "Failed to save";
      setError(message);

      toast({
        title: "Save failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
    
  }, [values, isEdit, initialData, onClose, onSaved]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          <FormHeader
            title={isEdit ? "Edit Member" : "Add Member"}
            onClose={onClose}
          />
          <div className="flex-1 overflow-y-auto">
            <FormContent
              fields={fields}
              values={values}
              errors={fieldErrors}
              loading={loading}
              error={error}
              isSubmitting={isSubmitting}
              onChange={onChange as any}
              layout={layout}
            />
          </div>
          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit as any}
            submitLabel={isEdit ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MemberFormModal;
