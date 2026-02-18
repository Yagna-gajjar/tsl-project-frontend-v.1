export const ENROLLMENT_WORKFLOW_CONFIG: Record<string, any> = {
	QUIT: {
		existingEnrollment: { process: 1, batchUpdate: true },
		newVersion: { process: 1, batchUpdate: false },
		newEnrollment: null
	},
	COURSE_DISCONTINUE: {
		existingEnrollment: { process: 1, batchUpdate: true },
		newVersion: { process: 1, batchUpdate: false },
		newEnrollment: null
	},
	TSL_TERMINATION: {
		existingEnrollment: { process: 1, batchUpdate: true },
		newVersion: { process: 1, batchUpdate: false },
		newEnrollment: null
	},
	PERMITTED_EXIT: {
		existingEnrollment: { process: 1, batchUpdate: true },
		newVersion: { process: 1, batchUpdate: false },
		newEnrollment: null
	},
	FREEZER: {
		existingEnrollment: { process: 1, batchUpdate: true },
		newVersion: { process: 1, batchUpdate: false },
		newEnrollment: { process: 2, batchUpdate: true }
	},
	BREAK: {
		existingEnrollment: { process: 1, batchUpdate: true },
		newVersion: { process: 1, batchUpdate: false },
		newEnrollment: { process: 2, batchUpdate: true }
	},
	SUSPEND: {
		existingEnrollment: { process: 1, batchUpdate: true },
		newVersion: { process: 1, batchUpdate: false },
		newEnrollment: { process: 2, batchUpdate: true }
	},
	MEDICAL_BREAK: {
		existingEnrollment: { process: 1, batchUpdate: true },
		newVersion: { process: 1, batchUpdate: false },
		newEnrollment: { process: 2, batchUpdate: true }
	},
	DEFREEZE: {
		existingEnrollment: { process: 1, batchUpdate: true },
		newVersion: { process: 1, batchUpdate: false },
		newEnrollment: { process: 3, batchUpdate: true }
	},
	CHANGE_COURSE: {
		existingEnrollment: { process: 1, batchUpdate: true },
		newVersion: { process: 1, batchUpdate: false },
		newEnrollment: { process: 4, batchUpdate: true }
	},
	FEE_TRANSFER: {
		existingEnrollment: { process: 1, batchUpdate: true },
		newVersion: { process: 1, batchUpdate: false },
		newEnrollment: { process: 5, batchUpdate: true }
	},
	CHANGE_ATTENDING_DAYS: {
		existingEnrollment: { process: 1, batchUpdate: true },
		newVersion: { process: 1, batchUpdate: false },
		newEnrollment: { process: 6, batchUpdate: true }
	},
	CHANGE_START_DATE: {
		existingEnrollment: { process: 7, batchUpdate: true },
		newVersion: { process: 7, batchUpdate: false },
		newEnrollment: null
	},
	CHANGE_DEBIT_NOTE: {
		existingEnrollment: { process: 8, batchUpdate: false },
		newVersion: { process: 8, batchUpdate: false },
		newEnrollment: null
	},
	CHANGE_DISCOUNT: {
		existingEnrollment: { process: 9, batchUpdate: false },
		newVersion: { process: 9, batchUpdate: false },
		newEnrollment: null
	},
	CHANGE_PATTERN_BATCH: {
		existingEnrollment: { process: 10, batchUpdate: true },
		newVersion: { process: 10, batchUpdate: true },
		newEnrollment: null
	},
};