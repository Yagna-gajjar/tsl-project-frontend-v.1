"use client";

import React, { useCallback, useState } from "react";
import {
  ViewModal,
  type FieldConfig,
} from "@/components/view-modal/view-modal";
import type { Family } from "@/types/family";
import { Badge } from "@/components/ui/badge";
import MemberFormModal from "../members/member-form-modal";
import { useNavigate } from "react-router-dom";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: Family | null;
};

const baseViewFields: FieldConfig<Family>[] = [
  {
    key: "addMember",
    label: "Expand Family",
    type: "button",
    button: {
      label: "Add Member",
      variant: "default",
      size: "sm",
      span: 1,
      // onClick will be injected in the component to open Member form with family prefill
      onClick: undefined,
    },
  },
  {
    key: "viewMember",
    label: "View All Members",
    type: "button",
    button: {
      label: "View Member",
      variant: "default",
      size: "sm",
      span: 1,
      // onClick will be injected in the component to open Member form with family prefill
      onClick: undefined,
    },
  },
  { key: "familyName", label: "Family Name" },
  { key: "familyTypeName", label: "Family Type" },
  { key: "teamCategoryName", label: "Team Category" },
  { key: "identityTypeName", label: "Identity Type" },
  { key: "profession", label: "Profession" },
  { key: "professionDetails", label: "Profession Details" },
  { key: "designation", label: "Designation" },
  { key: "emergencyContact", label: "Emergency Contact" },
  { key: "remarks", label: "Remarks" },
  { key: "email", label: "Email" },
  {
    key: "status",
    label: "Status",
    render: (value: any) =>
      typeof value === "string" ? (
        <Badge variant={value === "active" ? "default" : "secondary"}>
          {String(value)}
        </Badge>
      ) : (
        String(value ?? "-")
      ),
  },
  { key: "preferredLanguage", label: "Preferred Language" },
  {
    key: "createdAt",
    label: "Created At",
    render: (value: any) => (value ? new Date(value).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    render: (value: any) => (value ? new Date(value).toLocaleString() : "-"),
  },
];

export default function FamilyViewModal({ isOpen, onClose, item }: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      if (!item) throw new Error("No data");
      return item;
    },
    [item]
  );

  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [memberInitialData, setMemberInitialData] =
    useState<Partial<any> | null>(null);

  // open member form and prefill familyId (and optionally familyName)
  const openAddMemberForFamily = (family: Family | undefined | null) => {
    if (!family) return;
    setMemberInitialData({
      familyId: family.familyId,
      // you can prefill other member defaults here if needed
    });
    setMemberFormOpen(true);
  };
  const navigate = useNavigate();
  // inject runtime onClick into button field so it receives the current row (data)
  const fields = baseViewFields.map((f) => {
    if (f.key === "addMember") {
      return {
        ...f,
        button: {
          ...f.button,
          onClick: (row: Family) => {
            // prefer the passed row, fallback to 'item' from props
            openAddMemberForFamily(row ?? item ?? null);
          },
        },
      } as FieldConfig<Family>;
    } else if (f.key === "viewMember") {
      return {
        ...f,
        button: {
          ...f.button,
          onClick: (row: Family) => {
            const familyId = row?.familyId ?? item?.familyId;
            if (!familyId) return;

            navigate(`/member?familyId=${familyId}`);
          },
        },
      } as FieldConfig<Family>;
    }
  
    return f;
  });

  return (
    <>
      <ViewModal<Family>
        isOpen={isOpen}
        onClose={onClose}
        itemId={item?.familyId}
        fetchFn={fetchFn}
        fields={fields as any}
        title="View Family"
      />

      <MemberFormModal
        isOpen={memberFormOpen}
        onClose={() => {
          setMemberFormOpen(false);
          setMemberInitialData(null);
        }}
        initialData={memberInitialData}
        onSaved={() => {
          // close the member form after save
          setMemberFormOpen(false);
          // optionally, if you want the family view to refresh its data after adding a member,
          // you can call fetch here by making fetchFn available or by triggering parent's refresh.
        }}
      />
    </>
  );
}
