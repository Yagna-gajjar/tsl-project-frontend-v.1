import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getAuthorities, deleteAuthority } from "@/api/authority.api";
import type { Authority } from "@/types/authority";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: Authority) => void;
  onEdit?: (row: Authority) => void;
  refreshKey?: number;
};

export default function AuthorityTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Authority[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    const res = await getAuthorities({ page });
    setData(res.data ?? []);
    setTotal(res.pagination.total);
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const columns: Column<Authority>[] = [
    {
      key: "memberId",
      header: "Member",
      render: (r) => r.memberFirstName + " " + r.memberLastName,
    },
    { key: "accountName", header: "Account" },
    {
      key: "linkingDate",
      header: "Link Date",
      render: (r) =>
        r.linkingDate ? new Date(r.linkingDate).toLocaleDateString() : "-",
    },
    { key: "level", header: "Level" },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      pagination={{ page, limit: 10, total, onPageChange: setPage }}
      onEdit={onEdit}
      onView={onView}
      onDelete={async (id) => {
        await deleteAuthority(id);
        toast({ title: "Deleted", variant: "success" });
        loadData();
      }}
      idKey="authorityId"
    />
  );
}
