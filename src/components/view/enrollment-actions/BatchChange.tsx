import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
	CalendarDays,
	Clock,
	User,
	MapPin,
	CheckCircle2,
	Loader2,
	AlertCircle,
	ArrowRight
} from "lucide-react";
import { getEnrollmentById } from "@/api/enrollment.api";
import { getBatch } from "@/api/batch.api"; // Assuming updateBatch exists, if not, replace with actual API
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";
import type { Enrollment } from "@/types/enrollment";
import type { Batch } from "@/types/batch";
import { changeBatch, type BatchMember } from "@/api/batchMember-api"

const formatTime = (timeString: string) => {
	if (!timeString) return "";
	const [hours, minutes] = timeString.split(":");
	const date = new Date();
	date.setHours(Number(hours));
	date.setMinutes(Number(minutes));
	return date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "numeric",
		hour12: true,
	});
};

const formatWeekDays = (days: number | string) => {
	const dayMap: Record<string, string> = {
		"1": "Mon", "2": "Tue", "3": "Wed", "4": "Thu", "5": "Fri", "6": "Sat", "7": "Sun"
	};
	return String(days)
		.split("")
		.map((d) => dayMap[d])
		.join(", ");
};

const BatchChange = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
	const [batches, setBatches] = useState<Batch[]>([]);
	const [loadingEnrollment, setLoadingEnrollment] = useState(true);
	const [loadingBatches, setLoadingBatches] = useState(false);
	const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const fetchEnrollment = async () => {
			setLoadingEnrollment(true);
			try {
				const resp: Response<Enrollment | any> = await getEnrollmentById(Number(id));
				// Handle case where data might be an array or object based on your API
				const data = Array.isArray(resp.data) ? resp.data[0] : resp.data;
				setEnrollment(data);
			} catch (err) {
				toast({
					title: "Error",
					description: "Failed to fetch enrollment details.",
					variant: "destructive",
				});
			} finally {
				setLoadingEnrollment(false);
			}
		};
		if (id) fetchEnrollment();
	}, [id]);

	useEffect(() => {
		const fetchBatchDetails = async () => {
			if (!enrollment?.courseId) return;

			setLoadingBatches(true);
			try {
				const resp: Response<Batch[]> = await getBatch({
					courseId: Number(enrollment.courseId),
				});
				setBatches(resp.data || []);
			} catch (err) {
				toast({
					title: "Error",
					description: "Failed to fetch available batches.",
					variant: "destructive",
				});
			} finally {
				setLoadingBatches(false);
			}
		};

		if (enrollment) {
			fetchBatchDetails();
		}
	}, [enrollment]);

	const handleSubmit = async () => {
		if (!selectedBatchId || !enrollment) return;

		setIsSubmitting(true);
		try {
			const payload: BatchMember = {
				status: "active",
				memberId: enrollment.memberId,
				batchId: selectedBatchId,
				enrollmentId: Number(id)
			};

			const result = await changeBatch(payload);
			console.log(result);

			if(result.success){
				toast({
					title: "Success!",
					description: "Batch updated successfully.",
					variant: "default", // or "success" if you have that variant
				});
				navigate(-1);
			}
			else{
				throw new Error("Failed to change batch");
			}

		} catch (error) {
			toast({
				title: "Submission Failed",
				description: "Could not update the batch. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loadingEnrollment) {
		return (
			<div className="flex h-[50vh] w-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!enrollment && !loadingEnrollment) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
				<AlertCircle className="mb-2 h-10 w-10" />
				<p>Enrollment not found.</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl p-6">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="mb-8"
			>
				<h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
					Change Batch
				</h1>
				<p className="mt-2 text-gray-500 dark:text-gray-400">
					Select a new batch for <span className="font-semibold text-primary">{enrollment?.memberId ? `Member Name : ${enrollment.memberFirstName + " " + enrollment.memberLastName}` : 'Member'}</span>.
				</p>
			</motion.div>

			{loadingBatches ? (
				<div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
					<div className="flex flex-col items-center gap-2">
						<Loader2 className="h-6 w-6 animate-spin text-primary" />
						<span className="text-sm text-gray-500">Loading available batches...</span>
					</div>
				</div>
			) : (
				<motion.div
					className="grid gap-4 md:grid-cols-2 lg:grid-cols-2"
					initial="hidden"
					animate="visible"
					variants={{
						hidden: { opacity: 0 },
						visible: {
							opacity: 1,
							transition: {
								staggerChildren: 0.1
							}
						}
					}}
				>
					{batches.length === 0 ? (
						<div className="col-span-full py-10 text-center text-gray-500">
							No active batches found for this course.
						</div>
					) : (
						batches.map((batch) => {
							const isSelected = selectedBatchId === batch.batchId;

							return (
								<motion.div
									key={batch.batchId}
									variants={{
										hidden: { opacity: 0, y: 20 },
										visible: { opacity: 1, y: 0 }
									}}
									layout
									onClick={() => setSelectedBatchId(batch.batchId)}
									className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 ${isSelected
										? "border-primary bg-primary/5 shadow-lg ring-1 ring-primary"
										: "border-gray-200 bg-white hover:border-primary/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
										}`}
								>
									<div className="p-5">
										<div className="flex items-start justify-between">
											<div>
												<h3 className="font-bold text-lg text-gray-900 dark:text-gray-50">
													{batch.batchName}
												</h3>
												<p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
													{batch.academyName}
												</p>
											</div>
											{isSelected && (
												<motion.div
													initial={{ scale: 0 }}
													animate={{ scale: 1 }}
													className="rounded-full bg-primary p-1 text-white"
												>
													<CheckCircle2 size={16} />
												</motion.div>
											)}
										</div>

										<div className="mt-4 space-y-2">
											<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
												<User className="h-4 w-4 text-primary" />
												<span>Coach: {batch.coachFirstName} {batch.coachLastName}</span>
											</div>

											<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
												<MapPin className="h-4 w-4 text-primary" />
												<span>{batch.facilityName} - {batch.areaName}</span>
											</div>

											<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
												<Clock className="h-4 w-4 text-primary" />
												<span>{formatTime(batch?.startTime)} - {formatTime(batch?.endTime)}</span>
											</div>

											<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
												<CalendarDays className="h-4 w-4 text-primary" />
												<span className="font-medium">{formatWeekDays(batch.weekDays)}</span>
											</div>
										</div>
									</div>
								</motion.div>
							);
						})
					)}
				</motion.div>
			)}

			<div className="sticky bottom-0 mt-8 flex items-center justify-end border-t bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="flex gap-4">
					<button
						onClick={() => navigate(-1)}
						className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50"
						disabled={isSubmitting}
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						disabled={!selectedBatchId || isSubmitting}
						className={`group flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50`}
					>
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Updating...
							</>
						) : (
							<>
								Change Batch
								<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default BatchChange;