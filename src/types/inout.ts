export interface InOutLog {
	inOutId: number;
	userId: number;
	inTime: Date;
	outTime: Date | null;
	totalMinutes: number | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;

	username?: string
	email?: string
	role?: string
}
