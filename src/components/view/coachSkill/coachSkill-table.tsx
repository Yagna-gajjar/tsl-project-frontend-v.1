import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getCoachSkills, deleteCoachSkill } from "@/api/coachSkill.api";
import type { CoachSkill } from "@/types/coachSkill";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Props = {
  onView?: (row: CoachSkill) => void;
  onEdit?: (row: CoachSkill) => void;
  refreshKey?: number;
};

export default function CoachSkillTable({
  onView,
  onEdit,
  refreshKey,
}: Props) {
  const [data, setData] = useState<CoachSkill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string | number | undefined>>({});
  const [sortBy, setSortBy] = useState<string>("coachSkillId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Constructing query params based on updated schema
      const res: Response<CoachSkill[]> = await getCoachSkills({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        memberId: filters.memberId as number | undefined,
        activityId: filters.activityId as number | undefined,
        experience: filters.experience as string | undefined,
        memberFirstName: filters.memberFirstName as string | undefined,
        activityName: filters.activityName as string | undefined,
        currentlyInterest: filters.currentlyInterest as string | undefined,
        currentlyInTeam: filters.currentlyInTeam as string | undefined,
        status: filters.status as string | undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        const rows: CoachSkill[] = res.data.map((r) => ({
          ...r,
          createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
          updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
        }));
        setTotal(res.pagination?.total || 0);
        setData(rows);
      } else {
        setData([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch coach skills";
      console.error(errorMessage);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handlePageChange = (newPage: number) => setPage(newPage);

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
    let sortKey = column;
    if (column === "memberFullName") sortKey = "memberFirstName";

    setSortBy(sortKey);
    setSortOrder(direction);
    setPage(1);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteCoachSkill(deleteId);
      setData((prev) => prev.filter((c) => c.coachSkillId !== deleteId));
      toast({
        title: "Success",
        description: "Coach skill deleted successfully",
      });
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete coach skill";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const columns: Column<CoachSkill>[] = [
    {
      header: "Member Name",
      key: "memberFirstName",
      render: (row) => `${row.memberFirstName} ${row.memberLastName}`,
      filterType: "text",
      sortable: true,
    },
    {
      header: "Activity",
      key: "activityName",
      filterType: "text",
      sortable: true,
    },
    {
      header: "Experience",
      key: "experience",
      filterType: "text",
      sortable: true,
    },
    {
      header: "Status",
      key: "status",
      filterType: "text",
      render: (row) => (
        <span className={`capitalize ${row.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
          {row.status || "N/A"}
        </span>
      ),
    },
    {
      header: "Created At",
      key: "createdAt",
      render: (row) =>
        row.createdAt instanceof Date ? row.createdAt.toLocaleDateString() : "-",
      sortable: true,
    },
  ];

  return (
    <div className="w-full">
      <DataTable<CoachSkill>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total,
          onPageChange: handlePageChange,
        }}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={onView}
        onEdit={onEdit}
        onDelete={(id) => {
          if (typeof id === 'number') {
            setDeleteId(id);
            setDeleteOpen(true);
          }
        }}
        idKey="coachSkillId"
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Coach Skill?"
        description="Are you sure you want to delete this skill entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}