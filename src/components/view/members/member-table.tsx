"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getMembers, deleteMember, saveUrlToMember, deleteAvatar } from "@/api/member.api";
import type { Member } from "@/types/member";
import { format } from "date-fns";
import type { Response } from "@/types/response";
import { useConfirmation } from "@/contexts/confirmation-context";

const AVATAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

const getPersistentBackgroundColor = (identifier: string) => {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % AVATAR_COLORS.length);
  return AVATAR_COLORS[index];
};

const AvatarCell = ({
  row,
  onClick,
}: {
  row: Member;
  onClick: (row: Member) => void;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const initial = row.memberFirstName
    ? row.memberFirstName.charAt(0).toUpperCase()
    : "?";

  const uniqueKey = row.memberId
    ? String(row.memberId)
    : row.memberFirstName + row.memberLastName;
  const bgColorClass = getPersistentBackgroundColor(uniqueKey);

  const baseUrl = import.meta.env.VITE_APP_R2_PUBLIC_ENDPOINT || "";
  const imageUrl = row.avatar?.startsWith("http")
    ? row.avatar
    : `${baseUrl}/${row.avatar}`;

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative group h-10 w-10 cursor-pointer rounded-full overflow-hidden border border-gray-200"
        onClick={(e) => {
          e.stopPropagation();
          onClick(row);
        }}
        title="Change Avatar"
      >
        {/* Placeholder: Visible if image is loading, has error, or no avatar exists */}
        {(!isLoaded || hasError || !row.avatar) && (
          <div
            className={`absolute inset-0 flex items-center justify-center text-white font-bold ${bgColorClass}`}
          >
            {initial}
          </div>
        )}

        {/* Image: Uses native lazy loading and fade-in effect */}
        {row.avatar && !hasError && (
          <img
            src={imageUrl}
            alt={row.memberFirstName}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`h-full w-full object-cover transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"
              }`}
          />
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </div>
      </div>
    </div>
  );
};

type Props = {
  onOpenForm: (row?: Member | null) => void;
  onOpenView?: (row: Member) => void;
  refreshKey?: number;
  initialFamilyId?: number | undefined;
};

export default function MemberTable({
  onOpenForm,
  onOpenView,
  refreshKey,
  initialFamilyId,
}: Props) {
  const [data, setData] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const { confirm } = useConfirmation();
  const [filters, setFilters] = useState<Record<string, any>>(() => {
    return initialFamilyId ? { familyId: initialFamilyId } : {};
  });
  const [sortBy, setSortBy] = useState<string>("memberId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await getMembers({
        page,
        limit: 10,
        sortBy,
        sortOrder,
        ...filters,
      });

      const rows = res?.data ?? res ?? [];
      const pagination = res?.pagination ?? null;

      setData(Array.isArray(rows) ? rows : []);
      if (pagination) {
        setTotal(Number(pagination.total ?? pagination.totalItems ?? 0));
      } else {
        setTotal(Array.isArray(rows) ? rows.length : 0);
      }
    } catch (error) {
      console.error("Failed to load members", error);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers, refreshKey]);

  useEffect(() => {
    if (initialFamilyId === undefined || initialFamilyId === null) return;
    setFilters((prev) => {
      if (prev.familyId === initialFamilyId) return prev;
      return { ...prev, familyId: initialFamilyId };
    });
    setPage(1);
  }, [initialFamilyId]);

  const handleFilterChange = (key: string, value: any) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (key: string, direction: "ASC" | "DESC") => {
    setSortBy(key);
    setSortOrder(direction);
    setPage(1);
  };

  const handleDelete = async (id: string | number) => {
    const ok = confirm({
      title: "Delete this member?",
      description: "Are you sure want to delete this member?",
      variant: "destructive"
    });
    if (!ok) return;
    try {
      const res: Response = await deleteMember(Number(id));
      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;

      if (!ok) {
        throw new Error(
          (res as Record<string, any>)?.message || "Failed to delete member"
        );
      }
      await fetchMembers();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const openUploadModal = (member: Member) => {
    setSelectedMember(member);

    let currentAvatarUrl = null;
    if (member.avatar) {
      const baseUrl = import.meta.env.VITE_APP_R2_PUBLIC_ENDPOINT || "";
      currentAvatarUrl = member.avatar.startsWith("http")
        ? member.avatar
        : `${baseUrl}/${member.avatar}`;
    }

    setPreviewUrl(currentAvatarUrl);
    setSelectedFile(null);
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedMember(null);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!selectedMember || !selectedMember.avatar) return;
    const confirmDelete = confirm({
      title: "Remove Image",
      description: "Are you sure you want to remove this photo?",
      variant: "destructive"
    });
    if (!confirmDelete) return;

    try {
      setIsUploading(true);
      const deleteRes = await deleteAvatar(selectedMember.memberId!, selectedMember.avatar);
      console.log("Delete Image Response:", deleteRes);

      console.log("Save Member Response (Delete):", deleteRes);

      await fetchMembers();
      setSelectedMember(prev => prev ? { ...prev, avatar: null } : null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Remove avatar failed", error);
      alert("Failed to remove avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedMember || !selectedFile) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("memberId", String(selectedMember?.memberId));

      const uploadRes: any = await saveUrlToMember(formData);
      console.log("Upload Response:", uploadRes);

      await fetchMembers();
      closeUploadModal();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const columns: Column<Member>[] = [
    {
      key: "avatar",
      header: "Avatar",
      sortable: false,
      render: (row: any) => (
        <AvatarCell row={row} onClick={(r) => openUploadModal(r)} />
      ),
    },
    {
      key: "memberFirstName",
      header: "First Name",
      sortable: true,
      filterType: "text",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.memberFirstName} {row.memberMiddleName ?? ""}{" "}
          </span>
        </div>
      ),
    },
    {
      key: "memberLastName",
      header: "Last Name",
      sortable: true,
      filterType: "text",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.memberLastName}</span>
        </div>
      ),
    },
    {
      key: "gender",
      header: "Gender",
      sortable: true,
      filterType: "select",
      filterOptions: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" },
      ],
      render: (row) => row.gender,
    },
    {
      key: "familyId",
      header: "Family",
      sortable: true,
      render: (row: any) => row.familyName ?? `-`,
    },
    {
      key: "city",
      header: "City",
      sortable: false,
      filterType: "text",
      render: (row: any) => (row.city ? `${row.city}` : `-`),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterType: "select",
      filterOptions: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Block", value: "block" },
      ],
      render: (row) => (
        <Badge
          variant={
            row.status === "active"
              ? "default"
              : row.status === "inactive"
                ? "secondary"
                : "destructive"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "dob",
      header: "DOB",
      sortable: true,
      render: (row) => (row.dob ? format(row?.dob, "dd MMM yyyy") : "-"),
    },
    { key: "contactNumber", header: "Contact", sortable: false },
    { key: "relationship", header: "Relationship", sortable: false },
    {
      key: "createdAt",
      header: "Created",
      sortable: false,
      render: (row) =>
        row.createdAt ? format(row?.createdAt, "dd MMM yyyy") || "-" : "-",
    },
  ];

  return (
    <div className="relative">
      <DataTable
        isLoading={isLoading}
        data={data}
        columns={columns}
        pagination={{
          page,
          limit: 10,
          total,
          onPageChange: setPage,
        }}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={(row: Member) => {
          onOpenView?.(row);
        }}
        onEdit={(row) => onOpenForm(row)}
        onDelete={(id) => handleDelete(Number(id))}
        idKey="memberId"
      />

      {/* --- UPLOAD MODAL --- */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold mb-4">
              Update Profile Picture
            </h3>

            <div className="flex flex-col items-center gap-6">
              {/* Preview Circle */}
              <div className="relative h-32 w-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">No Image</span>
                )}
              </div>

              {/* Conditional Rendering: If avatar exists, show delete message, else show input */}
              {!selectedMember?.avatar ? (
                <div className="w-full">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedFile
                      ? `Selected: ${selectedFile.name}`
                      : "Please select an image to upload."}
                  </p>
                </div>
              ) : (
                <div className="text-center w-full px-4 py-2 bg-amber-50 rounded-md border border-amber-100">
                  <p className="text-sm text-amber-700 font-medium">
                    You must remove the current picture before uploading a new one.
                  </p>
                </div>
              )}

              <div className="flex w-full justify-between items-center mt-2">
                {selectedMember?.avatar ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isUploading}
                  >
                    Remove Current Picture
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={closeUploadModal}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>

                  {/* Submit Button only visible when uploading is allowed (no current avatar) */}
                  {!selectedMember?.avatar && (
                    <Button
                      onClick={handleUploadSubmit}
                      disabled={!selectedFile || isUploading}
                    >
                      {isUploading ? "Uploading..." : "Submit"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}