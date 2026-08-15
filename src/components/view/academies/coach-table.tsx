import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import {
  getCoachMembers,
  type CoachMemberQuery,
} from "@/api/coachMember.api";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";
import type { CoachMember } from "@/types/coachMember";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  entityId: number;
  onView?: (row: CoachMember) => void;
};

type FilterValue = string | number | undefined;

export default function CoachTable({ entityId, onView }: Props) {
  const [data, setData] = useState<CoachMember[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [sortBy, setSortBy] = useState<keyof CoachMember>("memberFirstName");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [activityOptions, setActivityOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [qualificationOptions, setQualificationOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [interestOptions, setInterestOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await getCoachMembers({ entityId, limit: 1000 });
      if (cancelled) return;

      const toOptions = (key: keyof CoachMember) =>
        Array.from(
          new Set(
            (res?.data ?? [])
              .map((r) => String(r?.[key] ?? "").trim())
              .filter(Boolean)
          )
        )
          .sort((a, b) => a.localeCompare(b))
          .map((name) => ({ label: name, value: name }));

      setActivityOptions(toOptions("activity"));
      setQualificationOptions(toOptions("activityQualification"));
      setInterestOptions(toOptions("currentlyIntreset"));
    })();

    return () => {
      cancelled = true;
    };
  }, [entityId]);

  const buildQuery = useCallback(
    (overrides: Partial<CoachMemberQuery> = {}): CoachMemberQuery => ({
      entityId,
      page,
      limit,
      search: search || undefined,
      sortBy,
      sortOrder,
      activity: filters.activity as string | undefined,
      activityQualification: filters.activityQualification as string | undefined,
      currentlyIntreset: filters.currentlyIntreset as string | undefined,
      ...overrides,
    }),
    [entityId, page, limit, search, sortBy, sortOrder, filters]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res: Response<CoachMember[]> = await getCoachMembers(buildQuery());
      setData(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast({ title: "Failed to load members", variant: "destructive" });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key: string, value: FilterValue) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const handleExport = async (): Promise<CoachMember[]> => {
    const res: Response<CoachMember[]> = await getCoachMembers(
      buildQuery({ page: 1, limit: total || 1000 })
    );
    return Array.isArray(res?.data) ? res.data : [];
  };

  const columns = useMemo<Column<CoachMember>[]>(
    () => [
      {
        header: "Member Name",
        key: "memberFirstName",
        sortable: true,
        filterType: "text",
        render: (r) =>
          [r.memberFirstName, r.memberMiddleName, r.memberLastName]
            .filter(Boolean)
            .join(" "),
      },
      {
        header: "Activity Name",
        key: "activity",
        sortable: true,
        filterType: "select",
        filterOptions: activityOptions,
      },
      {
        header: "Qualification",
        key: "activityQualification",
        sortable: true,
        filterType: "select",
        filterOptions: qualificationOptions,
      },
      {
        header: "Experience",
        key: "experience",
        sortable: true,
        filterType: "text",
      },
      {
        header: "Intreset",
        key: "currentlyIntreset",
        sortable: true,
        filterType: "select",
        filterOptions: interestOptions,
      },
    ],
    [activityOptions, qualificationOptions, interestOptions]
  );

  return (
    <div>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search academies..."
          className="pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <DataTable<CoachMember>
        data={data}
        columns={columns}
        isLoading={loading}
        pagination={{
          page,
          limit,
          total,
          onPageChange: setPage,
        }}
        onSearchChange={(q) => {
          setSearch(q);
          setPage(1);
        }}
        onFilterChange={handleFilterChange}
        onSortChange={(c, d) => {
          setSortBy(c as keyof CoachMember);
          setSortOrder(d);
          setPage(1);
        }}
        onView={onView}
        idKey="coachSkillId"
        exportFileName="Members"
        onExport={handleExport}
      />
    </div>
  );
}