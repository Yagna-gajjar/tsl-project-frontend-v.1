import { useState, useRef, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { TableVirtuoso } from 'react-virtuoso';
import {
	Upload, X, AlertCircle, Database,
	Trash2, CheckCircle2, Play, Pause, RotateCcw, Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export interface ExcelUploadProps<T = any> {
	title?: string;
	createFunction: (row: T, index: number) => Promise<void>;
	validateRow?: (row: T) => string | null;
	expectedColumns?: string[];
	onUploadComplete?: () => void;
}

type ProcessingStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

interface RowStatus {
	status: 'pending' | 'success' | 'error' | 'processing';
	message?: string;
}

export default function ExcelUpload<T extends Record<string, any>>({
	title = "Excel Data Importer",
	createFunction,
	validateRow,
	expectedColumns,
	onUploadComplete
}: ExcelUploadProps<T>) {

	const [data, setData] = useState<T[]>([]);
	const [_, setWorkbook] = useState<Record<string, T[]> | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);

	const [isDragging, setIsDragging] = useState(false);
	const [loadingFile, setLoadingFile] = useState(false);
	const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
	const [editValue, setEditValue] = useState("");

	const [processStatus, setProcessStatus] = useState<ProcessingStatus>('idle');
	const [currentIndex, setCurrentIndex] = useState(0);
	const [rowStatuses, setRowStatuses] = useState<Record<number, RowStatus>>({});

	const fileInputRef = useRef<HTMLInputElement>(null);
	const abortControllerRef = useRef<boolean>(false);

	const handleFileUpload = useCallback(async (file: File) => {
		setLoadingFile(true);
		try {
			const buffer = await file.arrayBuffer();
			const wb = XLSX.read(buffer);
			const parsedSheets: Record<string, T[]> = {};
			const sheets: string[] = [];

			wb.SheetNames.forEach(name => {
				const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" }) as T[];
				if (sheetData.length > 0) {
					parsedSheets[name] = sheetData;
					sheets.push(name);
				}
			});

			if (sheets.length === 0) throw new Error("File is empty");

			setWorkbook(parsedSheets);
			setData(parsedSheets[sheets[0]]);
			setFileName(file.name);

			setProcessStatus('idle');
			setCurrentIndex(0);
			setRowStatuses({});

		} catch (err) {
			console.error("Parse Error", err);
			alert("Failed to parse Excel file");
		} finally {
			setLoadingFile(false);
		}
	}, []);

	const startUploadProcess = useCallback(async () => {
		if (!data.length) return;

		setProcessStatus('running');
		abortControllerRef.current = false;
		let i = currentIndex;

		for (; i < data.length; i++) {
			if (abortControllerRef.current) {
				setProcessStatus('paused');
				setCurrentIndex(i);
				return;
			}

			setRowStatuses(prev => ({ ...prev, [i]: { status: 'processing' } }));
			setCurrentIndex(i);

			try {
				const row = data[i];

				if (validateRow) {
					const validationError = validateRow(row);
					if (validationError) throw new Error(validationError);
				}
				await createFunction(row, i);
				setRowStatuses(prev => ({ ...prev, [i]: { status: 'success' } }));

			} catch (error: any) {
				console.error(`Row ${i + 1} failed:`, error);
				setRowStatuses(prev => ({
					...prev,
					[i]: { status: 'error', message: error.message || "Upload failed" }
				}));
				setProcessStatus('error');
				setCurrentIndex(i);
				abortControllerRef.current = true;
				return;
			}
		}

		setProcessStatus('completed');
		if (onUploadComplete) onUploadComplete();

	}, [data, currentIndex, createFunction, validateRow, onUploadComplete]);

	const pauseUpload = useCallback(() => {
		abortControllerRef.current = true;
		setProcessStatus('paused');
	}, []);

	const resumeUpload = useCallback(() => {
		startUploadProcess();
	}, [startUploadProcess]);

	const updateCell = useCallback((rowIndex: number, col: string, value: any) => {
		setData(prevData => {
			const newData = [...prevData];
			newData[rowIndex] = { ...newData[rowIndex], [col]: value };
			return newData;
		});

		// Reset error status if modifying an error row
		setRowStatuses(prev => {
			if (prev[rowIndex]?.status === 'error') {
				const newStatuses = { ...prev };
				delete newStatuses[rowIndex];
				return newStatuses;
			}
			return prev;
		});

		if (processStatus === 'error' && rowIndex === currentIndex) {
			setProcessStatus('paused');
		}
	}, [currentIndex, processStatus]);

	const deleteRow = useCallback((rowIndex: number) => {
		if (processStatus === 'running') return;

		setData(prev => prev.filter((_, idx) => idx !== rowIndex));

		setRowStatuses(prev => {
			const newStatuses: Record<number, RowStatus> = {};
			Object.keys(prev).forEach(key => {
				const idx = Number(key);
				if (idx < rowIndex) {
					newStatuses[idx] = prev[idx];
				} else if (idx > rowIndex) {
					newStatuses[idx - 1] = prev[idx];
				}
			});
			return newStatuses;
		});
	}, [processStatus]);

	const deleteColumn = useCallback((colKey: string) => {
		if (processStatus === 'running') return;
		setData(prev => prev.map(row => {
			const newRow = { ...row };
			delete newRow[colKey];
			return newRow;
		}));
	}, [processStatus]);

	const columns = useMemo(() => data.length ? Object.keys(data[0]) : [], [data]);
	const isLocked = processStatus === 'running';

	const FixedHeader = useCallback(() => (
		<tr className="bg-gray-100 dark:bg-slate-900 border-b border-gray-300 dark:border-gray-700">
			<th className="w-[80px] p-3 text-center text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-slate-900 z-20 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
				Status
			</th>
			{columns.map(col => (
				<th key={col} className="p-3 text-left min-w-[150px] text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-900 z-10 group">
					<div className="flex items-center justify-between gap-2">
						<span className="truncate">{col}</span>
						{!isLocked && (
							<button
								onClick={() => deleteColumn(col)}
								className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-red-500 transition-all"
								title="Delete Column"
							>
								<Trash2 className="w-3 h-3" />
							</button>
						)}
					</div>
				</th>
			))}
		</tr>
	), [columns, isLocked, deleteColumn]);

	const RowContent = useCallback((index: number, row: any) => {
		const status = rowStatuses[index];
		const isCurrentError = status?.status === 'error';
		const isProcessed = status?.status === 'success';

		return (
			<>
				<td className="w-[80px] border-b border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50 p-0 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-100 dark:group-hover:bg-slate-800 transition-colors">
					<div className="w-full h-full flex items-center justify-center relative group/status">

						<div className={cn("flex items-center justify-center transition-opacity duration-200", !isLocked && "group-hover/status:opacity-0")}>
							{status?.status === 'processing' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
							{status?.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
							{status?.status === 'error' && (
								<div className="group/tooltip relative">
									<AlertCircle className="w-4 h-4 text-red-500 cursor-help" />
									<div className="absolute left-6 top-0 bg-red-600 text-white text-xs p-2 rounded w-48 hidden group-hover/tooltip:block z-50 shadow-xl">
										{status.message}
									</div>
								</div>
							)}
							{!status && <span className="text-gray-400 text-xs font-mono">{index + 1}</span>}
						</div>

						{!isLocked && (
							<button
								onClick={() => deleteRow(index)}
								className="absolute inset-0 hidden group-hover/status:flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 transition-all"
								title="Delete Row"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						)}
					</div>
				</td>

				{columns.map(col => (
					<td
						key={col}
						className={cn(
							"border-b border-r border-gray-100 dark:border-gray-800 text-sm p-0 min-w-[150px] relative transition-colors",
							isCurrentError && "bg-red-50 dark:bg-red-900/10",
							isProcessed && !isCurrentError && "bg-emerald-50/30 dark:bg-emerald-900/5"
						)}
						onDoubleClick={() => {
							if (status?.status !== 'success') {
								setEditingCell({ row: index, col });
								setEditValue(String(row[col] ?? ""));
							}
						}}
					>
						{editingCell?.row === index && editingCell?.col === col ? (
							<input
								autoFocus
								value={editValue}
								onChange={e => setEditValue(e.target.value)}
								onBlur={() => {
									updateCell(index, col, editValue);
									setEditingCell(null);
								}}
								onKeyDown={e => {
									if (e.key === 'Enter') {
										updateCell(index, col, editValue);
										setEditingCell(null);
									}
									if (e.key === 'Escape') setEditingCell(null);
								}}
								className="absolute inset-0 w-full h-full px-3 bg-white dark:bg-slate-800 border-2 border-emerald-500 outline-none z-20"
							/>
						) : (
							<div className="px-3 py-2 w-full h-full truncate text-gray-700 dark:text-gray-300">
								{String(row[col] ?? "")}
							</div>
						)}
					</td>
				))}
			</>
		);
	}, [rowStatuses, editingCell, editValue, columns, isLocked, deleteRow, updateCell]);

	return (
		<div className="w-full h-full flex flex-col bg-white dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden font-sans">

			<div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
				<div>
					<h2 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
						<Database className="w-5 h-5 text-emerald-600" />
						{title}
					</h2>
					{fileName && <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={fileName}>File: {fileName}</p>}
				</div>

				<div className="flex items-center gap-3">
					{data.length > 0 && processStatus !== 'completed' && (
						<>
							{processStatus === 'idle' || processStatus === 'paused' || processStatus === 'error' ? (
								<button
									onClick={processStatus === 'idle' ? startUploadProcess : resumeUpload}
									className={cn(
										"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-md transition-all active:scale-95",
										processStatus === 'error' ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-600 hover:bg-emerald-700"
									)}
								>
									{processStatus === 'error' ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
									{processStatus === 'idle' ? "Start Upload" : processStatus === 'error' ? "Retry & Resume" : "Resume"}
								</button>
							) : (
								<button
									onClick={pauseUpload}
									className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium shadow-md transition-all active:scale-95"
								>
									<Pause className="w-4 h-4" /> Pause
								</button>
							)}
						</>
					)}

					{data.length > 0 && (
						<button
							onClick={() => { setData([]); setWorkbook(null); setProcessStatus('idle'); }}
							disabled={isLocked}
							className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
							title="Clear All"
						>
							<X className="w-5 h-5" />
						</button>
					)}
				</div>
			</div>

			{data.length > 0 && (
				<div className="w-full h-1 bg-gray-100 dark:bg-slate-900">
					<motion.div
						initial={false}
						animate={{ width: `${(currentIndex / data.length) * 100}%` }}
						className={cn("h-full transition-all duration-300 ease-out",
							processStatus === 'error' ? "bg-red-500" : "bg-emerald-500"
						)}
					/>
				</div>
			)}

			<AnimatePresence>
				{processStatus === 'error' && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="bg-red-50 dark:bg-red-900/20 px-4 py-2 border-b border-red-200 dark:border-red-900/50"
					>
						<div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
							<AlertCircle className="w-4 h-4 flex-shrink-0" />
							<span>
								<strong>Stopped at Row {currentIndex + 1}:</strong> {rowStatuses[currentIndex]?.message || "Unknown error"}.
								Double-click the cell to fix, then click <strong>Resume</strong>.
							</span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="flex-1 bg-white dark:bg-slate-950 overflow-hidden relative">
				{data.length === 0 ? (
					<div
						onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
						onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
						onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); }}
						onClick={() => fileInputRef.current?.click()}
						className={cn(
							"h-full flex flex-col items-center justify-center cursor-pointer transition-colors m-4 rounded-xl border-2 border-dashed",
							isDragging ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-900"
						)}
					>
						<input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.csv" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
						{loadingFile ? (
							<Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
						) : (
							<>
								<Upload className="w-10 h-10 text-gray-400 mb-4" />
								<p className="text-gray-500 font-medium">Click or Drag Excel File Here</p>
								{expectedColumns && (
									<p className="text-xs text-gray-400 mt-2">Expected columns: {expectedColumns.join(", ")}</p>
								)}
							</>
						)}
					</div>
				) : (
					<TableVirtuoso
						data={data}
						fixedHeaderContent={FixedHeader}
						itemContent={RowContent}
						className="h-full"
						overscan={20}
						components={{
							Table: (props) => <table {...props} className="w-full border-collapse text-left" />,
							TableRow: (props) => <tr {...props} className="group hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors" />
						}}
					/>
				)}
			</div>
		</div>
	);
}