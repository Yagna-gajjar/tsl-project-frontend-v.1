import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
	Calendar, Download, Loader2, MinusCircle, FileText, TrendingDown, TrendingUp, Wallet, PieChart, Users, Briefcase, Building2, Receipt
} from "lucide-react";
import { getBills } from "@/api/billing.api";
import { getDebitNotes } from "@/api/debitNote.api";
import type { Academy } from "@/types/academy";
import type { DebitNote } from "@/types/debitNote";

interface MonthSlice {
	year: string;
	month: string;
	fromDate: string;
	toDate: string;
	days: string;
	rate: number;
	amount: number;
}

interface EnrollmentBill {
	enrollmentId: number;
	academyId: number;
	academyName: string;
	courseName: string;
	memberName: string;
	monthSlices: MonthSlice[];
	totalForEnrollment: number;
}

interface BillingResponse {
	success: boolean;
	message: string;
	data: EnrollmentBill[];
	total: number;
	dateRange: {
		startDate: string;
		endDate: string;
	};
}

interface AcademyWithShares extends Academy {
	share_main?: number | null;
	share_tanna?: number | null;
	share_tsl?: number | null;
	share_expenses?: number | null;
}

const BillingPage = ({ academy }: { academy: AcademyWithShares | null }) => {
	const [loading, setLoading] = useState(false);
	const [billingData, setBillingData] = useState<BillingResponse | null>(null);
	const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);

	const [startDate, setStartDate] = useState("2026-01-01");
	const [endDate, setEndDate] = useState("2026-01-31");

	useEffect(() => {
		if (!academy?.academyId || !startDate || !endDate) return;

		const fetchData = async () => {
			setLoading(true);
			try {
				const [billsResponse, notesResponse] = await Promise.all([
					getBills({
						academyId: academy.academyId,
						startDate,
						endDate,
					}),
					getDebitNotes({
						dateFrom: startDate,
						dateTo: endDate,
						limit: 1000,
						debitNoteAcademyId: academy.academyId
					})
				]);
				setBillingData(billsResponse);
				setDebitNotes(notesResponse.data || []);
			} catch (error) {
				console.error("Error fetching financial data:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [academy, startDate, endDate]);

	const financials = useMemo(() => {
		const grossEarnings = billingData?.total || 0;
		const totalDeductions = debitNotes.reduce((sum, note) => sum + note.debitNoteAmount, 0);

		const pctMain = academy?.share_main || 0;
		const pctTanna = academy?.share_tanna || 0;
		const pctTsl = academy?.share_tsl || 0;
		const pctExpenses = academy?.share_expenses || 0;

		const grossMain = grossEarnings * (pctMain / 100);
		const grossTanna = grossEarnings * (pctTanna / 100);
		const grossTsl = grossEarnings * (pctTsl / 100);
		const grossExpenses = grossEarnings * (pctExpenses / 100);

		const netMain = grossMain - totalDeductions;

		const totalDistributed = netMain + grossTanna + grossTsl + grossExpenses;

		return {
			grossEarnings,
			totalDeductions,
			totalEnrollments: billingData?.data.length || 0,
			totalDistributed,
			shares: {
				main: { percent: pctMain, gross: grossMain, net: netMain },
				tanna: { percent: pctTanna, gross: grossTanna, net: grossTanna },
				tsl: { percent: pctTsl, gross: grossTsl, net: grossTsl },
				expenses: { percent: pctExpenses, gross: grossExpenses, net: grossExpenses }
			}
		};
	}, [billingData, debitNotes, academy]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: "INR",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const formatDateDisplay = (dateStr: string) => {
		if (!dateStr) return "-";
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	};

	return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden font-sans">
      <header className="flex-none px-6 py-5 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="bg-blue-600 text-white p-1.5 rounded-lg shadow-blue-500/20 shadow-lg">
                <Wallet size={20} />
              </span>
              Financial Statement
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {billingData?.data[0]?.academyName ||
                  (academy
                    ? `Academy #${academy.academyId}`
                    : "Select Academy")}
              </p>
              {academy?.academyType && (
                <span className="text-xs bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-neutral-700">
                  {academy.academyType}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-100 dark:bg-neutral-800 p-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-inner">
            <div className="relative group">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-transparent text-sm font-semibold outline-none text-slate-700 dark:text-slate-200 cursor-pointer uppercase tracking-wide"
              />
            </div>
            <span className="text-slate-400 dark:text-slate-600 font-medium">
              to
            </span>
            <div className="relative group">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-3 pr-3 py-1.5 bg-transparent text-sm font-semibold outline-none text-slate-700 dark:text-slate-200 cursor-pointer text-right uppercase tracking-wide"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-neutral-700">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
                  Gross Revenue
                </p>
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white mt-1">
                  {loading ? "..." : formatCurrency(financials.grossEarnings)}
                </h2>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={24} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
                  Total Deductions
                </p>
                <h2 className="text-4xl font-bold text-rose-600 dark:text-rose-500 mt-1">
                  {loading
                    ? "..."
                    : `-${formatCurrency(financials.totalDeductions)}`}
                </h2>
              </div>
              <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <TrendingDown size={24} />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
              <PieChart size={20} className="text-blue-600" />
              Revenue Distribution
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ShareCard
                title="Academy Main"
                icon={<Building2 size={18} />}
                percentage={financials.shares.main.percent}
                gross={financials.shares.main.gross}
                deduction={financials.totalDeductions}
                net={financials.shares.main.net}
                colorClass="slate"
              />

              <ShareCard
                title="Tanna Share"
                icon={<Users size={18} />}
                percentage={financials.shares.tanna.percent}
                gross={financials.shares.tanna.gross}
                net={financials.shares.tanna.net}
                colorClass="indigo"
              />

              <ShareCard
                title="TSL Share"
                icon={<Briefcase size={18} />}
                percentage={financials.shares.tsl.percent}
                gross={financials.shares.tsl.gross}
                net={financials.shares.tsl.net}
                colorClass="blue"
              />

              <ShareCard
                title="Expense Fund"
                icon={<Receipt size={18} />}
                percentage={financials.shares.expenses.percent}
                gross={financials.shares.expenses.gross}
                net={financials.shares.expenses.net}
                colorClass="amber"
              />
            </div>
          </motion.div>

          {debitNotes.length > 0 && (
            <div className="border border-rose-200 dark:border-rose-900/30 rounded-2xl overflow-hidden bg-rose-50/50 dark:bg-rose-900/5">
              <div className="px-6 py-4 border-b border-rose-200 dark:border-rose-900/30 flex items-center justify-between bg-rose-50 dark:bg-rose-900/10">
                <h3 className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-2">
                  <MinusCircle size={18} />
                  Deductions (Applied to Main Share)
                </h3>
                <span className="text-xs font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-300 px-2 py-1 rounded">
                  {debitNotes.length} Records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/50 dark:bg-neutral-900/50 text-rose-900/60 dark:text-rose-400/60 font-medium">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Remarks</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-200/50 dark:divide-rose-900/20">
                    {debitNotes.map((note) => (
                      <tr
                        key={note.debitNoteId}
                        className="hover:bg-rose-100/50 dark:hover:bg-rose-900/20 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-rose-900 dark:text-rose-100">
                          {formatDateDisplay(note.debitNoteDate as any)}
                        </td>
                        <td className="px-6 py-4 text-rose-800 dark:text-rose-200 uppercase text-xs font-bold">
                          {note.debitNoteType}
                        </td>
                        <td className="px-6 py-4 text-rose-700 dark:text-rose-300">
                          {note.debitNoteRemarks}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-rose-600 dark:text-rose-400">
                          -{formatCurrency(note.debitNoteAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-200 dark:border-neutral-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-950/50">
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                <FileText size={18} className="text-blue-600" />
                Gross Enrollment Details
              </h3>
              <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors">
                <Download size={16} />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto min-h-[200px]">
              {loading ? (
                <div className="h-full w-full flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                  <p className="text-slate-400 text-sm">Processing...</p>
                </div>
              ) : billingData && billingData.data.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-neutral-950 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-neutral-800">
                    <tr>
                      <th className="px-6 py-3">Member</th>
                      <th className="px-6 py-3">Period</th>
                      <th className="px-6 py-3 text-right">Days</th>
                      <th className="px-6 py-3 text-right">Rate</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {billingData.data.map((bill) => (
                      <React.Fragment key={bill.enrollmentId}>
                        {bill.monthSlices.map((slice, sliceIndex) => (
                          <tr
                            key={`${bill.enrollmentId}-${sliceIndex}`}
                            className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                              {bill.memberName}
                              <div className="text-xs text-slate-500 font-normal">
                                {bill.courseName}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                              {formatDateDisplay(slice.fromDate)} -{" "}
                              {formatDateDisplay(slice.toDate)}
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                              {slice.days}
                            </td>
                            <td className="px-6 py-4 text-right text-slate-500">
                              {formatCurrency(slice.rate)}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300">
                              {formatCurrency(slice.amount)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <p>No billing records.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ShareCard = ({
	title,
	icon,
	percentage,
	gross,
	deduction = 0,
	net,
	colorClass
}: {
	title: string;
	icon: React.ReactNode;
	percentage: number;
	gross: number;
	deduction?: number;
	net: number;
	colorClass: "slate" | "indigo" | "blue" | "amber";
}) => {
	const styles = {
		slate: "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-neutral-700",
		indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30",
		blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
		amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
	};

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

	return (
		<div className={`rounded-xl border p-5 flex flex-col justify-between h-full relative overflow-hidden ${styles[colorClass]}`}>
			<div>
				<div className="flex justify-between items-start mb-2">
					<div className="flex items-center gap-2 font-semibold opacity-90">
						{icon}
						<span>{title}</span>
					</div>
					<span className="text-xs font-bold px-2 py-1 rounded-full bg-white/50 dark:bg-black/20">
						{percentage}%
					</span>
				</div>

				{deduction > 0 && (
					<div className="mb-2 text-xs opacity-70 flex flex-col gap-0.5 border-b border-black/5 dark:border-white/5 pb-2">
						<div className="flex justify-between">
							<span>Gross Share:</span>
							<span>{formatCurrency(gross)}</span>
						</div>
						<div className="flex justify-between text-rose-500 font-semibold">
							<span>Less Debit Notes:</span>
							<span>- {formatCurrency(deduction)}</span>
						</div>
					</div>
				)}
			</div>

			<div>
				<p className="text-xs opacity-70 mb-0.5">{deduction > 0 ? "Net Calculated:" : "Calculated Share:"}</p>
				<div className={`text-2xl font-bold ${net < 0 ? "text-rose-600 dark:text-rose-500" : ""}`}>
					{formatCurrency(net)}
				</div>
			</div>
		</div>
	);
};

export default BillingPage;