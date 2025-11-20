import React, {
	createContext,
	useContext,
	useEffect,
	useState,
} from "react"
import CryptoJS from "crypto-js"

interface User {
	UserId: number
	username: string
	password: string
	phone: string
	profileImage: string
	organizationId: number
	role?: string
	createdAt: string
	updatedAt: string
}

interface AuthContextType {
	user: User | null
	token: string | null
	decryptedOrgId: string | null
	login: (user: User, token: string) => void
	logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SECRET_KEY = import.meta.env.VITE_APP_ENCRYPT_SECRET

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null)
	const [token, setToken] = useState<string | null>(() => {
		return localStorage.getItem("token")
	})
	const [decryptedOrgId, setDecryptedOrgId] = useState<string | null>(() => {
		const encryptedOrgId = localStorage.getItem("organizationId")
		if (encryptedOrgId) {
			try {
				const bytes = CryptoJS.AES.decrypt(encryptedOrgId, SECRET_KEY)
				return bytes.toString(CryptoJS.enc.Utf8)
			} catch {
				return null
			}
		}
		return null
	})

	const login = (user: User, token: string) => {
		setUser(user)
		setToken(token)
		localStorage.setItem("token", token)

		const encryptedOrgId = CryptoJS.AES.encrypt(
			user.organizationId.toString(),
			SECRET_KEY
		).toString()

		localStorage.setItem("organizationId", encryptedOrgId)
		setDecryptedOrgId(user.organizationId.toString())
	}

	const logout = () => {
		setUser(null)
		setToken(null)
		setDecryptedOrgId(null)
		localStorage.removeItem("token")
		localStorage.removeItem("organizationId")
	}

	useEffect(() => {
		const validateToken = async () => {
			if (!token) return

			try {
				const res = await fetch(
					`${import.meta.env.VITE_APP_API_URL}/api/auth/validate`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
					}
				)

				if (res.ok) {
					const data = await res.json()
					if (data.valid) {
						setUser(data.user)
					} else {
						logout()
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
		decryptedOrgId,
		login,
		logout,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}
