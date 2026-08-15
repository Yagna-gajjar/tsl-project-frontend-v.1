import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react"
import { getAppSettings, updateAppSetting, type AppSetting } from "@/api/appSetting.api"

interface AppSettingsContextType {
	settings: AppSetting[]
	isLoading: boolean
	gstEnabled: boolean
	processingCharge: number
	refetch: () => Promise<void>
	setGstEnabled: (enabled: boolean) => Promise<void>
	setProcessingCharge: (amount: number) => Promise<void>
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined)

export const AppSettingsProvider = ({ children }: { children: React.ReactNode }) => {
	const [settings, setSettings] = useState<AppSetting[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(true)

	const fetchSettings = useCallback(async () => {
		try {
			const res = await getAppSettings()
			if (res.success) {
				setSettings(res.data || [])
			}
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchSettings()
	}, [fetchSettings])

	const gstEnabled = useMemo(
		() => settings.find((s) => s.settingKey === "APPLY_GST")?.settingValue === "true",
		[settings]
	)

	const setGstEnabled = useCallback(async (enabled: boolean) => {
		const res = await updateAppSetting("APPLY_GST", enabled ? "true" : "false")
		if (res.success) {
			await fetchSettings()
		}
	}, [fetchSettings])

	const processingCharge = useMemo(
		() => Number(settings.find((s) => s.settingKey === "PROCESSING_CHARGE")?.settingValue) || 0,
		[settings]
	)

	const setProcessingCharge = useCallback(async (amount: number) => {
		const res = await updateAppSetting("PROCESSING_CHARGE", String(amount))
		if (res.success) {
			await fetchSettings()
		}
	}, [fetchSettings])

	const value = useMemo<AppSettingsContextType>(
		() => ({
			settings,
			isLoading,
			gstEnabled,
			processingCharge,
			refetch: fetchSettings,
			setGstEnabled,
			setProcessingCharge,
		}),
		[settings, isLoading, gstEnabled, processingCharge, fetchSettings, setGstEnabled, setProcessingCharge]
	)

	return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export const useAppSettings = () => {
	const context = useContext(AppSettingsContext)
	if (!context) {
		throw new Error("useAppSettings must be used within an AppSettingsProvider")
	}
	return context
}
