"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
	LayoutDashboard,
	Receipt,
	BarChart3,
	CreditCard,
	ChevronLeft,
	ChevronRight,
	HomeIcon,
	User,
	User2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
	onClose?: () => void;
}

const navigationItems = [
	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ name: "Family", href: "/family", icon: User2 },
	{ name: "Billing", href: "/billing", icon: Receipt },
	{ name: "Member", href: "/member", icon: User },
	{ name: "Academy", href: "/academy", icon: HomeIcon },
	{ name: "Reports", href: "/reports", icon: BarChart3 },
	{ name: "Payments", href: "/payments", icon: CreditCard },
];

export default function Sidebar({ onClose }: SidebarProps) {
	const [isExpanded, setIsExpanded] = useState(true)
	const location = useLocation()

	const toggleExpanded = () => {
		setIsExpanded(!isExpanded)
	}

	return (
		<motion.div
			initial={{ x: -300 }}
			animate={{ x: 0 }}
			transition={{ type: "spring", damping: 30, stiffness: 300 }}
			className={cn(
				"bg-card border-r mt-1 border-border h-screen transition-all duration-300 ease-in-out relative",
				isExpanded ? "w-64" : "w-16",
			)}
		>
			{/* Toggle Button */}
			<Button
				variant="ghost"
				size="icon"
				onClick={toggleExpanded}
				className="absolute -right-3 bg-red-800 top-12 z-50 h-6 w-6 rounded-full border border-border bg-background shadow-md hidden lg:flex"
			>
				{isExpanded ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
			</Button>

			<div className="p-4">
				<AnimatePresence mode="wait">
					{isExpanded ? (
						<motion.h2
							key="expanded"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="text-lg font-semibold text-foreground mb-6"
						>
							Navigation
						</motion.h2>
					) : (
						<motion.div
							key="collapsed"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="h-6 mb-6"
						/>
					)}
				</AnimatePresence>

				<nav className="space-y-2">
					{navigationItems.map((item) => {
						const isActive = location.pathname.indexOf(item.href) != -1
						const Icon = item.icon

						return (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200",
                    isActive
                      ? "bg-blue-600 text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    !isExpanded && "justify-center"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
					})}
				</nav>
			</div>
		</motion.div>
	)
}
