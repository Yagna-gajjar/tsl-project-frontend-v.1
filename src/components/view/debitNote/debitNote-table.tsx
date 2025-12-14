import { getDebitNotes } from "@/api/debitNote.api";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import type { DebitNote } from "@/types/debitNote";
import type { Response } from "@/types/response";
import { useCallback, useEffect, useState } from "react";

type Props = {
  onView?: (row: DebitNote) => void;
  onEdit?: (row: DebitNote) => void;
};

function DebitNoteTable({ onView, onEdit }: Props) {
  const [data, setData] = useState<DebitNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("debitNoteId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const res: Response<DebitNote[]> = await getDebitNotes({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        memberName: filters.memberName as string | undefined,
        academyName: filters.academyName as string | undefined,
        coachName: filters.coachName as string | undefined,
        debitNoteType: filters.debitNoteType as string | undefined,
        debitNoteRemarks: filters.debitNoteRemarks as string | undefined,
        dateFrom: filters.dateFrom as Date | undefined,
        dateTo: filters.dateTo as Date | undefined,
      });
      let rowsRaw: unknown[] = [];
      let serverTotal = 0;

      if (Array.isArray(res)) {
        rowsRaw = res;
        serverTotal = rowsRaw.length;
      } else if (res && typeof res === "object") {
        const maybeData = res.data;
        if (Array.isArray(maybeData)) {
          rowsRaw = maybeData;
          serverTotal = rowsRaw.length;
        } else if (maybeData && Array.isArray(maybeData.rows)) {
          rowsRaw = maybeData.rows;
          serverTotal =
            typeof maybeData.total === "number"
              ? maybeData.total
              : rowsRaw.length;
        } else if (Array.isArray((res as any).rows)) {
          rowsRaw = (res as any).rows;
          serverTotal =
            typeof (res as any).total === "number"
              ? (res as any).total
              : rowsRaw.length;
        } else {
          rowsRaw = [];
          serverTotal = 0;
        }
      }

      const rows = (rowsRaw ?? []).map((r: any) => {
        return {
          ...r,
          debitNoteDate: r?.debitNoteDate
            ? new Date(r.debitNoteDate)
            : undefined,
          createdAt: r?.createdAt ? new Date(r.createdAt) : undefined,
          updatedAt: r?.updatedAt ? new Date(r.updatedAt) : undefined,
        } as DebitNote;
      });

      setData(rows);
      setTotal(typeof serverTotal === "number" ? serverTotal : rows.length);
    } catch (err) {
      console.error("Failed to fetch debit notes", err);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handlePageChange = (p: number) => setPage(p);

  const columns: Column<DebitNote>[] = [
    {
      key: "debitNoteDate",
      header: "Date",
      sortable: true,
      filterType: "date",
      render: (r) =>
        r.debitNoteDate
          ? new Date(r.debitNoteDate).toLocaleDateString("en-US")
          : "-",
    },
    {
      key: "dateFrom",
      header: "Date From",
      sortable: false,
      filterType: "date",
      hidden: true,
    },
    {
      key: "dateTo",
      header: "Date To",
      sortable: false,
      filterType: "date",
      hidden: true,
    },
    {
      key: "debitNoteType",
      header: "Type",
      sortable: true,
      filterType: "text",
      render: (r) => <span className="text-sm">{r.debitNoteType}</span>,
    },
    {
      key: "debitNoteAcademyName",
      header: "debitNoteAcademyName",
      render: (r) => <span className="text-sm">{r.academyName}</span>,
    },
    {
      key: "coachName",
      header: "Coach",
      sortable: true,
      filterType: "text",
      render: (r) => <span className="text-sm">{r.coachName}</span>,
    },
    {
      key: "enrollmentId",
      header: "Enrollment",
      sortable: true,
      filterType: "number",
      render: (r) => <span className="text-sm">{r.enrollmentId ?? "N/A"}</span>,
    },
    {
      key: "debitNoteAmount",
      header: "Amount",
      sortable: true,
      filterType: "number",
      render: (r) => (
        <span className="text-sm font-medium">₹{r.debitNoteAmount}</span>
      ),
    },
    {
      key: "debitNoteRemarks",
      header: "Remarks",
      sortable: false,
      filterType: "text",
      render: (r) => (
        <span className="text-sm text-slate-600">
          {r.debitNoteRemarks || "-"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (r) =>
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US") : "-",
    },
  ];

  return (
    <div>
      <DataTable<DebitNote>
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
        idKey={"debitNoteId"}
      />
    </div>
  );
}

export default DebitNoteTable;
