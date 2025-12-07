"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getCoaches, deleteCoach, saveUrlToCoach, deletePhoto } from "@/api/coach.api";
import type { Coach } from "@/types/coach";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- AVATAR CONSTANTS & HELPERS ---
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

// --- AVATAR CELL COMPONENT ---
const AvatarCell = ({
  row,
  onClick,
}: {
  row: Coach;
  onClick: (row: Coach) => void;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Fallback initial
  const initial = row.coachFirstName
    ? row.coachFirstName.charAt(0).toUpperCase()
    : "?";

  // Unique key for background color hashing
  const uniqueKey = row.coachId
    ? String(row.coachId)
    : row.coachFirstName + (row.coachLastName || "");
  const bgColorClass = getPersistentBackgroundColor(uniqueKey);

  // Construct Image URL (using 'photo' field)
  const baseUrl = import.meta.env.VITE_APP_R2_PUBLIC_ENDPOINT || "";
  const imageUrl = row.photo?.startsWith("http")
    ? row.photo
    : `${baseUrl}/${row.photo}`;

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative group h-10 w-10 cursor-pointer rounded-full overflow-hidden border border-gray-200"
        onClick={(e) => {
          e.stopPropagation();
          onClick(row);
        }}
        title="Change Photo"
      >
        {/* Placeholder / Fallback */}
        {(!isLoaded || hasError || !row.photo) && (
          <div
            className={`absolute inset-0 flex items-center justify-center text-white font-bold ${bgColorClass}`}
          >
            {initial}
          </div>
        )}

        {/* Image */}
        {row.photo && !hasError && (
          <img
            src={imageUrl}
            alt={row.coachFirstName}
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

// --- MAIN COMPONENT ---
type Props = {
  onView?: (row: Coach) => void;
  onEdit?: (row: Coach) => void;
  refreshKey?: number;
};

export default function CoachTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string | number | undefined>>({});
  const [sortBy, setSortBy] = useState<string>("coachId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  // --- DELETE COACH STATE ---
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // --- UPLOAD MODAL STATE ---
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getCoaches({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder,
        search: search || undefined,
        coachFirstName: filters.coachFirstName as string | undefined,
        status: filters.status as string | undefined,
      });

      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray((res as Record<string, unknown>)?.data)
          ? ((res as Record<string, unknown>).data as Coach[])
          : [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
        dob: r.dob ? new Date(r.dob) : undefined,
        joinDate: r.joinDate ? new Date(r.joinDate) : undefined,
      })) as Coach[];

      setData(rows);
    } catch (err) {
      console.error("Failed to fetch coaches", err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleSearchChange = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  const handleFilterChange = (filterKey: string, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value || undefined,
    }));
    setPage(1);
  };

  const handleSortChange = (column: string, direction: "ASC" | "DESC") => {
    setSortBy(column);
    setSortOrder(direction);
    setPage(1);
  };

  const handlePageChange = (p: number) => setPage(p);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    try {
      await deleteCoach(id);
      toast({
        title: "Success",
        description: "Coach deleted successfully",
      });
      setDeleteOpen(false);
      await loadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete coach",
        variant: "destructive",
      });
    }
  };

  // --- UPLOAD HANDLERS ---
  const openUploadModal = (coach: Coach) => {
    setSelectedCoach(coach);

    let currentPhotoUrl = null;
    if (coach.photo) {
      const baseUrl = import.meta.env.VITE_APP_R2_PUBLIC_ENDPOINT || "";
      currentPhotoUrl = coach.photo.startsWith("http")
        ? coach.photo
        : `${baseUrl}/${coach.photo}`;
    }

    setPreviewUrl(currentPhotoUrl);
    setSelectedFile(null);
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedCoach(null);
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

  const handleRemovePhoto = async () => {
    if (!selectedCoach || !selectedCoach.photo || !selectedCoach.coachId) return;
    try {
      setIsUploading(true);
      await deletePhoto(selectedCoach.coachId, selectedCoach.photo);
      toast({ title: "Success", description: "Photo removed successfully" });
      await loadData();

      // Update local state to reflect removal
      setSelectedCoach((prev) => (prev ? { ...prev, photo: undefined } : null));
      setPreviewUrl(null);
    } catch (error) {
      console.error("Remove photo failed", error);
      toast({ title: "Error", description: "Failed to remove photo", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedCoach || !selectedFile || !selectedCoach.coachId) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("coachId", String(selectedCoach?.coachId!));

      await saveUrlToCoach(formData);
      toast({ title: "Success", description: "Photo uploaded successfully" });

      await loadData();
      closeUploadModal();
    } catch (error) {
      console.error("Upload failed", error);
      toast({ title: "Error", description: "Failed to upload photo", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const columns: Column<Coach>[] = [
    {
      key: "photo", // Using 'photo' based on your schema
      header: "Photo",
      sortable: false,
      render: (row) => (
        <AvatarCell row={row} onClick={(r) => openUploadModal(r)} />
      ),
    },
    {
      key: "coachFirstName",
      header: "Coach Name",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {r.coachFirstName} {r.coachLastName || ""}
          </span>
          <span className="text-xs text-gray-500">{r.email || "-"}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterType: "select",
      filterOptions: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Suspended", value: "suspended" },
      ],
      render: (r) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === "active"
              ? "bg-green-100 text-green-800"
              : r.status === "inactive"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
        >
          {r.status || "-"}
        </span>
      ),
    },
    {
      key: "contactNumber",
      header: "Contact",
      sortable: false,
      filterType: null,
      render: (r) => <span className="text-sm">{r.contactNumber || "-"}</span>,
    },
    {
      key: "joinDate",
      header: "Join Date",
      sortable: true,
      filterType: null,
      render: (r) => (
        <span className="text-sm">
          {r.joinDate ? new Date(r.joinDate).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (r) =>
        r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-",
    },
  ];

  return (
    <div className="relative">
      <DataTable<Coach>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total: data.length, // Ideally backend should provide total count
          onPageChange: handlePageChange,
        }}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={(row) => onView?.(row)}
        onEdit={(row) => onEdit?.(row)}
        onDelete={(id: number | undefined) => {
          setDeleteId(id ?? null);
          setDeleteOpen(true);
        }}
        idKey={"coachId"}
      />

      {/* --- CONFIRM DELETE COACH DIALOG --- */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => handleDelete(deleteId ?? undefined)}
        title="Delete Coach?"
        description="Are you sure you want to delete this coach? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* --- UPLOAD PHOTO MODAL --- */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-background border border-foreground p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold mb-4">Update Profile Picture</h3>

            <div className="flex flex-col items-center gap-6">
              {/* Preview Circle */}
              <div className="relative h-32 w-32 rounded-full border-2 border-dashed border-foreground flex items-center justify-center overflow-hidden bg-background">
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

              {/* Logic: If photo exists, user must remove it first. Else show input. */}
              {!selectedCoach?.photo ? (
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
                <div className="text-center w-full px-4 py-2 bg-amber-700/20 rounded-md">
                  <p className="text-sm text-amber-700 font-medium">
                    You must remove the current picture before uploading a new one.
                  </p>
                </div>
              )}

              <div className="flex w-full justify-between items-center mt-2">
                {selectedCoach?.photo ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemovePhoto}
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

                  {/* Submit Button visible only if no current photo */}
                  {!selectedCoach?.photo && (
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