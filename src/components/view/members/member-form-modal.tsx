import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createMember, updateMember } from "@/api/member.api";
import type { Member } from "@/types/member";
import { toast } from "@/hooks/use-toast";
import type { FormFieldConfig } from "../../form-modal/types";
import type { Address } from "@/types/address";
import { createAccountMember } from "@/api/accountMember.api";
import { getEnumsByCategory } from "@/api/enums.api";
import type { Response } from "@/types/response";
import type { Enums } from "@/types/enums";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: (Partial<Member> & Partial<Address>) | null;
  onSaved?: (row: Member) => void;
  layout?: "grid" | "list";
};

type MemberFormState = Partial<Member> & {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
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
  const empty: MemberFormState = {
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
    remarks: initialData?.remarks ?? "",
    line1: initialData?.line1 ?? "",
    line2: initialData?.line2 ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    country: initialData?.country ?? "India",
    pinCode: initialData?.pinCode ?? "",
  };

  const [values, setValues] = useState<MemberFormState>(empty);
  const [loading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [defaultAccount, setDefaultAccount] = useState<number>(0);
  useEffect(() => {
    setValues({
      ...empty,
      ...(initialData ?? {}),
      line1: initialData?.line1 || "",
      line2: initialData?.line2 || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      country: initialData?.country || "India",
      pinCode: initialData?.pinCode || "",
    });

    setError(null);
    setFieldErrors({});

    const fetchDefaultAccount = async () => {
      try {
        const res: Response<Enums[]> = await getEnumsByCategory(
          "casual_account"
        );

        const defaultAccount = res?.data?.[0]?.value;
        if (!defaultAccount) {
          toast({
            title: "Error",
            description: "Can't find default casual account",
            variant: "destructive",
          });
          return;
        }

        setDefaultAccount(Number(defaultAccount));
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch default account",
          variant: "destructive",
        });
      }
    };

    fetchDefaultAccount();
  }, [initialData, isOpen]);

  const onChange = (field: keyof MemberFormState, val: any) => {
    setValues((p) => ({ ...p, [field]: val }));
    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const fields: FormFieldConfig<Member>[] = [
    {
      name: "memberFirstName",
      label: "First Name",
      type: "text",
      required: true,
    },
    { name: "memberMiddleName", label: "Middle Name", type: "text" },
    { name: "memberLastName", label: "Last Name", type: "text" },
    { name: "dob", label: "DOB", type: "Date", required: true },
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

    { name: "line1", label: "Address Line 1", type: "text", required: true },
    { name: "line2", label: "Address Line 2", type: "text" },
    { name: "city", label: "City", type: "text", required: true },
    { name: "state", label: "State", type: "text", required: true },
    { name: "country", label: "Country", type: "text", required: true },
    { name: "pinCode", label: "Pin Code", type: "text", required: true },

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

    if (!values.memberFirstName || String(values.memberFirstName).trim() === "")
      newFieldErrors.memberFirstName = "First name is required";
    if (!values.dob) newFieldErrors.dob = "Date of birth is required";
    if (!values.gender) newFieldErrors.gender = "Gender is required";
    if (!values.transportMode)
      newFieldErrors.transportMode = "Transport mode is required";

    if (!values.line1 || String(values.line1).trim() === "")
      newFieldErrors.line1 = "Address Line 1 is required";
    if (!values.city || String(values.city).trim() === "")
      newFieldErrors.city = "City is required";
    if (!values.state || String(values.state).trim() === "")
      newFieldErrors.state = "State is required";
    if (!values.country || String(values.country).trim() === "")
      newFieldErrors.country = "Country is required";
    if (!values.pinCode || String(values.pinCode).trim() === "")
      newFieldErrors.pinCode = "Pin Code is required";

    const emailVal = String(values.email ?? "").trim();
    if (emailVal && !validateEmail(emailVal))
      newFieldErrors.email = "Enter a valid email";

    const contactVal = String(values.contactNumber ?? "").trim();
    if (contactVal && !validatePhone(contactVal))
      newFieldErrors.contactNumber = "Enter a valid contact number (10 digits)";

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        memberFirstName: String(values.memberFirstName ?? "").trim(),
        memberMiddleName: values.memberMiddleName ?? "",
        memberLastName: values.memberLastName ?? "",
        dob: values.dob ? new Date(values.dob) : undefined,
        email: emailVal || undefined,
        relationship: values.relationship ?? "",
        bloodGroup: values.bloodGroup,
        gender: values.gender,
        status: values.status,
        schoolName: values.schoolName ?? "",
        qualification: values.qualification ?? "",
        idProofType: values.idProofType,
        idProofNumber: values.idProofNumber ?? "",
        contactNumber: contactVal || undefined,
        transportMode: values.transportMode,
        remarks: values.remarks ?? "",
        line1: values.line1,
        line2: values.line2,
        city: values.city,
        state: values.state,
        country: values.country,
        pinCode: values.pinCode,
      };
      let res: Response<Member>;
      if (isEdit && initialData?.memberId) {
        res = await updateMember(Number(initialData.memberId), payload);
      } else {
        if (defaultAccount === 0) {
          toast({
            title: "Error",
            description: "Can't Add Member, please define",
            variant: "destructive",
          });
        }

        res = await createMember(payload as Member);
      }

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
      const linkPayload: any = {
        accountId: Number(defaultAccount),
        linkBilling: false,
        memberId: Number(res?.data?.memberId),
        relationship: "casual member",
      };

      await createAccountMember(linkPayload);

      toast({
        title: isEdit ? "Member updated" : "Member created",
        description: `${String(payload.memberFirstName)} saved successfully.`,
        variant: "success",
      });

      onSaved?.(row as Member);
      onClose();
    } catch {
      const message = "Failed to save";
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
              onChange={onChange}
              layout={layout}
            />
          </div>
          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel={isEdit ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MemberFormModal;
