"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { User, BookOpen, DollarSign, Calendar, FileCheck, Badge } from "lucide-react"
import type { Enrollment as EnrollmentData } from "@/types/enrollment"
import type { JSX } from "react/jsx-runtime"
import { format } from "date-fns"

interface EnrollmentDetailsProps {
	data: EnrollmentData
	currentTab: string
}

const getSectionIcon = (iconType: string): JSX.Element => {
	const iconClass = "w-4 h-4"
	switch (iconType) {
		case "member":
			return <User className={iconClass} />
		case "course":
			return <BookOpen className={iconClass} />
		case "courseRate":
			return <DollarSign className={iconClass} />
		case "batch":
			return <Calendar className={iconClass} />
		case "confirm":
			return <FileCheck className={iconClass} />
		default:
			return <></>
	}
}

export function EnrollmentDetails({ data, currentTab }: EnrollmentDetailsProps) {
	return (
		<motion.div className="sticky top-8 space-y-4">
			<div>
				<h2 className="text-2xl font-bold text-foreground mb-2">Summary</h2>
				<p className="text-sm text-muted-foreground">Live enrollment details</p>
			</div>

			<AnimatedDetailCard title="Member" icon={getSectionIcon("member")} isActive={currentTab === "member"}>
				{data?.member ? (
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Name:</span>
							<span className="font-medium">{`${data.member.memberFirstName} ${data.member.memberLastName}`}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Email:</span>
							<span className="font-medium text-xs truncate">{data.member.email}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Phone:</span>
							<span className="font-medium">{data.member.contactNumber}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">DOB:</span>
							<span className="font-medium">{format(data?.member?.dob as Date, "yyyy-MMM-dd")}</span>
						</div>
					</div>
				) : (
					<p className="text-xs text-muted-foreground italic">Not selected yet</p>
				)}
			</AnimatedDetailCard>

			<AnimatedDetailCard title="Course" icon={getSectionIcon("course")} isActive={currentTab === "course"}>
				{data?.course ? (
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Name:</span>
							<span className="font-medium">{data.course.courseName}</span>
						</div>
						{data.activity && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Activity:</span>
								<span className="font-medium">{data?.activity?.activityName ?? "No Name Found"}</span>
							</div>
						)}
						<div className="flex justify-between">
							<span className="text-muted-foreground">Days/Week:</span>
							<span className="font-medium">{data?.course?.noOfDaysInWeek}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Duration:</span>
							<span className="font-medium">{data.course?.sessionMinutes ?? "N/A"} min</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Charging Pattern:</span>
							<span className="font-medium">{data.course?.chargingPattern ?? "N/A"}</span>
						</div>
					</div>
				) : (
					<p className="text-xs text-muted-foreground italic">Not selected yet</p>
				)}
			</AnimatedDetailCard>

			<AnimatedDetailCard title="Pricing" icon={getSectionIcon("courseRate")} isActive={currentTab === "courseRate"}>
				{data?.courseRate ? (
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Type:</span>
							<span className="font-medium">{data.courseRate.membershipType}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Unit Rate:</span>
							<span className="font-medium">₹{data.courseRate.unitRate}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Days:</span>
							<span className="font-medium">{data.courseRate.numberOfDays || 30}</span>
						</div>
						<div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
							<span>Total:</span>
							<span className="text-primary">
								₹{((data.courseRate.unitRate || 0) * (data.courseRate.numberOfDays || 30)).toFixed(2)}
							</span>
						</div>
					</div>
				) : (
					<p className="text-xs text-muted-foreground italic">Not selected yet</p>
				)}
			</AnimatedDetailCard>

			<AnimatedDetailCard title="Batch" icon={getSectionIcon("batch")} isActive={currentTab === "batch"}>
				{data?.batch ? (
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Name:</span>
							<span className="font-medium">{data.batch.batchName}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Time:</span>
							<span className="font-medium text-xs">{`${data.batch.startTime}-${data.batch.endTime}`}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Location:</span>
							<span className="font-medium text-xs">{data.batch.entityName}</span>
						</div>
					</div>
				) : (
					<p className="text-xs text-muted-foreground italic">Not selected yet</p>
				)}
			</AnimatedDetailCard>

			<AnimatedDetailCard
				title="Billing & Status"
				icon={getSectionIcon("bill")}
				isActive={currentTab === "bill" || currentTab === "confirm"}
			>
				{data?.bill ? (
					<div className="space-y-2.5 text-[11px]">
						{/* Walking Details - Only show if name exists */}
						{data.bill.walkingName && (
							<div className="flex flex-col border-b border-border/40 pb-2">
								<span className="text-[9px] font-black uppercase text-muted-foreground mb-0.5">Walking Info</span>
								<div className="flex justify-between items-center">
									<span className="font-bold truncate pr-2">{data.bill.walkingName}</span>
									<span className="text-muted-foreground font-mono text-[10px]">{data.bill.walkingContact}</span>
								</div>
							</div>
						)}

						{/* Financial Adjustments */}
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">Adjustment:</span>
								<span className="font-mono font-bold text-red-500">
									-₹{Number(data.bill.dnOrDiscount || 0).toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">Proc. Charge:</span>
								<span className="font-mono font-bold text-green-600">
									+₹{Number(data.bill.processingCharge || 0).toFixed(2)}
								</span>
							</div>
						</div>

						{/* Workflow Status */}
						<div className="pt-2 border-t border-dashed border-border/60">
							<div className="flex justify-between items-center mb-1">
								<span className="text-muted-foreground">Approval:</span>
								<span className="font-bold uppercase text-[9px] px-1.5 py-0.5 bg-muted rounded">
									{data.bill.academyApprovalStatus?.replace('_', ' ')}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">Action:</span>
								<Badge className="h-4 px-1.5 text-[9px] font-black uppercase bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
									{data.bill.status}
								</Badge>
							</div>
						</div>
					</div>
				) : (
					<div className="flex items-center gap-2 text-muted-foreground italic text-[10px] py-1">
						<div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
						Waiting for billing selection
					</div>
				)}
			</AnimatedDetailCard>
		</motion.div>
	)
}

interface AnimatedDetailCardProps {
	title: string
	icon: JSX.Element
	isActive: boolean
	children: React.ReactNode
}

function AnimatedDetailCard({ title, icon, isActive, children }: AnimatedDetailCardProps) {
	return (
		<motion.div
			layout
			animate={{
				boxShadow: isActive
					? "0 0 0 2px var(--color-primary), 0 4px 12px rgba(0,0,0,0.1)"
					: "0 1px 3px rgba(0,0,0,0.1)",
			}}
			transition={{ duration: 0.3 }}
		>
			<Card className={`p-4 border ${isActive ? "border-primary/50 bg-primary/5" : "border-border"} overflow-hidden`}>
				<motion.div initial={false} animate={{ x: isActive ? 2 : 0 }} transition={{ duration: 0.2 }}>
					<div className={`flex items-center gap-2 mb-3 ${isActive ? "text-primary" : "text-foreground"}`}>
						{icon}
						<h3 className="font-semibold">{title}</h3>
					</div>
					<motion.div initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
						{children}
					</motion.div>
				</motion.div>
			</Card>
		</motion.div>
	)
}
