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

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: Response<CoachSkill[]> = await getCoachSkills({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder,
        search: search || undefined,
        coachId: filters.coachId as number | undefined,
        activityId: filters.activityId as number | undefined,
        experience: filters.experience as string | undefined,
        coachFirstName: filters.coachFirstName as string | undefined,
        activityName: filters.activityName as string | undefined,
        currentInterest: filters.currentInterest as string | undefined,
        currentlyInTeam: filters.currentlyInTeam as string | undefined,
      });

      const rowsRaw = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data as CoachSkill[] : []);
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as CoachSkill[];
      setTotal(res.pagination.total)
      setData(rows);
    } catch {
      console.error("Failed to fetch coach skills");
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

  const handleFilterChange = (filterKey: string, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value || undefined,
    }));
    setPage(1);
  };

  const handleSortChange = (column: string, direction: "ASC" | "DESC") => {
    if (column === "coachName") {
      column = "coachFirstName";
    }
    setSortBy(column);
    setSortOrder(direction);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCoachSkill(deleteId);
      setData((prev) => prev.filter((c) => c.coachSkillId !== deleteId));
      toast({
        title: "Success",
        description: "Coach skill deleted successfully",
      });
      setDeleteOpen(false);
      setDeleteId(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete coach skill",
        variant: "destructive",
      });
    }
  };

  const columns: Column<CoachSkill>[] = [
    {
      header: "Coach Name",
      key: "coachFirstName",
      render: (row: CoachSkill) =>
        `${row.coachFirstName + " " + row.coachLastName}`,
      filterType: "text",
      sortable: true,
    },
    {
      header: "Activity Name",
      key: "activityName",
      render: (row: CoachSkill) => `${row.activityName}`,
      filterType: "text",
      sortable: true,
    },
    {
      header: "Experience",
      key: "experience",
      filterType: "number",
      render: (row: CoachSkill) => row.experience || "-",
      sortable: true,
    },
    {
      header: "Current Interest",
      key: "currentInterest",
      filterType: "text",
      render: (row: CoachSkill) => row.currentInterest || "-",
    },
    {
      header: "In Team",
      key: "currentlyInTeam",
      filterType: "text",
      render: (row: CoachSkill) => row.currentlyInTeam || "-",
    },
    {
      header: "Created",
      key: "createdAt",
      render: (row: CoachSkill) =>
        row.createdAt ? row.createdAt.toLocaleDateString() : "-",
      sortable: true,
    },
  ];

  return (
    <div>
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
        onView={(row) => onView?.(row)}
        onEdit={(row) => onEdit?.(row)}
        onDelete={(coachSkillId: number | undefined) => {
          setDeleteId(coachSkillId ?? null);
          setDeleteOpen(true);
        }}
        idKey={"coachSkillId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Coach Skill?"
        description="Are you sure you want to delete this coach skill? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
