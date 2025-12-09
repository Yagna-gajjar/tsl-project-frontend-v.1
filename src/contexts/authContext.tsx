import type { User } from "@/types/user"
import React, {
	createContext,
	useContext,
	useEffect,
	useState,
} from "react"

interface AuthContextType {
	user: User | null
	token: string | null
	login: (user: User, token: string) => void
	logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null)
	const [token, setToken] = useState<string | null>(() => {
		return localStorage.getItem("token")
	})

	const redirectToLogin = () => {
		window.location.replace("/login")
	}

	const login = (user: User, token: string) => {
		setUser(user)
		setToken(token)
		localStorage.setItem("token", token)
	}

	const logout = () => {
		setUser(null)
		setToken(null)
		localStorage.removeItem("token")
		redirectToLogin()
	}

	useEffect(() => {
		// FIX: Do not validate while on /login page
		if (window.location.pathname === "/login") return;

		const validateToken = async () => {
			if (!token) {
				logout()
				return
			}

			try {
				const res = await fetch(
					`${import.meta.env.VITE_APP_API_URL}/user/validate`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
					}
				)

				if (!res.ok) {
					logout()
					return
				}

				const data = await res.json()

				if (data.success) {
					setUser(data.user)

					// Refresh JWT if provided
					if (data.token) {
						setToken(data.token)
						localStorage.setItem("token", data.token)
					}
				} else {
					logout()
				}
			} catch (err) {
				console.error("Session validation failed", err)
				logout()
			}
		}

		validateToken()
	}, [token])

	const value = {
		user,
		token,
		login,
		logout,
	}

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}
