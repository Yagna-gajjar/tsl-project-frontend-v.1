"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmationOptions {
	title?: string
	description?: string
	confirmText?: string
	cancelText?: string
	variant?: "default" | "destructive"
}

interface ConfirmationContextType {
	confirm: (options?: ConfirmationOptions) => Promise<boolean>
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null)

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = useState(false)
	const [options, setOptions] = useState<ConfirmationOptions>({})
	const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

	const confirm = (options: ConfirmationOptions = {}): Promise<boolean> => {
		setOptions({
			title: "Are you sure?",
			description: "This action cannot be undone.",
			confirmText: "Continue",
			cancelText: "Cancel",
			variant: "default",
			...options,
		})
		setIsOpen(true)

		return new Promise((resolve) => {
			setResolvePromise(() => resolve)
		})
	}

	const handleConfirm = () => {
		setIsOpen(false)
		if (resolvePromise) {
			resolvePromise(true)
			setResolvePromise(null)
		}
	}

	const handleCancel = () => {
		setIsOpen(false)
		if (resolvePromise) {
			resolvePromise(false)
			setResolvePromise(null)
		}
	}

	return (
		<ConfirmationContext.Provider value={{ confirm }}>
			{children}
			<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{options.title}</AlertDialogTitle>
						<AlertDialogDescription>{options.description}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={handleCancel}>{options.cancelText}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirm}
							className={
								options.variant === "destructive"
									? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
									: ""
							}
						>
							{options.confirmText}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</ConfirmationContext.Provider>
	)
}

export function useConfirmation() {
	const context = useContext(ConfirmationContext)
	if (!context) {
		throw new Error("useConfirmation must be used within a ConfirmationProvider")
	}
	return context
}
