"use client"

import { motion } from "framer-motion"
import { Building2, Hammer, HardHat } from "lucide-react"

interface GlobalLoaderProps {
	message?: string
	size?: "sm" | "md" | "lg"
}

export function GlobalLoader({ message = "Loading...", size = "md" }: GlobalLoaderProps) {
	const sizeClasses = {
		sm: "h-6 w-6",
		md: "h-8 w-8",
		lg: "h-12 w-12",
	}

	const containerClasses = {
		sm: "gap-2",
		md: "gap-3",
		lg: "gap-4",
	}

	return (
		<div className="flex flex-col items-center justify-center space-y-4">
			<div className={`flex items-center ${containerClasses[size]}`}>
				{/* Animated construction icons */}
				<motion.div
					animate={{
						rotate: [0, 360],
						scale: [1, 1.1, 1],
					}}
					transition={{
						duration: 2,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
					className="text-orange-500"
				>
					<Building2 className={sizeClasses[size]} />
				</motion.div>

				<motion.div
					animate={{
						rotate: [0, -15, 15, 0],
						y: [0, -2, 0],
					}}
					transition={{
						duration: 1.5,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
						delay: 0.2,
					}}
					className="text-blue-500"
				>
					<Hammer className={sizeClasses[size]} />
				</motion.div>

				<motion.div
					animate={{
						y: [0, -4, 0],
						rotate: [0, 5, -5, 0],
					}}
					transition={{
						duration: 1.8,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
						delay: 0.4,
					}}
					className="text-yellow-500"
				>
					<HardHat className={sizeClasses[size]} />
				</motion.div>
			</div>

			{/* Loading dots */}
			<div className="flex space-x-1">
				{[0, 1, 2].map((i) => (
					<motion.div
						key={i}
						animate={{
							scale: [1, 1.2, 1],
							opacity: [0.5, 1, 0.5],
						}}
						transition={{
							duration: 1,
							repeat: Number.POSITIVE_INFINITY,
							delay: i * 0.2,
						}}
						className="w-2 h-2 bg-primary rounded-full"
					/>
				))}
			</div>

			<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground font-medium">
				{message}
			</motion.p>
		</div>
	)
}

// Full page loader
export function FullPageLoader({ message }: { message?: string }) {
	return (
		<div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="bg-card border rounded-lg p-8 shadow-lg"
			>
				<GlobalLoader message={message} size="lg" />
			</motion.div>
		</div>
	)
}
