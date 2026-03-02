export interface Transaction {
	transactionId?: number;
	transactionType: string;
	typeSerialNo: number;

	crEntityId: number | null;
	crAccountId: number | null;
	crMemberId: number | null;
	crMsNo: number | null;
	crEntityName?: string;
	crAccountName?: string;
	crMemberFirstName?: string;
	crMemberLastName?: string;

	drEntityId: number | null;
	drAccountId: number | null;
	drMemberId: number | null;
	drMsNo: number | null;
	drEntityName?: string;
	drAccountName?: string;
	drMemberFirstName?: string;
	drMemberLastName?: string;

	transactionDetails: string;
	transactionDate: string | Date;
	entrySource: string;
	enrollmentId: number | null;
	formReferenceNo: string;
	amount: string | number;
	accApproval: boolean;

	auditRemarks: string;
	printRemarks: string;
	adminRemarks: string;

	status?: string;
	createdBy?: number | null;
	createdAt?: string;
	updatedAt?: string;
}