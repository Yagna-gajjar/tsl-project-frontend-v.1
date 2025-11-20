"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
	children: React.ReactNode
	defaultTheme?: Theme
}

type ThemeProviderState = {
	theme: Theme
	setTheme: (theme: Theme) => void
	toggleTheme: () => void
}

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
	toggleTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children, defaultTheme = "system", ...props }: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("construction-ui-theme") as Theme) || defaultTheme)

	useEffect(() => {
		const root = window.document.documentElement
		root.classList.remove("light", "dark")
		root.classList.add(theme)
	}, [theme])

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light"
		setTheme(newTheme)
		localStorage.setItem("construction-ui-theme", newTheme)
	}

	const value = {
		theme,
		setTheme: (theme: Theme) => {
			localStorage.setItem("construction-ui-theme", theme)
			setTheme(theme)
		},
		toggleTheme,
	}

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	)
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext)

	if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

	return context
}
