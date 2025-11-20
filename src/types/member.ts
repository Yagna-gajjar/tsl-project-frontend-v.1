export interface Member {
	memberId?: number;
	familyId: number;
	memberFirstName: string;
	memberMiddleName?: string;
	memberLastName: string;
	dob: Date;
	email: string;
	relationship?: string;
	bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
	gender: 'male' | 'female' | 'other';
	status: 'active' | 'inactive' | 'block';
	schoolName?: string;
	qualification?: string;
	idProofType?: 'aadhar card' | 'pan card' | 'voter id' | 'passport' | 'driving license' | 'other';
	idProofNumber?: string;
	contactNumber?: string;
	transportMode: 'self drive' | 'parents' | 'van' | 'walking' | 'other';
	addressId: number;
	remarks?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
