import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  Building2,
  Users,
} from "lucide-react";
import { getTrialBalance } from "@/api/transaction.api";
import { DataTable } from "@/components/data-table/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Account {
  accountId: number;
  accountName: string;
  debit: string;
  credit: string;
  balance: number;
}

interface ApiData {
  accounts: Account[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const getCategoryIcon = (name: string) => {
  if (name.toLowerCase().includes("family")) return <Users size={13} />;
  return <Building2 size={13} />;
};

const columns = [
  {
    key: "accountName" as keyof Account,
    header: "Account",
    width: 300,
    render: (row: Account) => (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 shrink-0">
          {getCategoryIcon(row.accountName)}
        </span>
        <span className="truncate text-sm">{row.accountName}</span>
      </div>
    ),
  },
  {
    key: "debit" as keyof Account,
    header: "Debit",
    width: 140,
    align: "right" as const,
    render: (row: Account) => {
      const val = parseFloat(row.debit);
      return val > 0 ? (
        <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
          {fmt(val)}
        </span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    key: "credit" as keyof Account,
    header: "Credit",
    width: 140,
    align: "right" as const,
    render: (row: Account) => {
      const val = parseFloat(row.credit);
      return val > 0 ? (
        <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
          {fmt(val)}
        </span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    key: "balance" as keyof Account,
    header: "Balance",
    width: 150,
    align: "right" as const,
    render: (row: Account) => {
      if (row.balance === 0)
        return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <div className="flex items-center justify-end gap-1">
          {row.balance > 0 ? (
            <ArrowUpRight size={13} className="text-blue-500" />
          ) : (
            <ArrowDownRight size={13} className="text-red-500" />
          )}
          <span
            className={`text-sm font-medium ${row.balance > 0
              ? "text-blue-600 dark:text-blue-400"
              : "text-red-600 dark:text-red-400"
              }`}
          >
            {fmt(Math.abs(row.balance))}
          </span>
        </div>
      );
    },
  },
];

function SummaryCard({
  label,
  value,
  icon,
  colorClass,
  delay,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-xl border bg-card p-5 flex flex-col gap-2 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          {label}
        </span>
        <span className={colorClass}>{icon}</span>
      </div>
      <span className="text-2xl font-medium text-foreground">{value}</span>
    </motion.div>
  );
}


export default function AccountsPage() {
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideZero, setHideZero] = useState(false);
  const [hideNoTx, setHideNoTx] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTrialBalance(hideZero, hideNoTx);
      if (!res.success) throw new Error("API returned success: false");
      setApiData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hideZero, hideNoTx]);

  // const filtered = useMemo(() => {
  //   if (!apiData) return [];
  //   return apiData.accounts.filter((a) => {
  //     const hasTransaction =
  //       parseFloat(a.debit) > 0 || parseFloat(a.credit) > 0;
  //     if (hideZero && a.balance === 0) return false;
  //     if (hideNoTx && !hasTransaction) return false;
  //     return true;
  //   });
  // }, [apiData, hideZero, hideNoTx]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={28} className="text-blue-600" />
        </motion.div>
        <p className="text-sm text-muted-foreground">Loading accounts…</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !apiData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle size={28} className="text-destructive" />
        <p className="text-sm text-destructive">{error ?? "Something went wrong"}</p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      </div>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-medium text-foreground">Trial Balance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {apiData.accounts.length} accounts &nbsp;·&nbsp;{" "}
            {apiData.accounts.filter(
              (a) => parseFloat(a.debit) > 0 || parseFloat(a.credit) > 0
            ).length}{" "}
            with transactions
          </p>
        </div>
        <motion.button
          onClick={loadData}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Debit"
          value={fmt(apiData.totalDebit)}
          icon={<TrendingUp size={16} />}
          colorClass="text-blue-500"
          delay={0.05}
        />
        <SummaryCard
          label="Total Credit"
          value={fmt(apiData.totalCredit)}
          icon={<TrendingDown size={16} />}
          colorClass="text-emerald-500"
          delay={0.1}
        />
        <SummaryCard
          label="Net Balance"
          value={fmt(apiData.totalDebit - apiData.totalCredit)}
          icon={<Wallet size={16} />}
          colorClass="text-violet-500"
          delay={0.15}
        />
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className={`rounded-xl border p-5 flex flex-col gap-2 shadow-sm ${apiData.isBalanced
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
            : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Status
            </span>
            <AlertCircle
              size={14}
              className={
                apiData.isBalanced ? "text-emerald-600" : "text-amber-600"
              }
            />
          </div>
          <span
            className={`text-lg font-medium ${apiData.isBalanced ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
              }`}
          >
            {apiData.isBalanced ? "Balanced" : "Unbalanced"}
          </span>
        </motion.div>
      </div>

      {/* DataTable with inline filter checkboxes in toolbar area */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        {/* Filter checkboxes — right above the table */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="hideZero"
              checked={hideZero}
              onCheckedChange={(v) => setHideZero(!!v)}
            />
            <Label htmlFor="hideZero" className="text-sm cursor-pointer select-none">
              Hide zero balance
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="hideNoTx"
              checked={hideNoTx}
              onCheckedChange={(v) => setHideNoTx(!!v)}
            />
            <Label htmlFor="hideNoTx" className="text-sm cursor-pointer select-none">
              Hide no transactions
            </Label>
          </div>

        </div>

        <DataTable
          data={apiData.accounts}
          columns={columns}
          idKey="accountId"
          isLoading={false}
        />
      </motion.div>

    </div>
  );
}