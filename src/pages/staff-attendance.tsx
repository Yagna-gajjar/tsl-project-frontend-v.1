import { useEffect, useState } from "react";
import { getAttendanceByDate } from "@/api/inout.api";
import {
	Calendar as CalendarIcon,
	Clock,
	ChevronDown,
	Mail,
	Briefcase,
	Timer,
	Loader2,
	AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types based on your JSON ---
interface Session {
	inOutId: number;
	inTime: string;
	outTime: string | null;
	minutes: number;
}

interface UserAttendance {
	userId: number;
	username: string;
	email: string;
	role: string;
	totalMinutes: number;
	sessions: Session[];
}

const formatDuration = (totalMinutes: number) => {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
};

const formatTime = (isoString: string | null) => {
	if (!isoString) return "Active";
	const date = new Date(isoString);
	return date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

const StaffAttendance = () => {
	// State
	const [selectedDate, setSelectedDate] = useState<string>(
		new Date().toISOString().split("T")[0] // Default to YYYY-MM-DD
	);
	const [attendanceData, setAttendanceData] = useState<UserAttendance[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

	// Fetch Data
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const response: any = await getAttendanceByDate(selectedDate);
				// Note: Casting to any first because your API return type might differ slightly in TS definition
				// Assuming response structure matches the JSON provided
				if (response?.success) {
					setAttendanceData(response.users);
				} else {
					setAttendanceData([]);
				}
			} catch (error) {
				console.error("Failed to fetch attendance:", error);
				setAttendanceData([]);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [selectedDate]);

	// Toggle Accordion
	const toggleExpand = (id: number) => {
		setExpandedUserId(expandedUserId === id ? null : id);
	};

	return (
		<div className="w-full max-w-4xl mx-auto p-4 space-y-6">
			{/* Header Section */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card text-card-foreground p-6 rounded-xl border shadow-sm dark:bg-gray-900 dark:border-gray-800">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<Briefcase className="w-6 h-6 text-blue-600" />
						Staff Attendance
					</h1>
					<p className="text-muted-foreground text-sm mt-1 dark:text-gray-400">
						View daily logs and session details.
					</p>
				</div>

				<div className="flex items-center gap-3 bg-background border p-2 rounded-lg dark:bg-gray-800 dark:border-gray-700">
					<CalendarIcon className="w-4 h-4 text-muted-foreground" />
					<input
						type="date"
						value={selectedDate}
						onChange={(e) => setSelectedDate(e.target.value)}
						className="bg-transparent border-none outline-none text-sm font-medium dark:text-white dark:[color-scheme:dark]"
					/>
				</div>
			</div>

			{/* Content Section */}
			<div className="space-y-4">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
						<Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
						<p>Loading attendance records...</p>
					</div>
				) : attendanceData.length === 0 ? (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex flex-col items-center justify-center py-16 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/25 dark:border-gray-700"
					>
						<AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
						<p className="text-lg font-medium text-foreground">
							No records found
						</p>
						<p className="text-sm text-muted-foreground">
							No staff attendance data available for {selectedDate}.
						</p>
					</motion.div>
				) : (
					<motion.div layout className="grid gap-4">
						<AnimatePresence>
							{attendanceData.map((user, index) => (
								<UserCard
									key={user.userId}
									user={user}
									isExpanded={expandedUserId === user.userId}
									onToggle={() => toggleExpand(user.userId)}
									index={index}
								/>
							))}
						</AnimatePresence>
					</motion.div>
				)}
			</div>
		</div>
	);
};

// --- Sub-Component: Individual User Card ---
const UserCard = ({
	user,
	isExpanded,
	onToggle,
	index,
}: {
	user: UserAttendance;
	isExpanded: boolean;
	onToggle: () => void;
	index: number;
}) => {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.05 }}
			className={`overflow-hidden rounded-xl border transition-colors duration-200 ${isExpanded
					? "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800"
					: "bg-white border-border hover:border-blue-300 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-700"
				}`}
		>
			{/* Summary Row (Always Visible) */}
			<div
				onClick={onToggle}
				className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
			>
				<div className="flex items-center gap-4">
					{/* Avatar Placeholder */}
					<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
						{user.username.charAt(0).toUpperCase()}
					</div>

					<div>
						<div className="flex items-center gap-2">
							<h3 className="font-semibold text-foreground dark:text-gray-100">
								{user.username}
							</h3>
							<span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border font-medium uppercase tracking-wide dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
								{user.role}
							</span>
						</div>
						<div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 dark:text-gray-400">
							<span className="flex items-center gap-1">
								<Mail className="w-3 h-3" /> {user.email}
							</span>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
					{/* Total Time Badge */}
					<div className="flex flex-col items-end">
						<span className="text-xs text-muted-foreground font-medium mb-0.5">
							Total Duration
						</span>
						<div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-green-50 text-green-700 font-bold border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50">
							<Timer className="w-3.5 h-3.5" />
							{formatDuration(user.totalMinutes)}
						</div>
					</div>

					<motion.div
						animate={{ rotate: isExpanded ? 180 : 0 }}
						transition={{ duration: 0.2 }}
					>
						<ChevronDown className="w-5 h-5 text-muted-foreground" />
					</motion.div>
				</div>
			</div>

			{/* Expanded Details (Sessions) */}
			<AnimatePresence>
				{isExpanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
					>
						<div className="px-4 pb-4 pt-0">
							<div className="border-t border-dashed my-2 dark:border-gray-700" />
							<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-4 flex items-center gap-2">
								<Clock className="w-3.5 h-3.5" />
								Session Timeline
							</h4>

							<div className="space-y-0 relative">
								{/* Vertical Timeline Line */}
								<div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800" />

								{user.sessions.length > 0 ? (
									user.sessions.map((session) => (
										<div
											key={session.inOutId}
											className="relative pl-8 py-2 group"
										>
											{/* Timeline Dot */}
											<div className="absolute left-[5px] top-[14px] w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 bg-blue-500 shadow-sm z-10" />

											<div className="bg-gray-50/50 hover:bg-gray-50 rounded-lg p-3 border border-transparent hover:border-gray-200 transition-all dark:bg-gray-800/30 dark:hover:bg-gray-800/60 dark:hover:border-gray-700">
												<div className="flex flex-wrap items-center justify-between gap-2">
													<div className="flex items-center gap-3">
														<div className="flex flex-col">
															<span className="text-[10px] text-muted-foreground uppercase font-bold">
																In Time
															</span>
															<span className="text-sm font-medium text-foreground dark:text-gray-200">
																{formatTime(session.inTime)}
															</span>
														</div>
														<span className="text-muted-foreground">→</span>
														<div className="flex flex-col">
															<span className="text-[10px] text-muted-foreground uppercase font-bold">
																Out Time
															</span>
															<span
																className={`text-sm font-medium ${!session.outTime
																		? "text-green-600 animate-pulse"
																		: "text-foreground dark:text-gray-200"
																	}`}
															>
																{formatTime(session.outTime)}
															</span>
														</div>
													</div>

													<div className="flex items-center gap-2">
														<span className="text-xs text-muted-foreground bg-white border px-2 py-1 rounded shadow-sm dark:bg-gray-950 dark:border-gray-700 dark:text-gray-400">
															{session.minutes} min
														</span>
													</div>
												</div>
											</div>
										</div>
									))
								) : (
									<div className="pl-8 text-sm text-muted-foreground italic">
										No sessions recorded for this day.
									</div>
								)}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
};

export default StaffAttendance;