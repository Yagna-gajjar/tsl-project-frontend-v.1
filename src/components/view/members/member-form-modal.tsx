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
import { format } from "date-fns";

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
    regDate: initialData?.regDate ?? format(new Date(), "yyy-MM-dd"),
    suspensionDate: initialData?.suspensionDate ?? "",
    memberFirstName: initialData?.memberFirstName ?? "",
    memberMiddleName: initialData?.memberMiddleName ?? "",
    memberLastName: initialData?.memberLastName ?? "",
    dob: initialData?.dob ? new Date(initialData.dob) : undefined,
    email: initialData?.email ?? "",
    bloodGroup: initialData?.bloodGroup,
    gender: initialData?.gender ?? "male",
    personalStatus: initialData?.personalStatus ?? "",
    personalStatusOrganization: initialData?.personalStatusOrganization ?? "",
    personalStatusSector: initialData?.personalStatusSector ?? "",
    mothertongue: initialData?.mothertongue ?? "",
    qualification: initialData?.qualification ?? "",
    idProofType: initialData?.idProofType,
    idProofNumber: initialData?.idProofNumber ?? "",
    contactNumber: initialData?.contactNumber ?? "",
    transportMode: initialData?.transportMode ?? "self drive",
    remarks: initialData?.remarks ?? "",
    maritialStatus: initialData?.maritialStatus ?? "",
    adminInstruction: initialData?.adminInstruction,
    status: initialData?.status ?? "active",
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
  const [personalStatusEnum, setPersonalStatusEnum] = useState<Enums[]>([]);
  const [personalStatusSectorEnum, setPersonalStatusSectorEnum] = useState<
    Enums[]
  >([]);
  const [qualificationEnum, setqualificationEnum] = useState<Enums[]>([]);
  const [idProofTypeEnum, setIdProofTypeEnum] = useState<Enums[]>([]);
  const [transportModeEnum, setTransportModeEnum] = useState<Enums[]>([]);
  const [maritialStatusEnum, setmaritialStatusEnum] = useState<Enums[]>([]);
  const [adminInstructionEnum, setadminInstructionEnum] = useState<Enums[]>([]);
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
      } catch  {
        toast({
          title: "Error",
          description: "Failed to fetch default account",
          variant: "destructive",
        });
      }
    };

    const fetchEnumByCategory = async (
      category: string,
      setState: React.Dispatch<React.SetStateAction<Enums[]>>
    ) => {
      try {
        const res: Response<Enums[]> = await getEnumsByCategory(category);
        setState(res?.data ?? []);
      } catch (err) {
        console.error(`Failed to fetch enum: ${category}`, err);
        setState([]);
      }
    };

    if (isOpen) {

      fetchDefaultAccount();
      fetchEnumByCategory("PERSONALSTATUS", setPersonalStatusEnum);
      fetchEnumByCategory("personalStatusSector", setPersonalStatusSectorEnum);
      fetchEnumByCategory("QUALIFICATION", setqualificationEnum);
      fetchEnumByCategory("IDPROOFTYPE", setIdProofTypeEnum);
      fetchEnumByCategory("TRANSPORTMODE", setTransportModeEnum);
      fetchEnumByCategory("maritialStatus", setmaritialStatusEnum);
      fetchEnumByCategory("adminInstructionS", setadminInstructionEnum);
    }
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
      name: "personalStatus",
      label: "Personal Status",
      type: "select",
      options: personalStatusEnum?.map((p) => ({
        value: p.value,
        label: p.value,
      })),
    },
    {
      name: "personalStatusOrganization",
      label: "Personal Status Organization",
      type: "text",
    },
    {
      name: "personalStatusSector",
      label: "Personal Status Sector",
      type: "select",
      options: personalStatusSectorEnum?.map((p) => ({
        value: p.value,
        label: p.value,
      })),
    },
    {
      name: "mothertongue",
      label: "Mothertongue",
      type: "text",
      required: true,
    },
    {
      name: "qualification",
      label: "Qualification",
      type: "select",
      options: qualificationEnum?.map((q) => ({
        value: q.value,
        label: q.value,
      })),
      required: true,
    },
    {
      name: "idProofType",
      label: "ID Proof Type",
      type: "select",
      options: idProofTypeEnum?.map((i) => ({
        value: i.value,
        label: i.value,
      })),
    },
    { name: "idProofNumber", label: "ID Proof Number", type: "text" },
    { name: "contactNumber", label: "Contact Number", type: "text" },
    {
      name: "transportMode",
      label: "Transport Mode",
      type: "select",
      options: transportModeEnum?.map((t) => ({
        value: t.value,
        label: t.value,
      })),
      required: true,
    },
    { name: "line1", label: "Address Line 1", type: "text", required: true },
    { name: "line2", label: "Address Line 2", type: "text" },
    { name: "city", label: "City", type: "text", required: true },
    { name: "state", label: "State", type: "text", required: true },
    { name: "country", label: "Country", type: "text", required: true },
    { name: "pinCode", label: "Pin Code", type: "text", required: true },
    {
      name: "maritialStatus",
      label: "maritialStatus",
      type: "select",
      options: maritialStatusEnum?.map((m) => ({
        value: m.value,
        label: m.value,
      })),
    },
    {
      name: "adminInstruction",
      label: "Admit Instruction",
      type: "select",
      options: adminInstructionEnum?.map((m) => ({
        value: m.value,
        label: m.value,
      })),
    },
    {
      name: "regDate",
      label: "Registration Date",
      type: "Date",
      required: true,
    },
    {
      name: "suspensionDate",
      label: "suspension Date",
      type: "Date",
      required: true,
    },
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
      const payload: Member | any = {
        regDate: new Date(values?.regDate as any),
        suspensionDate: values.suspensionDate ?? "",
        memberFirstName: String(values.memberFirstName ?? "").trim(),
        memberMiddleName: values.memberMiddleName ?? "",
        memberLastName: values.memberLastName ?? "",
        dob: values.dob ? new Date(values.dob) : undefined,
        email: emailVal || undefined,
        bloodGroup: values.bloodGroup,
        gender: values.gender ?? "",
        personalStatus: values.personalStatus ?? "",
        personalStatusOrganization: values.personalStatusOrganization ?? "",
        personalStatusSector: values.personalStatusSector ?? "",
        mothertongue: values.mothertongue ?? "",
        qualification: values.qualification ?? "",
        idProofType: values.idProofType,
        idProofNumber: values.idProofNumber ?? "",
        contactNumber: contactVal || undefined,
        transportMode: values.transportMode ?? "",
        remarks: values.remarks ?? "",
        line1: values.line1,
        line2: values.line2,
        city: values.city,
        state: values.state,
        country: values.country,
        pinCode: values.pinCode,
        maritialStatus: values.maritialStatus ?? "",
        adminInstruction: values.adminInstruction ?? "",
        status: values.status ?? "active",
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
