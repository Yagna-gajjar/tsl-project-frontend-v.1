import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getAttendance, type BatchMember } from "@/api/batchMember-api";
import { toast } from '@/hooks/use-toast';
import type { Response } from '@/types/response';

import { motion, AnimatePresence } from 'framer-motion';
import {
	Search,
	FileDown,
	Loader2,
	User,
	Clock,
	Settings2,
	Check,
	ChevronDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// --- Utility Functions ---

const formatTime = (timeStr: string) => {
	if (!timeStr) return "";
	const [hours, minutes] = timeStr.split(':');
	const hour = parseInt(hours, 10);
	const ampm = hour >= 12 ? 'PM' : 'AM';
	const formattedHour = hour % 12 || 12;
	return `${formattedHour}:${minutes} ${ampm}`;
};

const formatCurrency = (amount: number | string) => {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0
	}).format(Number(amount));
};

const formatDate = (dateStr: string) => {
	if (!dateStr) return "-";
	return format(new Date(dateStr), 'dd MMM yyyy');
};

// --- Types ---

// Define available exportable columns
type ColumnKey = 'srNo' | 'name' | 'startDate' | 'endDate' | 'billingRate' | 'status';

interface ExportColumn {
	id: ColumnKey;
	label: string;
	enabled: boolean;
}

