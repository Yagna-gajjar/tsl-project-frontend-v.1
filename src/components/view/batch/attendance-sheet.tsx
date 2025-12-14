import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { getAttendance, shiftMembers } from "@/api/batchMember.api";
import { getBatch } from "@/api/batch.api";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileDown,
  Loader2,
  User,
  Clock,
  Settings2,
  Check,
  ArrowRightLeft,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Batch } from "@/types/batch";
import type { Member } from "@/types/member";
import type { BatchMember } from "@/types/batchMember";

const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return format(new Date(dateStr), "dd MMM yyyy");
};

type ColumnKey =
  | "srNo"
  | "name"
  | "startDate"
  | "endDate"
  | "billingRate"
  | "status";

interface ExportColumn {
  id: ColumnKey;
  label: string;
  enabled: boolean;
}

const AttendanceSheet = () => {
  const { id } = useParams();

  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  const [batchData, setBatchData] = useState<BatchMember | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [targetBatches, setTargetBatches] = useState<Batch[]>();
  const [selectedTargetBatchId, setSelectedTargetBatchId] =
    useState<string>("");
  const [isShifting, setIsShifting] = useState(false);

  const [exportColumns, setExportColumns] = useState<ExportColumn[]>([
    { id: "srNo", label: "Sr. No", enabled: true },
    { id: "name", label: "Member Name", enabled: true },
    { id: "startDate", label: "Start Date", enabled: true },
    { id: "endDate", label: "End Date", enabled: true },
    { id: "billingRate", label: "Billing Rate", enabled: true },
    { id: "status", label: "Present / Absent", enabled: true },
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res: Response<BatchMember> = await getAttendance(
        Number(id),
        selectedDate
      );
      const data = res.data;
      setBatchData(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [id, selectedDate]);

  const members = batchData?.members ?? [];
  const filteredMembers = members.filter((member) =>
    member.memberName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMemberId = (member: Member) => Number(member.memberId);

  const toggleSelection = (memberId: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(memberId)) newSet.delete(memberId);
    else newSet.add(memberId);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredMembers.map((m: Member | any) => getMemberId(m));
    const allSelected = visibleIds.every((id: number | any) =>
      selectedIds.has(id)
    );
    const newSet = new Set(selectedIds);

    if (allSelected)
      visibleIds.forEach((id: number | any) => newSet.delete(Number(id)));
    else visibleIds.forEach((id: number | any) => newSet.add(id));
    setSelectedIds(newSet);
  };

  const toggleExportColumn = (id: ColumnKey) => {
    setExportColumns((prev) =>
      prev.map((col) =>
        col.id === id ? { ...col, enabled: !col.enabled } : col
      )
    );
  };

  const isAllSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m: Member | any) =>
      selectedIds.has(getMemberId(m) as number)
    );

  const openShiftModal = async () => {
    if (!batchData || !batchData.courseId) {
      toast({
        title: "Error",
        description: "Course information missing.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res: Response<Batch[]> = await getBatch({
        courseId: Number(batchData.courseId),
      });
      const validBatches = res?.data?.filter(
        (b: Batch) => b.batchId !== Number(id)
      );
      setTargetBatches(validBatches);
      setIsShiftModalOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load batches.",
        variant: "destructive",
      });
    }
  };

  const handleShiftMembers = async () => {
    if (!selectedTargetBatchId) {
      toast({
        title: "Validation",
        description: "Please select a target batch.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsShifting(true);
      const memberIdsArray = Array.from(selectedIds);
      await shiftMembers(
        Number(id),
        Number(selectedTargetBatchId),
        memberIdsArray
      );
      toast({
        title: "Success",
        description: "Members shifted successfully.",
        variant: "success",
      });
      setIsShiftModalOpen(false);
      setSelectedIds(new Set());
      setSelectedTargetBatchId("");
      fetchAttendance();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to shift members.",
        variant: "destructive",
      });
    } finally {
      setIsShifting(false);
    }
  };

  const handleExportPDF = () => {
    if (!batchData) return;
    const membersToExport = filteredMembers.filter((m: Member | any) =>
      selectedIds.has(getMemberId(m) as number)
    );
    if (membersToExport.length === 0) {
      toast({
        title: "Selection Empty",
        description: "Select members to export.",
        variant: "destructive",
      });
      return;
    }
    const doc = new jsPDF();
    doc.text(`Attendance Sheet - ${formatDate(selectedDate)}`, 14, 20);
    doc.save(`attendance_${batchData.batchName}_${selectedDate}.pdf`);
    toast({
      title: "Success",
      description: "PDF downloaded successfully.",
      variant: "success",
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 relative">
      <AnimatePresence>
        {isShiftModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                  Shift Members
                </h3>
                <button
                  onClick={() => setIsShiftModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                  You are about to move <strong>{selectedIds.size}</strong>{" "}
                  members from
                  <span className="font-semibold"> {batchData?.batchName}</span>
                  .
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Target Batch
                  </label>
                  <Select
                    onValueChange={setSelectedTargetBatchId}
                    value={selectedTargetBatchId}
                  >
                    <SelectTrigger className="w-full bg-white dark:bg-gray-950">
                      <SelectValue placeholder="-- Select a Batch --" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetBatches?.map((batch: Batch) => (
                        <SelectItem
                          key={batch.batchId}
                          value={String(batch.batchId)}
                        >
                          {batch.batchName} ({String(batch.startTime)} -{" "}
                          {String(batch.endTime)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                <button
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShiftMembers}
                  disabled={isShifting || !selectedTargetBatchId}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isShifting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Shift
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-6">
        <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-600 dark:border-blue-500 p-4 md:p-6 rounded-r-lg shadow-sm flex flex-col xl:flex-row justify-between gap-6 transition-colors">
          <div className="flex-shrink-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              {batchData?.batchName || "Loading Batch..."}
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-200">
                  {batchData?.coachName || "-"}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-200">
                  {batchData
                    ? `${formatTime(batchData.startTime)} - ${formatTime(
                        batchData.endTime
                      )}`
                    : "-"}
                </span>
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full xl:max-w-lg">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="relative w-full sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full sm:w-[200px] h-10 justify-start text-left font-normal bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(new Date(selectedDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(selectedDate)}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(format(date, "yyyy-MM-dd"));
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-full pl-10 pr-4 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
            </div>

            <div
              className="flex items-center justify-start sm:justify-end gap-2 w-full"
              ref={exportMenuRef}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openShiftModal}
                disabled={loading || selectedIds.size === 0}
                className="h-10 flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-700 text-white px-4 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Shift Selected</span>
              </motion.button>

              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="h-10 w-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <Settings2 className="w-4 h-4" />
                </motion.button>

                <AnimatePresence>
                  {isExportMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden"
                    >
                      <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          PDF Columns
                        </p>
                      </div>
                      <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                        {exportColumns.map((col) => (
                          <button
                            key={col.id}
                            onClick={() => toggleExportColumn(col.id)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                col.enabled
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-gray-300 dark:border-gray-600"
                              }`}
                            >
                              {col.enabled && <Check className="w-3 h-3" />}
                            </div>
                            <span
                              className={
                                col.enabled
                                  ? "text-gray-900 dark:text-gray-100 font-medium"
                                  : "text-gray-500"
                              }
                            >
                              {col.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportPDF}
                disabled={loading || !batchData || selectedIds.size === 0}
                className="h-10 flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
              >
                <FileDown className="w-4 h-4" />
                <span>Export PDF</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-600 dark:text-gray-400 font-bold">
                <th className="px-4 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="px-6 py-4 w-20 text-center">Sr. No</th>
                <th className="px-6 py-4">Member Name</th>
                <th className="px-6 py-4 w-32">Start Date</th>
                <th className="px-6 py-4 w-32">End Date</th>
                <th className="px-6 py-4 w-32 text-right">Rate (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                    <p className="text-gray-400 text-sm mt-2">Loading...</p>
                  </td>
                </tr>
              ) : filteredMembers.length > 0 ? (
                <AnimatePresence>
                  {filteredMembers.map((member: any, index: number) => (
                    <motion.tr
                      key={member.batchMemberId || index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`transition-colors group border-b dark:border-gray-800 last:border-0 ${
                        selectedIds.has(getMemberId(member as any) as number)
                          ? "bg-blue-50/50 dark:bg-blue-900/10"
                          : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(
                            getMemberId(member) as number
                          )}
                          onChange={() =>
                            toggleSelection(getMemberId(member) as number)
                          }
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer accent-blue-600"
                        />
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500 font-mono">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                                        ${
                                                          selectedIds.has(
                                                            getMemberId(member)
                                                          )
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-gray-100 text-gray-500"
                                                        }`}
                          >
                            {member.memberName?.charAt(0) || "U"}
                          </div>
                          <span
                            className={`font-medium ${
                              selectedIds.has(getMemberId(member))
                                ? "text-gray-900 dark:text-gray-100"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {member.memberName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(member.startDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(member.endDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 text-right font-mono whitespace-nowrap">
                        {formatCurrency(Number(member.billingRate) || 0)}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 px-2">
        <span>Total Members: {filteredMembers.length}</span>
        <span>
          Selected:{" "}
          <span className="font-bold text-blue-600">{selectedIds.size}</span>
        </span>
      </div>
    </div>
  );
};

export default AttendanceSheet;
