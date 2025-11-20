"use client"

import { motion } from "framer-motion"
import { Home, ArrowLeft, Wrench, HardHat, Bubbles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

const floatingElements = [
	{ icon: Wrench, delay: 0.5, x: -80, y: 100 },
	{ icon: HardHat, delay: 1, x: 120, y: -30 },
	{ icon: Bubbles, delay: 1.5, x: -100, y: -80 },
	{ icon: Wrench, delay: 2, x: 80, y: 120 },
]

export default function PageNotFound() {
	const navigate = useNavigate()
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
	const [isMouseMoving, setIsMouseMoving] = useState(false)

	useEffect(() => {
		let timeoutId:any = null;

		const handleMouseMove = (e:any) => {
			setMousePosition({ x: e.clientX, y: e.clientY })
			setIsMouseMoving(true)

			// Hide follower after mouse stops moving
			clearTimeout(timeoutId)
			timeoutId = setTimeout(() => {
				setIsMouseMoving(false)
			}, 100)
		}

		const handleMouseLeave = () => {
			setIsMouseMoving(false)
		}

		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseleave', handleMouseLeave)

		return () => {
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseleave', handleMouseLeave)
			clearTimeout(timeoutId)
		}
	}, [])

	const handleGoHome = () => {
		navigate("/")
	}

	const handleGoBack = () => {
		navigate(-1)
	}

	return (
		<div className="min-h-[80vh] bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center relative overflow-hidden">
			{/* Animated Background Elements */}
			<div className="absolute inset-0 overflow-hidden">
				{floatingElements.map((element, index) => {
					const Icon = element.icon
					return (
						<motion.div
							key={index}
							className="absolute text-muted-foreground/10"
							initial={{ opacity: 0, scale: 0 }}
							animate={{
								opacity: [0, 1, 0],
								scale: [0, 1, 0],
								x: [element.x, element.x + 50, element.x],
								y: [element.y, element.y - 30, element.y],
								rotate: [0, 180, 360],
							}}
							transition={{
								duration: 4,
								delay: element.delay,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
							}}
							style={{
								left: `${50 + element.x}px`,
								top: `${50 + element.y}px`,
							}}
						>
							<Icon className="h-16 w-16" />
						</motion.div>
					)
				})}
			</div>

			{/* Mouse Follower */}
			<div
				className={`fixed w-6 h-6 bg-primary/30 rounded-full pointer-events-none z-50 transition-opacity duration-200 ${isMouseMoving ? 'opacity-100' : 'opacity-0'
					}`}
				style={{
					left: mousePosition.x - 12,
					top: mousePosition.y - 12,
					transform: 'translate3d(0, 0, 0)', // Hardware acceleration
					transition: 'left 0.1s ease-out, top 0.1s ease-out',
				}}
			>
				<div className="w-full h-full bg-primary/50 rounded-full animate-ping"></div>
			</div>

			{/* Main Content */}
			<div className="text-center z-20 relative">
				{/* 404 Number Animation */}
				<motion.div
					initial={{ opacity: 0, y: -100 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
					className="relative mb-8"
				>
					<motion.h1
						className="text-9xl md:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 dark:from-primary dark:via-purple-400 dark:to-pink-400"
						animate={{
							backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
						}}
						transition={{
							duration: 3,
							repeat: Number.POSITIVE_INFINITY,
							ease: "linear",
						}}
						style={{
							backgroundSize: "200% 200%",
						}}
					>
						404
					</motion.h1>

					{/* Glitch Effect */}
					<motion.div
						className="absolute inset-0 text-9xl md:text-[12rem] font-bold text-red-500 dark:text-red-400 opacity-20"
						animate={{
							x: [0, -2, 2, 0],
							y: [0, 1, -1, 0],
						}}
						transition={{
							duration: 0.2,
							repeat: Number.POSITIVE_INFINITY,
							repeatType: "reverse",
						}}
					>
						404
					</motion.div>
				</motion.div>

				{/* Text Content */}
				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.5 }}
					className="mb-8 space-y-4"
				>
					<h2 className="text-3xl md:text-4xl font-bold text-foreground">Oops! Page Under XYZ</h2>
					<p className="text-lg text-muted-foreground max-w-md mx-auto">
						The page you're looking for seems to have wandered off the XYZ site. Our crew is working hard to
						build it!
					</p>
				</motion.div>

				{/* Action Buttons */}
				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.7 }}
					className="flex flex-col sm:flex-row gap-4 justify-center"
				>
					<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
						<Button onClick={handleGoHome} className="flex items-center gap-2 px-6 py-3">
							<Home className="h-4 w-4" />
							Go Home
						</Button>
					</motion.div>

					<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
						<Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2 px-6 py-3">
							<ArrowLeft className="h-4 w-4" />
							Go Back
						</Button>
					</motion.div>
				</motion.div>

				{/* Loading Animation */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6, delay: 1 }}
					className="mt-12"
				>
					<div className="flex justify-center items-center space-x-2">
						<div className="text-sm text-muted-foreground">Building in progress</div>
						{[0, 1, 2].map((i) => (
							<motion.div
								key={i}
								className="w-2 h-2 bg-primary rounded-full"
								animate={{
									scale: [1, 1.5, 1],
									opacity: [0.5, 1, 0.5],
								}}
								transition={{
									duration: 1,
									delay: i * 0.2,
									repeat: Number.POSITIVE_INFINITY,
								}}
							/>
						))}
					</div>
				</motion.div>
			</div>

			{/* Particle Effect */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{Array.from({ length: 20 }).map((_, i) => (
					<motion.div
						key={i}
						className="absolute w-1 h-1 bg-primary/30 rounded-full"
						initial={{
							x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
							y: typeof window !== 'undefined' ? window.innerHeight + 10 : 800,
						}}
						animate={{
							y: -10,
							x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
						}}
						transition={{
							duration: Math.random() * 3 + 2,
							delay: Math.random() * 2,
							repeat: Number.POSITIVE_INFINITY,
							ease: "linear",
						}}
					/>
				))}
			</div>
		</div>
	)
}