const AttendanceSheet = () => {
	const { id } = useParams();
	const [batchData, setBatchData] = useState<BatchMember | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(true);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

	// UI State for Export Menu
	const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
	const exportMenuRef = useRef<HTMLDivElement>(null);

	// Configuration for PDF Export Columns
	const [exportColumns, setExportColumns] = useState<ExportColumn[]>([
		{ id: 'srNo', label: 'Sr. No', enabled: true },
		{ id: 'name', label: 'Member Name', enabled: true },
		{ id: 'startDate', label: 'Start Date', enabled: true },
		{ id: 'endDate', label: 'End Date', enabled: true },
		{ id: 'billingRate', label: 'Billing Rate', enabled: true },
		{ id: 'status', label: 'Present / Absent', enabled: true },
	]);

	// Handle clicking outside the export menu to close it
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
				setIsExportMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		const fetchAttendance = async () => {
			try {
				setLoading(true);
				const res: Response<any> = await getAttendance(Number(id));
				const data = res.data;
				setBatchData(data);

				if (data?.members) {
					setSelectedIds(new Set(data.members.map((m: any) => m.batchMemberId)));
				}
			} catch (err) {
				toast({
					title: "Error",
					description: "Failed to fetch attendance.",
					variant: "destructive"
				})
			} finally {
				setLoading(false);
			}
		}
		fetchAttendance();
	}, [id]);

	const members = batchData?.members ?? [];
	const filteredMembers = members.filter((member: any) =>
		member.memberName?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// --- Selection Logic ---

	const toggleSelection = (id: number) => {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) newSet.delete(id);
		else newSet.add(id);
		setSelectedIds(newSet);
	};

	const toggleSelectAll = () => {
		const visibleIds = filteredMembers.map((m: any) => m.batchMemberId);
		const allSelected = visibleIds.every((id: number) => selectedIds.has(id));
		const newSet = new Set(selectedIds);

		if (allSelected) visibleIds.forEach((id: number) => newSet.delete(id));
		else visibleIds.forEach((id: number) => newSet.add(id));
		setSelectedIds(newSet);
	};

	const toggleExportColumn = (id: ColumnKey) => {
		setExportColumns(prev => prev.map(col =>
			col.id === id ? { ...col, enabled: !col.enabled } : col
		));
	};

	const isAllSelected = filteredMembers.length > 0 && filteredMembers.every((m: any) => selectedIds.has(m.batchMemberId));

	// --- PDF Export Logic ---

	const handleExportPDF = () => {
		if (!batchData) return;

		const membersToExport = filteredMembers.filter((m: any) => selectedIds.has(m.batchMemberId));

		if (membersToExport.length === 0) {
			toast({ title: "Selection Empty", description: "Select members to export.", variant: "destructive" });
			return;
		}

		const doc = new jsPDF();

		// -- Header Section --
		doc.setTextColor(0, 0, 0);
		doc.setFontSize(18);
		doc.setFont("helvetica", "bold");
		doc.text("Attendance Sheet", 14, 20);

		doc.setFontSize(10);
		doc.setFont("helvetica", "normal");
		doc.setDrawColor(200, 200, 200);
		doc.line(14, 25, 196, 25);

		doc.text(`Batch: ${batchData.batchName}`, 14, 35);
		doc.text(`Coach: ${batchData.coachName}`, 14, 42);

		const timeString = `${formatTime(batchData.startTime)} - ${formatTime(batchData.endTime)}`;
		doc.text(`Time: ${timeString}`, 120, 35);
		doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 42);

		// -- Dynamic Table Generation --

		// 1. Filter enabled columns
		const activeColumns = exportColumns.filter(col => col.enabled);

		// 2. Build Table Headers
		const tableHeader = activeColumns.map(col => col.label);

		// 3. Build Table Rows
		const tableRows = membersToExport.map((member: any, index: number) => {
			return activeColumns.map(col => {
				switch (col.id) {
					case 'srNo': return index + 1;
					case 'name': return member.memberName;
					case 'startDate': return formatDate(member.startDate);
					case 'endDate': return formatDate(member.endDate);
					case 'billingRate': return formatCurrency(member.billingRate || 0);
					case 'status': return "[    ]";
					default: return "";
				}
			});
		});

		autoTable(doc, {
			head: [tableHeader],
			body: tableRows,
			startY: 50,
			theme: 'grid',
			styles: {
				fontSize: 10,
				cellPadding: 3,
				textColor: [0, 0, 0],
				lineColor: [200, 200, 200]
			},
			headStyles: {
				fillColor: [37, 99, 235],
				textColor: [255, 255, 255],
				fontStyle: 'bold'
			},
			// Dynamically center the SrNo and Status columns if they exist
			columnStyles: {
				// Find index of specific columns to apply styles
				...(activeColumns.findIndex(c => c.id === 'srNo') !== -1
					? { [activeColumns.findIndex(c => c.id === 'srNo')]: { halign: 'center', cellWidth: 15 } }
					: {}),
				...(activeColumns.findIndex(c => c.id === 'status') !== -1
					? { [activeColumns.findIndex(c => c.id === 'status')]: { halign: 'center', font: 'courier' } }
					: {})
			},
		});

		doc.save(`attendance_${batchData.batchName.replace(/\s+/g, '_')}.pdf`);
		toast({ title: "Success", description: "PDF downloaded successfully.", variant: "success" });
	};

	return (
		<div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
			<div className="flex flex-col gap-6">

				{/* --- Header Card --- */}
				<div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-600 dark:border-blue-500 p-4 md:p-6 rounded-r-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
					<div>
						<h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
							{batchData?.batchName || "Loading Batch..."}
						</h1>
						<div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-6 mt-2 text-sm text-gray-600 dark:text-gray-400">
							<span className="flex items-center gap-1">
								<User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
								<span className="font-semibold text-gray-900 dark:text-gray-200">{batchData?.coachName || "-"}</span>
							</span>
							<span className="flex items-center gap-1">
								<Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
								<span className="font-semibold text-gray-900 dark:text-gray-200">
									{batchData ? `${formatTime(batchData.startTime)} - ${formatTime(batchData.endTime)}` : "-"}
								</span>
							</span>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
						{/* Search Bar */}
						<div className="relative w-full sm:w-auto">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								placeholder="Search student..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 w-full sm:w-64"
							/>
						</div>

						{/* Export Controls Group */}
						<div className="flex items-center gap-2 w-full sm:w-auto relative" ref={exportMenuRef}>

							{/* Export Options Dropdown Trigger */}
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
								className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
								title="Customize PDF Columns"
							>
								<Settings2 className="w-4 h-4" />
								<ChevronDown className={`w-3 h-3 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
							</motion.button>

							{/* Export Options Dropdown Menu */}
							<AnimatePresence>
								{isExportMenuOpen && (
									<motion.div
										initial={{ opacity: 0, y: 10, scale: 0.95 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: 10, scale: 0.95 }}
										className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
									>
										<div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
											<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PDF Columns</p>
										</div>
										<div className="p-2 space-y-1 max-h-60 overflow-y-auto">
											{exportColumns.map((col) => (
												<button
													key={col.id}
													onClick={() => toggleExportColumn(col.id)}
													className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
												>
													<div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${col.enabled
															? 'bg-blue-600 border-blue-600 text-white'
															: 'border-gray-300 dark:border-gray-600'
														}`}>
														{col.enabled && <Check className="w-3 h-3" />}
													</div>
													<span className={col.enabled ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500'}>
														{col.label}
													</span>
												</button>
											))}
										</div>
									</motion.div>
								)}
							</AnimatePresence>

							{/* Main Export Button */}
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={handleExportPDF}
								disabled={loading || !batchData || selectedIds.size === 0}
								className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
							>
								<FileDown className="w-4 h-4" />
								<span>Export PDF</span>
							</motion.button>
						</div>
					</div>
				</div>
			</div>

			{/* --- Table Container --- */}
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
											className={`transition-colors group border-b dark:border-gray-800 last:border-0 ${selectedIds.has(member.batchMemberId)
												? 'bg-blue-50/50 dark:bg-blue-900/10'
												: 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'
												}`}
										>
											<td className="px-4 py-4 text-center">
												<input
													type="checkbox"
													checked={selectedIds.has(member.batchMemberId)}
													onChange={() => toggleSelection(member.batchMemberId)}
													className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer accent-blue-600"
												/>
											</td>
											<td className="px-6 py-4 text-center text-sm text-gray-500 font-mono">
												{index + 1}
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-3">
													<div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                                        ${selectedIds.has(member.batchMemberId)
															? 'bg-blue-100 text-blue-700'
															: 'bg-gray-100 text-gray-500'}`}>
														{member.memberName?.charAt(0) || "U"}
													</div>
													<span className={`font-medium ${selectedIds.has(member.batchMemberId) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
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
												{formatCurrency(member.billingRate || 0)}
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
				<span>Selected: <span className="font-bold text-blue-600">{selectedIds.size}</span></span>
			</div>
		</div>
	)
}

export default AttendanceSheet