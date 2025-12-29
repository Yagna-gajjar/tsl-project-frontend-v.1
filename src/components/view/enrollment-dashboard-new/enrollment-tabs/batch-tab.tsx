"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Users } from "lucide-react"
import type { Batch, EnrollmentData } from "@/types/enrollment"

interface BatchTabProps {
	data?: EnrollmentData
	onUpdate: (data: Partial<EnrollmentData>) => void
}

// Mock batch data
const MOCK_BATCHES: Batch[] = [
	{
		batchId: 1,
		batchName: "Morning Batch A",
		courseId: 1,
		activityId: 1,
		entityId: 1,
		batchType: "Regular",
		startTime: "06:00",
		endTime: "07:00",
		sessionMinutes: 60,
		daysPerWeek: 3,
		daysPattern: "135",
		maxCapacity: 20,
		activeMemberCount: 15,
		introduceDate: "2024-01-01",
		status: "Active",
		courseName: "Cricket Basics",
		activityName: "Cricket",
		entityName: "Main Ground",
	},
	{
		batchId: 2,
		batchName: "Afternoon Batch A",
		courseId: 1,
		activityId: 1,
		entityId: 1,
		batchType: "Regular",
		startTime: "14:00",
		endTime: "15:00",
		sessionMinutes: 60,
		daysPerWeek: 3,
		daysPattern: "246",
		maxCapacity: 20,
		activeMemberCount: 18,
		introduceDate: "2024-01-01",
		status: "Active",
		courseName: "Cricket Basics",
		activityName: "Cricket",
		entityName: "Main Ground",
	},
	{
		batchId: 3,
		batchName: "Evening Batch A",
		courseId: 1,
		activityId: 1,
		entityId: 1,
		batchType: "Regular",
		startTime: "18:00",
		endTime: "19:30",
		sessionMinutes: 90,
		daysPerWeek: 4,
		daysPattern: "1245",
		maxCapacity: 15,
		activeMemberCount: 12,
		introduceDate: "2024-01-01",
		status: "Active",
		courseName: "Cricket Basics",
		activityName: "Cricket",
		entityName: "Main Ground",
	},
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function BatchTab({ data, onUpdate }: BatchTabProps) {
	const [selectedBatch, setSelectedBatch] = useState<Batch | null>(data?.batch || null)
	const [batches, setBatches] = useState<Batch[]>(MOCK_BATCHES)

	const filteredBatches = useMemo(() => {
		if (!data?.course?.courseId || !data?.activity?.activityId) return batches
		return batches.filter(
			(batch) => batch.courseId === data.course?.courseId && batch.activityId === data.activity?.activityId,
		)
	}, [data?.course?.courseId, data?.activity?.activityId, batches])

	const handleSelectBatch = (batch: Batch) => {
		setSelectedBatch(batch)
		onUpdate({
			batch,
		})
	}

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
			<div className="space-y-6">
				<div>
					<h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
						<Calendar className="w-6 h-6" />
						Select Batch
					</h2>
					<p className="text-muted-foreground">Choose your preferred batch and schedule</p>
				</div>

				{/* Course & Activity Info */}
				{data?.course && data?.activity && (
					<Card className="p-4 bg-muted/50 border-border">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p className="text-muted-foreground text-xs">Course</p>
								<p className="font-semibold">{data.course.courseName}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Activity</p>
								<p className="font-semibold">{data.activity.activityName}</p>
							</div>
						</div>
					</Card>
				)}

				{/* Batches Table */}
				{filteredBatches.length > 0 ? (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 overflow-x-auto">
						<p className="text-sm font-semibold">Available Batches</p>
						<div className="border border-border rounded-lg overflow-hidden">
							<Table className="min-w-full">
								<TableHeader className="bg-muted/50">
									<TableRow>
										<TableHead className="font-semibold">Batch Name</TableHead>
										<TableHead className="font-semibold">Time</TableHead>
										<TableHead className="font-semibold">Days</TableHead>
										<TableHead className="font-semibold text-right">Members</TableHead>
										<TableHead className="font-semibold text-center">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredBatches.map((batch, index) => (
										<motion.tr
											key={batch.batchId}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05 }}
											className={`border-t border-border transition-colors ${selectedBatch?.batchId === batch.batchId ? "bg-primary/10" : "hover:bg-muted/50"
												}`}
										>
											<TableCell className="py-3">
												<div className="flex flex-col gap-1">
													<span className="font-medium">{batch.batchName}</span>
													<span className="text-xs text-muted-foreground">{batch.entityName}</span>
												</div>
											</TableCell>
											<TableCell className="font-mono text-sm">
												{batch.startTime} - {batch.endTime}
											</TableCell>
											<TableCell>
												<div className="flex gap-1">
													{DAYS.map((day, i) => (
														<div
															key={i}
															className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${batch.daysPattern?.includes(String(i))
																	? "bg-primary text-primary-foreground"
																	: "bg-muted text-muted-foreground"
																}`}
														>
															{day[0]}
														</div>
													))}
												</div>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Users className="w-4 h-4 text-muted-foreground" />
													<span className="text-sm">
														{batch.activeMemberCount}/{batch.maxCapacity}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-center">
												<motion.button
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													onClick={() => handleSelectBatch(batch)}
													className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedBatch?.batchId === batch.batchId
															? "bg-primary text-primary-foreground"
															: "bg-muted hover:bg-muted/80"
														}`}
												>
													Select
												</motion.button>
											</TableCell>
										</motion.tr>
									))}
								</TableBody>
							</Table>
						</div>
					</motion.div>
				) : (
					<Card className="p-8 text-center bg-muted/50 border-border">
						<p className="text-muted-foreground">
							No batches available for selected course. Please select a different course.
						</p>
					</Card>
				)}

				{/* Selected Batch Summary */}
				{selectedBatch && (
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
						<Card className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800">
							<div className="space-y-3">
								<p className="text-sm font-medium text-green-900 dark:text-green-100">Batch Selected</p>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Batch:</span>
										<span className="font-semibold">{selectedBatch.batchName}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Time:</span>
										<span className="font-semibold font-mono">
											{selectedBatch.startTime} - {selectedBatch.endTime}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Availability:</span>
										<span className="font-semibold">
											{selectedBatch.maxCapacity - (selectedBatch.activeMemberCount || 0)} spots left
										</span>
									</div>
								</div>
							</div>
						</Card>
					</motion.div>
				)}

				<motion.div whileHover={{ scale: selectedBatch ? 1.02 : 1 }} whileTap={{ scale: selectedBatch ? 0.98 : 1 }}>
					<Button disabled={!selectedBatch} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
						Continue to Confirmation
					</Button>
				</motion.div>
			</div>
		</motion.div>
	)
}
