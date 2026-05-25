import { toast } from "@/hooks/use-toast"
import type { User } from "@/types/user"
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"

interface AuthContextType {
	user: User | null
	token: string | null
	isLoading: boolean
	login: (user: User, token: string) => void
	logout: () => void
}

const TOKEN_STORAGE_KEY = "token"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null)
	const [token, setToken] = useState<string | null>(() =>
		localStorage.getItem(TOKEN_STORAGE_KEY)
	)
	const [isLoading, setIsLoading] = useState<boolean>(true)

	const isMountedRef = useRef(true)

	const redirectToLogin = useCallback(() => {
		window.location.replace("/login")
	}, [])

	const login = useCallback((nextUser: User, nextToken: string) => {
		localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
		setUser(nextUser)
		setToken(nextToken)
	}, [])

	const logout = useCallback(() => {
		localStorage.removeItem(TOKEN_STORAGE_KEY)
		setUser(null)
		setToken(null)
		redirectToLogin()
	}, [redirectToLogin])

	useEffect(() => {
		isMountedRef.current = true
		return () => {
			isMountedRef.current = false
		}
	}, [])

	useEffect(() => {
		if (window.location.pathname === "/login") {
			setIsLoading(false)
			return
		}

		const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
		if (!storedToken) {
			setIsLoading(false)
			logout()
			return
		}

		const controller = new AbortController()

		const validateToken = async () => {
			try {
				const res = await fetch(
					`${import.meta.env.VITE_APP_API_URL}/user/validate`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${storedToken}`,
						},
						signal: controller.signal,
					}
				)

				if (!isMountedRef.current) return

				if (!res.ok) {
					logout()
					return
				}

				const data = await res.json()
				if (!isMountedRef.current) return

				if (data.success) {
					setUser(data.user)
					if (data.token && data.token !== storedToken) {
						localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
						setToken(data.token)
					}
				} else {
					logout()
				}
			} catch (err) {
				if ((err as { name?: string })?.name === "AbortError") return
				if (!isMountedRef.current) return
				toast({
					title: "Error",
					description: "Failed to validate session. Please login again.",
					variant: "destructive",
				})
				logout()
			} finally {
				if (isMountedRef.current) setIsLoading(false)
			}
		}

		validateToken()

		return () => {
			controller.abort()
		}
	}, [logout])

	const value = useMemo<AuthContextType>(
		() => ({
			user,
			token,
			isLoading,
			login,
			logout,
		}),
		[user, token, isLoading, login, logout]
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}
