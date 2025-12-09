export interface Response<T = unknown> {
	success: boolean
	message: string
	data: T | null
	pagination: {
		page: number,
		limit: number,
		total: number
	}
}
