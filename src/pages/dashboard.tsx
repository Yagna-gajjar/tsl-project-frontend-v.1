"use client"

import { motion, useAnimation } from "framer-motion"
import {
	Building2,
	TrendingUp,
	Clock,
	DollarSign,
	Wrench,
	HardHat,
	Truck,
	BarChart3,
	Activity,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from "recharts"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const stats = [
	{
		title: "Active Projects",
		value: "12",
		change: "+2 from last month",
		icon: Building2,
		color: "text-blue-600",
		trend: "up",
		percentage: 16.7,
	},
	{
		title: "Total Workers",
		value: "248",
		change: "+12 from last week",
		icon: HardHat,
		color: "text-green-600",
		trend: "up",
		percentage: 5.1,
	},
	{
		title: "Equipment Active",
		value: "89%",
		change: "-3% from last month",
		icon: Wrench,
		color: "text-orange-600",
		trend: "down",
		percentage: -3.2,
	},
	{
		title: "Monthly Revenue",
		value: "$142,800",
		change: "+18% from last month",
		icon: DollarSign,
		color: "text-purple-600",
		trend: "up",
		percentage: 18.2,
	},
]

const projectStatusData = [
	{ name: "Planning", value: 3, color: "#3b82f6" },
	{ name: "In Progress", value: 7, color: "#10b981" },
	{ name: "On Hold", value: 1, color: "#f59e0b" },
	{ name: "Completed", value: 15, color: "#6b7280" },
]

const revenueData = Array.from({ length: 12 }, (_, i) => ({
	month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
	revenue: 80000 + Math.random() * 60000,
	expenses: 40000 + Math.random() * 30000,
	profit: 30000 + Math.random() * 40000,
}))

const equipmentData = [
	{ name: "Excavators", active: 8, total: 10, utilization: 80 },
	{ name: "Cranes", active: 5, total: 6, utilization: 83 },
	{ name: "Trucks", active: 15, total: 18, utilization: 83 },
	{ name: "Bulldozers", active: 4, total: 5, utilization: 80 },
]

const upcomingTasks = [
	{ id: 1, task: "Foundation inspection - Tower A", due: "Today", priority: "high", project: "Residential Tower A" },
	{
		id: 2,
		task: "Material delivery - Office Complex",
		due: "Tomorrow",
		priority: "medium",
		project: "Downtown Office",
	},
	{ id: 3, task: "Safety training session", due: "Dec 28", priority: "high", project: "All Projects" },
	{ id: 4, task: "Equipment maintenance check", due: "Dec 30", priority: "low", project: "Equipment Pool" },
]

const recentActivities = [
	{
		id: 1,
		action: "Project milestone completed",
		project: "Downtown Office Complex",
		time: "2 hours ago",
		type: "success",
	},
	{ id: 2, action: "Safety incident reported", project: "Highway Bridge", time: "4 hours ago", type: "warning" },
	{ id: 3, action: "New equipment delivered", project: "Equipment Pool", time: "6 hours ago", type: "info" },
	{ id: 4, action: "Invoice payment received", project: "Shopping Mall", time: "1 day ago", type: "success" },
	{ id: 5, action: "Weather delay reported", project: "Residential Tower A", time: "2 days ago", type: "warning" },
]

export default function Dashboard() {
	const [searchQuery, setSearchQuery] = useState("")
	const controls = useAnimation()

	useEffect(() => {
		controls.start({
			opacity: 1,
			y: 0,
			transition: { duration: 0.6, ease: "easeOut" },
		})
	}, [controls])

	const filteredTasks = upcomingTasks.filter(
		(task) =>
			task.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
			task.project.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
			case "medium":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
			case "low":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
		}
	}

	const getActivityIcon = (type: string) => {
		switch (type) {
			case "success":
				return <CheckCircle2 className="h-4 w-4 text-green-500" />
			case "warning":
				return <AlertCircle className="h-4 w-4 text-yellow-500" />
			case "error":
				return <XCircle className="h-4 w-4 text-red-500" />
			default:
				return <Activity className="h-4 w-4 text-blue-500" />
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={controls}
				className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
			>
				<div>
					<h1 className="text-3xl font-bold text-foreground">Construction Dashboard</h1>
					<p className="text-muted-foreground">Monitor your construction operations in real-time</p>
				</div>
				<div className="relative flex items-center gap-2 w-full sm:w-auto">
					<Search className="absolute left-3 text-muted-foreground pointer-events-none" />
					<Input
						type="search"
						placeholder="Search tasks, projects..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full sm:max-w-md pl-10"
					/>
				</div>
			</motion.div>

			{/* Main Stats */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{stats.map((stat, index) => {
					const Icon = stat.icon
					return (
						<motion.div
							key={stat.title}
							initial={{ opacity: 0, y: 20, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{ duration: 0.5, delay: index * 0.1 }}
							whileHover={{ scale: 1.02, y: -2 }}
							className="group"
						>
							<Card className="hover:shadow-lg transition-all duration-300 border-l-2 border-l-primary">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
									<motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
										<Icon className={`h-5 w-5 ${stat.color}`} />
									</motion.div>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{stat.value}</div>
									<div className="flex items-center space-x-1 text-xs text-muted-foreground">
										<TrendingUp className={`h-3 w-3 ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`} />
										<span>{stat.change}</span>
									</div>
									<div className="mt-2">
										<Progress value={Math.abs(stat.percentage)} className="h-1" />
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)
				})}
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Revenue Chart */}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6, delay: 0.3 }}
				>
					<Card className="hover:shadow-lg transition-shadow duration-300">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BarChart3 className="h-5 w-5" />
								Financial Overview
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={300}>
								<AreaChart data={revenueData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="month" />
									<YAxis />
									<Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
									<Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
									<Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
								</AreaChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</motion.div>

				{/* Project Status Chart */}
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6, delay: 0.4 }}
				>
					<Card className="hover:shadow-lg transition-shadow duration-300">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Building2 className="h-5 w-5" />
								Project Status Distribution
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={300}>
								<PieChart>
									<Pie
										data={projectStatusData}
										cx="50%"
										cy="50%"
										outerRadius={80}
										dataKey="value"
										label={({ name, value }) => `${name}: ${value}`}
									>
										{projectStatusData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</motion.div>
			</div>

			{/* Equipment Status & Tasks */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Equipment Status */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.6 }}
				>
					<Card className="hover:shadow-lg transition-shadow duration-300">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Truck className="h-5 w-5" />
								Equipment Status
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{equipmentData.map((equipment, index) => (
									<motion.div
										key={equipment.name}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
										className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
									>
										<div>
											<div className="font-medium">{equipment.name}</div>
											<div className="text-sm text-muted-foreground">
												{equipment.active}/{equipment.total} active
											</div>
										</div>
										<div className="text-right">
											<div className="font-medium">{equipment.utilization}%</div>
											<Progress value={equipment.utilization} className="w-20 h-2" />
										</div>
									</motion.div>
								))}
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Upcoming Tasks */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.7 }}
				>
					<Card className="hover:shadow-lg transition-shadow duration-300">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								Upcoming Tasks
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{filteredTasks.map((task, index) => (
									<motion.div
										key={task.id}
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
										className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
									>
										<div className="flex-1">
											<div className="font-medium text-sm">{task.task}</div>
											<div className="text-xs text-muted-foreground">{task.project}</div>
										</div>
										<div className="flex items-center gap-2">
											<Badge className={getPriorityColor(task.priority)} variant="secondary">
												{task.priority}
											</Badge>
											<span className="text-xs text-muted-foreground">{task.due}</span>
										</div>
									</motion.div>
								))}
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</div>

			{/* Recent Activities */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 0.8 }}
			>
				<Card className="hover:shadow-lg transition-shadow duration-300">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Recent Activities
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{recentActivities.map((activity, index) => (
								<motion.div
									key={activity.id}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.4, delay: 0.9 + index * 0.05 }}
									className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
								>
									{getActivityIcon(activity.type)}
									<div className="flex-1">
										<div className="font-medium text-sm">{activity.action}</div>
										<div className="text-xs text-muted-foreground">{activity.project}</div>
									</div>
									<span className="text-xs text-muted-foreground">{activity.time}</span>
								</motion.div>
							))}
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	)
}
