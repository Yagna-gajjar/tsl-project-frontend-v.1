"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef } from "react"
import { User, Mail, Phone, MapPin, Eye, EyeOff, Upload, Check, X, Camera, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface FormData {
	username: string
	password: string
	rePassword: string
	email: string
	phone: string
	address: string
	profileImage: File | null
}

interface ValidationErrors {
	username?: string
	password?: string
	rePassword?: string
	email?: string
	phone?: string
	address?: string
	profileImage?: string
}

const passwordRequirements = [
	{ label: "At least 5 characters", test: (pwd: string) => pwd.length >= 5 },
	{ label: "Contains uppercase letter", test: (pwd: string) => /[A-Z]/.test(pwd) },
	{ label: "Contains lowercase letter", test: (pwd: string) => /[a-z]/.test(pwd) },
	{ label: "Contains digit", test: (pwd: string) => /\d/.test(pwd) },
	{ label: "Contains symbol", test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
]

export default function Signup() {
	const { toast } = useToast()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [showPassword, setShowPassword] = useState(false)
	const [showRePassword, setShowRePassword] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [imagePreview, setImagePreview] = useState<string | null>(null)

	const [formData, setFormData] = useState<FormData>({
		username: "",
		password: "",
		rePassword: "",
		email: "",
		phone: "",
		address: "",
		profileImage: null,
	})

	const [errors, setErrors] = useState<ValidationErrors>({})
	const [touched, setTouched] = useState<Record<string, boolean>>({})

	const validateUsername = (username: string): string | undefined => {
		if (!username) return "Username is required"
		if (username !== username.toLowerCase()) return "Username must be lowercase"
		if (username.length < 5) return "Username must be at least 5 characters"
		if (username.length > 100) return "Username must not exceed 100 characters"
		if (!/^[a-z0-9_]+$/.test(username)) return "Username can only contain lowercase letters, numbers, and underscores"
		return undefined
	}

	const validatePassword = (password: string): string | undefined => {
		if (!password) return "Password is required"
		const failedRequirements = passwordRequirements.filter((req) => !req.test(password))
		if (failedRequirements.length > 0) {
			return `Password must meet all requirements`
		}
		return undefined
	}

	const validateEmail = (email: string): string | undefined => {
		if (!email) return "Email is required"
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email)) return "Please enter a valid email address"
		return undefined
	}

	const validatePhone = (phone: string): string | undefined => {
		if (!phone) return "Phone number is required"
		const phoneRegex = /^\+?[1-9]\d{1,14}$/
		if (!phoneRegex.test(phone)) return "Please enter a valid phone number with country code (max 14 digits)"
		if (phone.length > 14) return "Phone number cannot exceed 14 characters"
		return undefined
	}

	const validateAddress = (address: string): string | undefined => {
		if (!address) return "Address is required"
		if (address.length < 10) return "Please provide a complete address"
		return undefined
	}

	const validateForm = (): boolean => {
		const newErrors: ValidationErrors = {}

		newErrors.username = validateUsername(formData.username)
		newErrors.password = validatePassword(formData.password)
		newErrors.email = validateEmail(formData.email)
		newErrors.phone = validatePhone(formData.phone)
		newErrors.address = validateAddress(formData.address)

		if (formData.password !== formData.rePassword) {
			newErrors.rePassword = "Passwords do not match"
		}

		setErrors(newErrors)
		return Object.values(newErrors).every((error) => !error)
	}

	const handleInputChange = (field: keyof FormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
		setTouched((prev) => ({ ...prev, [field]: true }))

		// Real-time validation
		const newErrors = { ...errors }
		switch (field) {
			case "username":
				newErrors.username = validateUsername(value)
				break
			case "password":
				newErrors.password = validatePassword(value)
				if (formData.rePassword && value !== formData.rePassword) {
					newErrors.rePassword = "Passwords do not match"
				} else if (formData.rePassword && value === formData.rePassword) {
					newErrors.rePassword = undefined
				}
				break
			case "rePassword":
				newErrors.rePassword = value !== formData.password ? "Passwords do not match" : undefined
				break
			case "email":
				newErrors.email = validateEmail(value)
				break
			case "phone":
				newErrors.phone = validatePhone(value)
				break
			case "address":
				newErrors.address = validateAddress(value)
				break
		}
		setErrors(newErrors)
	}

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				toast({
					title: "File too large",
					description: "Please select an image smaller than 5MB",
					variant: "destructive",
				})
				return
			}

			if (!file.type.startsWith("image/")) {
				toast({
					title: "Invalid file type",
					description: "Please select an image file",
					variant: "destructive",
				})
				return
			}

			setFormData((prev) => ({ ...prev, profileImage: file }))

			const reader = new FileReader()
			reader.onload = (e) => {
				setImagePreview(e.target?.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)

		if (!validateForm()) {
			setIsSubmitting(false)
			toast({
				title: "Validation Error",
				description: "Please fix the errors before submitting",
				variant: "destructive",
			})
			return
		}

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Console log all form data
		console.log("=== SIGNUP FORM DATA ===")
		console.log("Username:", formData.username)
		console.log("Password:", formData.password)
		console.log("Email:", formData.email)
		console.log("Phone:", formData.phone)
		console.log("Address:", formData.address)
		console.log("Profile Image:", formData.profileImage)
		console.log("Profile Image Name:", formData.profileImage?.name)
		console.log("Profile Image Size:", formData.profileImage?.size)
		console.log("Profile Image Type:", formData.profileImage?.type)
		console.log("========================")

		setIsSubmitting(false)
		toast({
			title: "Account Created Successfully!",
			description: "Welcome to XYZ Management System.",
			variant: "success",
		})
	}

	const getFieldError = (field: keyof FormData) => {
		return touched[field] ? errors[field] : undefined
	}

	return (
		<div className="h-screen w-screen overflow-scroll">
			<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="w-full max-w-2xl"
				>
					<Card className="shadow-2xl border-0 bg-card/95 backdrop-blur">
						<CardHeader className="text-center pb-6">
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ duration: 0.5, delay: 0.2 }}
								className="mx-auto mb-4"
							>
								<div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
									<Building2 className="h-8 w-8 text-primary-foreground text-white" />
								</div>
							</motion.div>
							<CardTitle className="text-3xl font-bold">Join Us</CardTitle>
							<p className="text-muted-foreground">Create your account for managing xyz projects</p>
						</CardHeader>

						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-6">
								{/* Profile Image Upload */}
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5, delay: 0.3 }}
									className="flex flex-col items-center space-y-4"
								>
									<div className="relative">
										<motion.div
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-muted/50"
											onClick={() => fileInputRef.current?.click()}
										>
											{imagePreview ? (
												<img
													src={imagePreview || "/placeholder.svg"}
													alt="Preview"
													className="w-full h-full object-cover rounded-full"
												/>
											) : (
												<Camera className="h-8 w-8 text-muted-foreground" />
											)}
										</motion.div>
										<input
											ref={fileInputRef}
											type="file"
											accept="image/*"
											onChange={handleImageUpload}
											className="hidden"
										/>
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => fileInputRef.current?.click()}
										className="flex items-center gap-2"
									>
										<Upload className="h-4 w-4" />
										Upload Profile Image
									</Button>
								</motion.div>

								{/* Username */}
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5, delay: 0.4 }}
									className="space-y-2"
								>
									<Label htmlFor="username">Username *</Label>
									<div className="relative">
										<User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
										<Input
											id="username"
											value={formData.username}
											onChange={(e) => handleInputChange("username", e.target.value.toLowerCase())}
											placeholder="Enter username (lowercase)"
											className={cn("pl-10", getFieldError("username") && "border-destructive")}
										/>
									</div>
									<AnimatePresence>
										{getFieldError("username") && (
											<motion.p
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: "auto" }}
												exit={{ opacity: 0, height: 0 }}
												className="text-sm text-destructive"
											>
												{getFieldError("username")}
											</motion.p>
										)}
									</AnimatePresence>
								</motion.div>

								{/* Email */}
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5, delay: 0.5 }}
									className="space-y-2"
								>
									<Label htmlFor="email">Email *</Label>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
										<Input
											id="email"
											type="email"
											value={formData.email}
											onChange={(e) => handleInputChange("email", e.target.value)}
											placeholder="Enter your email"
											className={cn("pl-10", getFieldError("email") && "border-destructive")}
										/>
									</div>
									<AnimatePresence>
										{getFieldError("email") && (
											<motion.p
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: "auto" }}
												exit={{ opacity: 0, height: 0 }}
												className="text-sm text-destructive"
											>
												{getFieldError("email")}
											</motion.p>
										)}
									</AnimatePresence>
								</motion.div>

								{/* Phone */}
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5, delay: 0.6 }}
									className="space-y-2"
								>
									<Label htmlFor="phone">Phone Number *</Label>
									<div className="relative">
										<Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
										<Input
											id="phone"
											value={formData.phone}
											onChange={(e) => handleInputChange("phone", e.target.value)}
											placeholder="+1234567890 (with country code)"
											className={cn("pl-10", getFieldError("phone") && "border-destructive")}
										/>
									</div>
									<AnimatePresence>
										{getFieldError("phone") && (
											<motion.p
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: "auto" }}
												exit={{ opacity: 0, height: 0 }}
												className="text-sm text-destructive"
											>
												{getFieldError("phone")}
											</motion.p>
										)}
									</AnimatePresence>
								</motion.div>

								{/* Password */}
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5, delay: 0.7 }}
									className="space-y-2"
								>
									<Label htmlFor="password">Password *</Label>
									<div className="relative">
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											value={formData.password}
											onChange={(e) => handleInputChange("password", e.target.value)}
											placeholder="Enter your password"
											className={cn("pr-10", getFieldError("password") && "border-destructive")}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 transform -translate-y-1/2"
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4 text-muted-foreground" />
											) : (
												<Eye className="h-4 w-4 text-muted-foreground" />
											)}
										</button>
									</div>

									{/* Password Requirements */}
									<div className="space-y-1">
										{passwordRequirements.map((req, index) => {
											const isValid = req.test(formData.password)
											return (
												<motion.div
													key={index}
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													transition={{ delay: index * 0.1 }}
													className="flex items-center gap-2 text-xs"
												>
													{isValid ? (
														<Check className="h-3 w-3 text-green-500" />
													) : (
														<X className="h-3 w-3 text-muted-foreground" />
													)}
													<span className={isValid ? "text-green-600" : "text-muted-foreground"}>{req.label}</span>
												</motion.div>
											)
										})}
									</div>
								</motion.div>

								{/* Confirm Password */}
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5, delay: 0.8 }}
									className="space-y-2"
								>
									<Label htmlFor="rePassword">Confirm Password *</Label>
									<div className="relative">
										<Input
											id="rePassword"
											type={showRePassword ? "text" : "password"}
											value={formData.rePassword}
											onChange={(e) => handleInputChange("rePassword", e.target.value)}
											placeholder="Confirm your password"
											className={cn("pr-10", getFieldError("rePassword") && "border-destructive")}
										/>
										<button
											type="button"
											onClick={() => setShowRePassword(!showRePassword)}
											className="absolute right-3 top-1/2 transform -translate-y-1/2"
										>
											{showRePassword ? (
												<EyeOff className="h-4 w-4 text-muted-foreground" />
											) : (
												<Eye className="h-4 w-4 text-muted-foreground" />
											)}
										</button>
									</div>
									<AnimatePresence>
										{getFieldError("rePassword") && (
											<motion.p
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: "auto" }}
												exit={{ opacity: 0, height: 0 }}
												className="text-sm text-destructive"
											>
												{getFieldError("rePassword")}
											</motion.p>
										)}
									</AnimatePresence>
								</motion.div>

								{/* Address */}
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5, delay: 0.9 }}
									className="space-y-2"
								>
									<Label htmlFor="address">Complete Address *</Label>
									<div className="relative">
										<MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<Textarea
											id="address"
											value={formData.address}
											onChange={(e) => handleInputChange("address", e.target.value)}
											placeholder="Enter your complete address (street, city, state, country, postal code)"
											className={cn("pl-10 min-h-[80px]", getFieldError("address") && "border-destructive")}
											rows={3}
										/>
									</div>
									<AnimatePresence>
										{getFieldError("address") && (
											<motion.p
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: "auto" }}
												exit={{ opacity: 0, height: 0 }}
												className="text-sm text-destructive"
											>
												{getFieldError("address")}
											</motion.p>
										)}
									</AnimatePresence>
								</motion.div>

								{/* Submit Button */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: 1 }}
								>
									<Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
										{isSubmitting ? (
											<motion.div
												animate={{ rotate: 360 }}
												transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
												className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
											/>
										) : (
											"Create Account"
										)}
									</Button>
								</motion.div>
							</form>
						</CardContent>
					</Card>
				</motion.div>
			</div>
		</div>

	)
}
