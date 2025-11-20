"use client"

import { Bell, LogIn, Menu, Moon, Settings, Sun, User } from "lucide-react"
import { motion } from "framer-motion"
import { useTheme } from "../contexts/theme-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/authContext"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

interface NavbarProps {
	onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
	const { theme, toggleTheme } = useTheme()
	const { logout, user, token } = useAuth();
	const navigate = useNavigate();
	const [userImage, setUserImage] = useState<string>();

	const fetchUserImage = async () => {

		if (!user?.profileImage || !token) return;

		const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/${user.profileImage}`, {
			headers: {
				"Authorization": `Bearer ${token}`
			}
		});

		if (response.ok) {
			const blob = await response.blob();
			const imageUrl = URL.createObjectURL(blob);
			setUserImage(imageUrl);
		}
	}

	useEffect(() => {
		fetchUserImage();
	}, [user, token]);

	return (
		<motion.nav
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			transition={{ type: "spring", damping: 30, stiffness: 300 }}
			className="fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border"
		>
			<div className="flex items-center justify-between px-4 h-16">
				{/* Left Section */}
				<div className="flex items-center space-x-4">
					<Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
						<Menu className="h-5 w-5" />
					</Button>

					<motion.div whileHover={{ scale: 1.05 }} className="flex items-center cursor-pointer space-x-2" onClick={() => {
						navigate("/");
					}}>
						<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
							<span className="text-primary-foreground font-bold text-sm">CM</span>
						</div>
						<span className="font-bold text-xl hidden sm:block">Construction</span>
					</motion.div>
				</div>

				{/* Right Section */}
				<div className="flex items-center space-x-2">
					{/* Notifications */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="relative">
								<Bell className="h-5 w-5" />
								<span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
									3
								</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-80">
							<DropdownMenuItem>
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium">New project assigned</p>
									<p className="text-xs text-muted-foreground">2 minutes ago</p>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium">Invoice payment received</p>
									<p className="text-xs text-muted-foreground">1 hour ago</p>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium">Client meeting scheduled</p>
									<p className="text-xs text-muted-foreground">3 hours ago</p>
								</div>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="relative">
								<Settings className="h-5 w-5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-80">
							<DropdownMenuItem>
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium">Family Types</p>
									{/* <p className="text-xs text-muted-foreground">2 minutes ago</p> */}
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium">Team Category Types</p>
									{/* <p className="text-xs text-muted-foreground">1 hour ago</p> */}
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium">Identity Types</p>
									{/* <p className="text-xs text-muted-foreground">3 hours ago</p> */}
								</div>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Theme Toggle */}
					<Button variant="ghost" size="icon" onClick={toggleTheme}>
						<motion.div initial={false} animate={{ rotate: theme === "dark" ? 180 : 0 }} transition={{ duration: 0.3 }}>
							{theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
						</motion.div>
					</Button>

					{/* Login/Profile */}
					{user ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon">
									{userImage ? (
										<img src={userImage} alt={user?.username} className="rounded-full h-5 w-5" />
									) : (
										<User className="h-5 w-5" />
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<div className="px-3 py-2 border-b border-border mb-1">
									<span className="font-semibold text-sm">{user?.username}</span>
								</div>
								<DropdownMenuItem>Profile</DropdownMenuItem>
								<DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Button
							variant="ghost"
							size="icon"
							onClick={() => window.location.href = "/login"}
						>
							<LogIn className="h-5 w-5" />
						</Button>
					)}
				</div>
			</div>
		</motion.nav>
	)
}
