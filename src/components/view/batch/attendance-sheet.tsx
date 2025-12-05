import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAttendance, type BatchMember } from "@/api/batchMember-api";
import { toast } from '@/hooks/use-toast';
import type { Response } from '@/types/response';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileDown, Loader2, User, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatTime = (timeStr: string) => {
	if (!timeStr) return "";
	const [hours, minutes] = timeStr.split(':');
	const hour = parseInt(hours, 10);
	const ampm = hour >= 12 ? 'PM' : 'AM';
	const formattedHour = hour % 12 || 12;
	return `${formattedHour}:${minutes} ${ampm}`;
};

const AttendanceSheet = () => {
	const { id } = useParams();
	const [batchData, setBatchData] = useState<BatchMember | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(true);

	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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
	const filteredMembers = members.filter(member =>
		member.memberName?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const toggleSelection = (id: number) => {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		setSelectedIds(newSet);
	};

	const toggleSelectAll = () => {
		const visibleIds = filteredMembers.map(m => m.batchMemberId);
		const allSelected = visibleIds.every(id => selectedIds.has(id));
		const newSet = new Set(selectedIds);

		if (allSelected) {
			visibleIds.forEach(id => newSet.delete(id));
		} else {
			visibleIds.forEach(id => newSet.add(id));
		}
		setSelectedIds(newSet);
	};

	const isAllSelected = filteredMembers.length > 0 && filteredMembers.every(m => selectedIds.has(m.batchMemberId));

	// NOTE: PDF Export logic remains unchanged (Output is typically always white paper)
	const handleExportPDF = () => {
		if (!batchData) return;

		const membersToExport = filteredMembers.filter(m => selectedIds.has(m.batchMemberId));

		if (membersToExport.length === 0) {
			toast({
				title: "Selection Empty",
				description: "Please select at least one member to export.",
				variant: "destructive"
			});
			return;
		}

		const doc = new jsPDF();

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

		const tableColumn = ["Sr. No", "Member Name", "Present / Absent"];

		const tableRows = membersToExport.map((member, index) => [
			index + 1,
			member.memberName,
			"[    ]"
		]);

		autoTable(doc, {
			head: [tableColumn],
			body: tableRows,
			startY: 50,
			theme: 'grid',
			styles: {
				fontSize: 11,
				cellPadding: 4,
				textColor: [0, 0, 0],
				lineColor: [200, 200, 200]
			},
			headStyles: {
				fillColor: [37, 99, 235],
				textColor: [255, 255, 255],
				fontStyle: 'bold'
			},
			columnStyles: {
				0: { cellWidth: 20, halign: 'center' },
				1: { cellWidth: 'auto' },
				2: { cellWidth: 40, halign: 'center' }
			},
			didParseCell: function (data) {
				if (data.section === 'body' && data.column.index === 2) {
					data.cell.styles.font = 'courier';
				}
			}
		});

		doc.save(`attendance_${batchData.batchName.replace(/\s+/g, '_')}.pdf`);

		toast({
			title: "Success",
			description: `Attendance sheet downloaded with ${membersToExport.length} members.`,
			variant: "success"
		})
	};

	return (
		<div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
			<div className="flex flex-col gap-6">

				{/* Header Card */}
				<div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-600 dark:border-blue-500 p-4 md:p-6 rounded-r-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
					<div>
						<h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
							{batchData?.batchName || "Loading Batch..."}
						</h1>
						<div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
							<span className="flex items-center gap-1">
								<User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
								Coach: <span className="font-semibold text-gray-900 dark:text-gray-200">{batchData?.coachName || "-"}</span>
							</span>
							<span className="flex items-center gap-1">
								<Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
								Time: <span className="font-semibold text-gray-900 dark:text-gray-200">
									{batchData ? `${formatTime(batchData.startTime)} - ${formatTime(batchData.endTime)}` : "-"}
								</span>
							</span>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						<div className="relative w-full sm:w-auto">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
							<input
								type="text"
								placeholder="Search student..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 w-full sm:w-64 transition-all"
							/>
						</div>

						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={handleExportPDF}
							disabled={loading || !batchData || selectedIds.size === 0}
							className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
						>
							<FileDown className="w-4 h-4" />
							<span>Export Selection</span>
						</motion.button>
					</div>
				</div>
			</div>

			{/* Table Container */}
			<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse min-w-[300px]">
						<thead>
							<tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-600 dark:text-gray-400 font-bold transition-colors">
								<th className="px-4 py-4 w-12 text-center">
									<input
										type="checkbox"
										checked={isAllSelected}
										onChange={toggleSelectAll}
										className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 cursor-pointer accent-blue-600"
									/>
								</th>
								<th className="px-4 md:px-6 py-4 w-16 md:w-24 text-center">Sr. No</th>
								<th className="px-4 md:px-6 py-4">Member Name</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100 dark:divide-gray-800">
							{loading ? (
								<tr>
									<td colSpan={3} className="py-12 text-center">
										<Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 dark:text-blue-500" />
										<p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Loading batch data...</p>
									</td>
								</tr>
							) : filteredMembers.length > 0 ? (
								<AnimatePresence>
									{filteredMembers.map((member, index) => (
										<motion.tr
											key={member.batchMemberId || index}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -10 }}
											transition={{ delay: index * 0.03 }}
											className={`transition-colors group border-b dark:border-gray-800 last:border-0 ${selectedIds.has(member.batchMemberId)
													? 'bg-white dark:bg-gray-950'
													: 'bg-gray-50 dark:bg-gray-900/50 opacity-60'
												}`}
										>
											<td className="px-4 py-4 text-center">
												<input
													type="checkbox"
													checked={selectedIds.has(member.batchMemberId)}
													onChange={() => toggleSelection(member.batchMemberId)}
													className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 cursor-pointer accent-blue-600"
												/>
											</td>
											<td className="px-4 md:px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400 font-mono">
												{index + 1}
											</td>
											<td className="px-4 md:px-6 py-4">
												<div className="flex items-center gap-3">
													<div className={`w-8 h-8 min-w-[2rem] rounded-full flex items-center justify-center transition-colors 
                                                        ${selectedIds.has(member.batchMemberId)
															? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
															: 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
														<User className="w-4 h-4" />
													</div>
													<span className={`font-medium break-words ${selectedIds.has(member.batchMemberId)
															? 'text-gray-900 dark:text-gray-100'
															: 'text-gray-400 dark:text-gray-500'
														}`}>
														{member.memberName}
													</span>
												</div>
											</td>
										</motion.tr>
									))}
								</AnimatePresence>
							) : (
								<tr>
									<td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400">
										No active members found in this batch.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400 px-2 gap-2">
				<span>Generated via Admin Portal</span>
				<span>
					Selected: <span className="font-bold text-blue-600 dark:text-blue-400">{selectedIds.size}</span> / <span className="font-bold text-gray-900 dark:text-gray-200">{filteredMembers.length}</span>
				</span>
			</div>
		</div>
	)
}

export default AttendanceSheet