"use client";

import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Coach } from "@/types/coach";
import { getCoachById } from "@/api/coach.api";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Heart,
  Award,
  FileText,
  Hash,
  BookOpen,
  Image,
  Clock,
} from "lucide-react";
import type { FieldConfig } from "@/components/view-modal/types";

type Props = {
  isOpen: boolean;
  coachId?: number;
  onClose: () => void;
};

const fields: FieldConfig<Coach>[] = [
  { key: "coachId", label: "Coach ID", icon: Hash },
  { key: "coachFirstName", label: "First Name", icon: User },
  { key: "coachMiddleName", label: "Middle Name", icon: User },
  { key: "coachLastName", label: "Last Name", icon: User },
  { key: "email", label: "Email", icon: Mail },
  { key: "contactNumber", label: "Contact Number", icon: Phone },
  {
    key: "dob",
    label: "Date of Birth",
    icon: Calendar,
    render: (v) => (v ? new Date(v).toLocaleDateString() : "-"),
  },
  {
    key: "joinDate",
    label: "Join Date",
    icon: Calendar,
    render: (v) => (v ? new Date(v).toLocaleDateString() : "-"),
  },
  { key: "remarks", label: "Remarks", icon: FileText },
  {
    key: "status",
    label: "Status",
    icon: Heart,
    render: (v) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          v === "active"
            ? "bg-green-100 text-green-800"
            : v === "inactive"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
        }`}
      >
        {v || "-"}
      </span>
    ),
  },
  { key: "gender", label: "Gender", icon: User },
  { key: "bloodGroup", label: "Blood Group", icon: Heart },
  { key: "aadharCard", label: "Aadhar Card", icon: Hash },
  { key: "qualification", label: "Qualification", icon: BookOpen },
  { key: "achievements", label: "Achievements", icon: Award },
  { key: "achievementsInDetails", label: "Achievements In Details", icon: FileText },
  {
    key: "photo",
    label: "Photo",
    icon: Image,
    render: (v) =>
      v ? (
        <img
          src={v}
          alt="Coach"
          className="max-w-xs max-h-40 rounded-lg object-cover"
        />
      ) : (
        "-"
      ),
  },
  {
    key: "createdAt",
    label: "Created At",
    icon: Clock,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
];

export default function CoachViewModal({ isOpen, coachId, onClose }: Props) {
  const fetchFn = useCallback(
    async (id?: number | string): Promise<Coach> => {
      const useId = id ?? coachId;
      if (!useId) throw new Error("Coach ID missing");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await getCoachById(Number(useId));

      // normalize: API may return { success, data } or raw coach
      if (res && res.data) return res.data as Coach;

      return res as Coach;
    },
    [coachId]
  );

  return (
    <ViewModal<Coach>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(coachId)}
      fetchFn={fetchFn}
      fields={fields}
      title="View Coach"
      layout="grid"
    />
  );
}
