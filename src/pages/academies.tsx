import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building2 } from "lucide-react";
import { getAcademies, type EntityQuery } from "@/api/entity.api";
import { EntityCard } from "@/components/view/academies/entity-card";
import { toast } from "@/hooks/use-toast";
import type { Entity } from "@/types/entity";

const PAGE_SIZE = 12;

export default function Academies() {
  const navigate = useNavigate();

  const [data, setData] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState<string | undefined>(undefined);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const query: EntityQuery = {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        entityType: entityType || undefined,
      };
      const res = await getAcademies(query);
      setData(res.data ?? []);
      setTotal(res.pagination?.total ?? res.data?.length ?? 0);
    } catch {
      toast({ title: "Failed to load academies", variant: "destructive" });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, entityType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Type filter options are pulled once, unfiltered, so the dropdown doesn't
  // shrink to whatever the current search/filter happens to match.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getAcademies({ limit: 1000 });
      if (cancelled) return;
      const types = Array.from(
        new Set((res.data ?? []).map((e) => e.entityType).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));
      setTypeOptions(types);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Academies</h1>
        <p className="text-sm text-muted-foreground">
          Browse academies and open one to see its members.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
        <Select
          value={entityType ?? "all"}
          onValueChange={(v) => {
            setEntityType(v === "all" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {typeOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No academies found</p>
          <p className="text-sm text-muted-foreground">
            Try a different search term or filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((entity) => (
            <EntityCard
              key={entity.entityId}
              entity={entity}
              onClick={(e) =>
                navigate(`/academies/members`, {
                  state: { entityId: e.entityId },
                })
              }
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}