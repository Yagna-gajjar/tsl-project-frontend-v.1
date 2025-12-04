import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getEnrollments, deleteEnrollment } from "@/api/enrollment.api";
import type { Enrollment } from "@/types/enrollment";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  HelpCircle,
  Lock,
  Snowflake,
  Stethoscope,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

type Props = {
  onView?: (row: Enrollment) => void;
  onEdit?: (row: Enrollment) => void;
  refreshKey?: number;
};

export default function EnrollmentTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("enrollmentId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<Enrollment | null>(null);
  const navigate = useNavigate();
  const [isFreezed, setIsFreezed] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getEnrollments({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder,
        search: search || undefined,
        academyId: filters.academyId as number | undefined,
        courseId: filters.courseId as number | undefined,
        memberId: filters.memberId as number | undefined,
        status: filters.status as string | undefined,
        memberFirstName: filters.memberFirstName as string | undefined,
        academyName: filters.academyName as string | undefined,
        courseName: filters.courseName as string | undefined,
        billingAmount: filters?.billingAmount as undefined | undefined,
        billingRate: filters.billingRate as number | undefined,
        cndn: filters.cndn as number | undefined,
      });

      console.log(res);

      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray((res as Record<string, unknown>)?.data)
        ? ((res as Record<string, unknown>).data as Enrollment[])
        : [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        enrollmentDate: r.enrollmentDate
          ? new Date(r.enrollmentDate)
          : undefined,
        startDate: r.startDate ? new Date(r.startDate) : undefined,
        endDate: r.endDate ? new Date(r.endDate) : undefined,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as Enrollment[];

      setData(rows);
    } catch {
      console.error("Failed to fetch enrollments");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  const handleFilterChange = (
    filterKey: string,
    value: string | number | undefined
  ) => {
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

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEnrollment(deleteId);
      setData((prev) => prev.filter((e) => e.enrollmentId !== deleteId));
      toast({
        title: "Success",
        description: "Enrollment deleted successfully",
      });
      setDeleteOpen(false);
      setDeleteId(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete enrollment",
        variant: "destructive",
      });
    }
  };

  // Loading state for freeze/unfreeze
  const [freezeLoading, setFreezeLoading] = useState(false);

  /**
   * Toggle freeze state for the currently selected enrollment.
   * - Optimistic update: updates `data` and `selectedEnrollment` immediately.
   * - Replace the "fake API" section with a real API call when you have one.
   */
  const handleToggleFreeze = async () => {
    if (!selectedEnrollment) return;
    const id = selectedEnrollment.enrollmentId;
    const currentlyFrozen = Boolean(
      (selectedEnrollment as any).isFreezed ||
        (selectedEnrollment as any).isFrozen
    );

    try {
      setFreezeLoading(true);

      // --- Replace this block with a real API call ---
      // Example (if you add functions to "@/api/enrollment.api"):
      // await toggleFreezeEnrollment(id, !currentlyFrozen);
      await new Promise((res) => setTimeout(res, 400)); // fake network delay
      // --- end placeholder ---

      // Optimistic UI update: flip the freeze flag on the row
      setData((prev) =>
        prev.map((r) =>
          r.enrollmentId === id
            ? ({ ...r, isFreezed: !currentlyFrozen } as Enrollment)
            : r
        )
      );
      setSelectedEnrollment((prev) =>
        prev ? ({ ...prev, isFreezed: !currentlyFrozen } as Enrollment) : prev
      );

      toast({
        title: currentlyFrozen ? "Defreezed" : "Freezed",
        description: currentlyFrozen
          ? "Enrollment has been defreezed successfully."
          : "Enrollment has been freezed successfully.",
      });
    } catch (err) {
      console.error("Freeze toggle failed", err);
      toast({
        title: "Error",
        description: "Failed to change freeze state. Try again.",
        variant: "destructive",
      });
    } finally {
      setFreezeLoading(false);
    }
  };

  const columns: Column<Enrollment>[] = [
    // --- Replace the "Change Enrollment" column object with this ---
    {
      header: "Change Enrollment",
      key: "enrollmentChange",
      render: (row: Enrollment) => {
        // normalize dates: loadData already converts to Date, but safeguard here
        const endDate = row.endDate ? new Date(row.endDate) : undefined;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0); // midnight today

        const isExpired =
          (!!endDate && endDate < startOfToday) || row.status !== "active";

        return !isExpired ? (
          <Button
            className={`text-sm`}
            onClick={() => {
              setSelectedEnrollment(row);
              // read freeze flag from the row so dialog shows correct label
              setIsFreezed(
                Boolean((row as any).isFreezed || (row as any).isFrozen)
              );
              setChangeDialogOpen(true);
            }}
          >
            Change
          </Button>
        ) : (
          <></>
        );
      },
    },
    {
      header: "Enrollment Date",
      key: "enrollmentDate",
      render: (row: Enrollment) =>
        row.enrollmentDate
          ? format(new Date(row.enrollmentDate), "dd MMM yyyy")
          : "-",
      sortable: true,
    },
    {
      header: "Start Date",
      key: "startDate",
      render: (row: Enrollment) =>
        row.startDate ? format(new Date(row.startDate), "dd MMM yyyy") : "-",
      sortable: true,
    },
    {
      header: "End Date",
      key: "endDate",
      render: (row: Enrollment) =>
        row.endDate ? format(new Date(row.endDate), "dd MMM yyyy") : "-",
      sortable: true,
    },
    {
      header: "Academy Name",
      key: "academyName",
      render: (row: Enrollment) => row.academyName || "-",
      sortable: true,
      filterType: "text",
    },
    {
      header: "Course Name",
      key: "courseName",
      render: (row: Enrollment) => row.courseName || "-",
      sortable: true,
      filterType: "text",
    },
    {
      header: "Member Name",
      key: "memberFirstName",
      render: (row: Enrollment) =>
        (row.memberFirstName || "") +
        (row.memberLastName ? " " + row.memberLastName : ""),
      sortable: true,
      filterType: "text",
    },
    {
      header: "Discount ID",
      key: "discountId",
      render: (row: Enrollment) => row.discountId ?? "-",
      sortable: true,
    },
    {
      header: "Free Days",
      key: "freeDays",
      render: (row: Enrollment) => row.freeDays ?? 0,
      sortable: true,
    },
    {
      header: "Session Units",
      key: "sessionUnits",
      render: (row: Enrollment) => row.sessionUnits ?? 0,
      sortable: true,
    },
    {
      header: "Number Of Days",
      key: "numberOfDays",
      render: (row: Enrollment) => row.numberOfDays ?? 0,
      sortable: true,
    },
    {
      header: "Discounted Amount",
      key: "discountedAmount",
      render: (row: Enrollment) =>
        `Rs. ${Number((row as any).discountedAmount ?? 0).toFixed(2)}`,
      sortable: true,
    },
    {
      header: "Commited Amount",
      key: "commitedAmount",
      render: (row: Enrollment) =>
        `Rs. ${Number((row as any).commitedAmount ?? 0).toFixed(2)}`,
      sortable: true,
    },
    // --- new billing columns (minimal additions) ---
    {
      header: "Billing Amount",
      key: "billingAmount",
      render: (row: Enrollment) =>
        `Rs. ${Number((row as any).billingAmount ?? 0).toFixed(2)}`,
      sortable: true,
      // optional: simple text filter if DataTable supports it from filterType
      filterType: "number",
    },
    {
      header: "Billing Rate",
      key: "billingRate",
      render: (row: Enrollment) =>
        Number((row as any).billingRate ?? 0).toFixed(2),
      sortable: true,
      filterType: "number",
    },
    {
      header: "CNDN",
      key: "cndn",
      render: (row: Enrollment) => (row as any).cndn ?? "-",
      sortable: true,
      filterType: null,
    },
    {
      header: "Adjustments",
      key: "adjustment",
      render: (row: Enrollment) => (row as any).adjustment ?? "-",
      sortable: false,
      filterType: null,
    },
    {
      header: "Open Enrollment",
      key: "openEnrollment",
      render: (row: Enrollment) => (row.openEnrollment ? "Yes" : "No"),
      sortable: true,
      filterType: "select",
      filterOptions: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
    },
    {
      header: "Remarks",
      key: "remarks",
      render: (row: Enrollment) => row.remarks || "-",
    },
    {
      header: "Status",
      key: "status",
      filterType: "select",
      filterOptions: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "completed", label: "Completed" },
      ],
      render: (row: Enrollment) => {
        const endDate = row.endDate ? new Date(row.endDate) : undefined;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // If endDate is before today, force 'inactive' (per requirement)
        const status =
          endDate && endDate < startOfToday
            ? "inactive"
            : row.status || "active";

        const statusColor =
          status === "active"
            ? "bg-green-100 text-green-800"
            : status === "inactive"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-blue-100 text-blue-800";
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
          >
            {status}
          </span>
        );
      },
      sortable: true,
    },
    {
      header: "Created At",
      key: "createdAt",
      render: (row: Enrollment) =>
        row.createdAt ? new Date(row.createdAt).toLocaleString() : "-",
      sortable: true,
    },
    {
      header: "Updated At",
      key: "updatedAt",
      render: (row: Enrollment) =>
        row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-",
      sortable: true,
    },
  ];

  const handleAction = (pathSegment: any) => {
    if (!selectedEnrollment?.enrollmentId as any) return;

    // Navigate to: /enrollment/123/change-course
    navigate(`/enrollment/${selectedEnrollment?.enrollmentId}/${pathSegment}`);
    setChangeDialogOpen(false); // Close modal
  };

  return (
    <div>
      <DataTable<Enrollment>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total: data.length,
          onPageChange: handlePageChange,
        }}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={(row) => onView?.(row)}
        idKey={"enrollmentId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Enrollment?"
        description="Are you sure you want to delete this enrollment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
      <Dialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95%] rounded-xl p-6 bg-white border-0 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Manage Enrollment
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-base">
              Choose an action to update your current enrollment status.
            </DialogDescription>
          </DialogHeader>

          {/* Action Grid - White & Blue Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: Freeze / Defreeze button */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
              onClick={() =>
                handleAction(
                  selectedEnrollment?.courseName?.toLowerCase() === "freeze"
                    ? "defreeze-enrollment"
                    : "freeze-enrollment"
                )
              }
            >
              <Snowflake className="w-6 h-6 text-slate-900 group-hover:text-blue-600" />

              <span className="font-semibold text-slate-900 group-hover:text-blue-700">
                {selectedEnrollment?.courseName?.toLowerCase() === "freeze"
                  ? "Defreeze Enrollment"
                  : "Freeze Enrollment"}
              </span>
            </Button>

            {/* Option 2: Course Change */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
              onClick={() => handleAction("course-change")}
            >
              <BookOpen className="w-6 h-6 text-slate-900 group-hover:text-blue-600" />
              <span className="font-semibold text-slate-900 group-hover:text-blue-700">
                Change Course
              </span>
            </Button>
            {/* Option 3: Batch Change */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
              onClick={() => handleAction("batch-change")}
            >
              <Users className="w-6 h-6 text-slate-900 group-hover:text-blue-600" />
              <span className="font-semibold text-slate-900 group-hover:text-blue-700">
                Switch Batch
              </span>
            </Button>
            {/* Option 4: Medical Extension */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
              onClick={() => handleAction("medical-extension")}
            >
              <Stethoscope className="w-6 h-6 text-slate-900 group-hover:text-blue-600" />
              <span className="font-semibold text-slate-900 group-hover:text-blue-700">
                Medical Extension
              </span>
            </Button>
            {/* Option 5: Other */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
              onClick={() => handleAction("other")}
            >
              <HelpCircle className="w-6 h-6 text-slate-900 group-hover:text-blue-600" />
              <span className="font-semibold text-slate-900 group-hover:text-blue-700">
                Other Request
              </span>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Or</span>
            </div>
          </div>

          {/* Destructive/Final Action - Styled Black to stand out without using Red */}
          <Button
            className="w-full py-6 bg-slate-900 hover:bg-black text-white rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            onClick={() => handleAction("cancel")}
          >
            <XCircle className="w-5 h-5 text-white" />
            <span className="text-base font-medium">Cancel Enrollment</span>
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
