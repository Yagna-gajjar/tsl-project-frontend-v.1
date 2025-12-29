"use client"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, CheckCircle2 } from "lucide-react"
import type { CourseRate, EnrollmentData } from "@/types/enrollment"

interface CourseRateTabProps {
	data?: EnrollmentData
	onUpdate: (data: Partial<EnrollmentData>) => void
}

// Mock rate data
const MOCK_RATES: CourseRate[] = [
	{
		courseRateId: 1,
		courseId: 1,
		membershipMasterId: "MEM-001",
		aboveUnits: 1,
		unitRate: 500,
		introduceDate: "2024-01-01",
		daySelection: true,
		minDaysInEnr: 30,
		discountOnDayReduce: 5,
		membershipType: "Premium",
		courseName: "Cricket Basics",
	},
	{
		courseRateId: 2,
		courseId: 1,
		membershipMasterId: "MEM-002",
		aboveUnits: 5,
		unitRate: 450,
		introduceDate: "2024-01-01",
		daySelection: true,
		minDaysInEnr: 30,
		discountOnDayReduce: 10,
		membershipType: "Premium",
		courseName: "Cricket Basics",
	},
	{
		courseRateId: 3,
		courseId: 1,
		membershipMasterId: "MEM-003",
		aboveUnits: 1,
		unitRate: 400,
		introduceDate: "2024-01-01",
		daySelection: true,
		minDaysInEnr: 30,
		discountOnDayReduce: 5,
		membershipType: "Regular",
		courseName: "Cricket Basics",
	},
]

export function CourseRateTab({ data, onUpdate }: CourseRateTabProps) {
	const [numberOfDays, setNumberOfDays] = useState(30)
	const [selectedRate, setSelectedRate] = useState<CourseRate | null>(data?.courseRate || null)
	const [rates] = useState<CourseRate[]>(MOCK_RATES)

	const filteredRates = useMemo(() => {
		if (!data?.course?.courseId) return rates
		return rates.filter((rate) => rate.courseId === data.course?.courseId)
	}, [data?.course?.courseId, rates])

	const calculateTotal = (rate: CourseRate) => {
		return numberOfDays * rate.unitRate
	}

	const handleSelectRate = (rate: CourseRate) => {
		const updatedRate: CourseRate = {
			...rate,
			numberOfDays,
		}
		setSelectedRate(updatedRate)
		onUpdate({
			courseRate: updatedRate,
		})
	}

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
			<div className="space-y-6">
				<div>
					<h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
						<DollarSign className="w-6 h-6" />
						Course Pricing & Rates
					</h2>
					<p className="text-muted-foreground">Select number of days and pricing tier</p>
				</div>

				{/* Number of Days Input */}
				<div className="space-y-3">
					<Label htmlFor="days" className="text-sm font-medium">
						Number of Days in Enrollment *
					</Label>
					<Input
						id="days"
						type="number"
						min="1"
						max="365"
						value={numberOfDays}
						onChange={(e) => setNumberOfDays(Number.parseInt(e.target.value) || 1)}
						className="bg-background border-border"
						placeholder="Enter number of days"
					/>
					<p className="text-xs text-muted-foreground">This determines the total billing amount based on unit rate</p>
				</div>

				{/* Course Info */}
				{data?.course && (
					<Card className="p-4 bg-muted/50 border-border">
						<div className="space-y-2">
							<p className="text-sm font-medium">Selected Course</p>
							<p className="text-lg font-bold text-foreground">{data.course.courseName}</p>
							{data.activity && <p className="text-sm text-muted-foreground">Activity: {data.activity.activityName}</p>}
						</div>
					</Card>
				)}

				{/* Rates Table */}
				{filteredRates.length > 0 ? (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 overflow-x-auto">
						<p className="text-sm font-semibold">Available Pricing Tiers</p>
						<div className="border border-border rounded-lg overflow-hidden">
							<Table className="min-w-full">
								<TableHeader className="bg-muted/50">
									<TableRow>
										<TableHead className="font-semibold">Membership</TableHead>
										<TableHead className="font-semibold text-right">Unit Rate</TableHead>
										<TableHead className="font-semibold text-right">Total ({numberOfDays} days)</TableHead>
										<TableHead className="font-semibold text-center">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredRates.map((rate, index) => (
										<motion.tr
											key={rate.courseRateId}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05 }}
											className={`border-t border-border transition-colors ${selectedRate?.courseRateId === rate.courseRateId ? "bg-primary/10" : "hover:bg-muted/50"
												}`}
										>
											<TableCell className="py-3">
												<div className="flex flex-col gap-1">
													<span className="font-medium">{rate.membershipType}</span>
													<span className="text-xs text-muted-foreground">Units: {rate.aboveUnits}+</span>
												</div>
											</TableCell>
											<TableCell className="text-right font-mono">₹{rate.unitRate}</TableCell>
											<TableCell className="text-right font-bold text-primary font-mono">
												₹{calculateTotal(rate).toFixed(2)}
											</TableCell>
											<TableCell className="text-center">
												<motion.button
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													onClick={() => handleSelectRate(rate)}
													className={`p-1.5 rounded-lg transition-colors ${selectedRate?.courseRateId === rate.courseRateId
															? "bg-primary text-primary-foreground"
															: "bg-muted hover:bg-muted/80"
														}`}
												>
													<CheckCircle2 className="w-5 h-5" />
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
						<p className="text-muted-foreground">Please select a course first to view available rates.</p>
					</Card>
				)}

				{/* Summary */}
				{selectedRate && (
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
						<Card className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800">
							<div className="space-y-2">
								<p className="text-sm font-medium text-green-900 dark:text-green-100">Rate Selected</p>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-xs text-muted-foreground">Membership</p>
										<p className="font-semibold">{selectedRate.membershipType}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Unit Rate</p>
										<p className="font-semibold">₹{selectedRate.unitRate}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Days</p>
										<p className="font-semibold">{numberOfDays}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Total</p>
										<p className="font-bold text-lg">₹{calculateTotal(selectedRate).toFixed(2)}</p>
									</div>
								</div>
							</div>
						</Card>
					</motion.div>
				)}

				<motion.div whileHover={{ scale: selectedRate ? 1.02 : 1 }} whileTap={{ scale: selectedRate ? 0.98 : 1 }}>
					<Button disabled={!selectedRate} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
						Continue to Batch Selection
					</Button>
				</motion.div>
			</div>
		</motion.div>
	)
}
