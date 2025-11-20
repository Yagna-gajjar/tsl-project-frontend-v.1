import {
	GenderEnum,
	BloodGroupEnum,
	StatusEnum,
	IdProofEnum,
	TransportModeEnum,
} from "./enums";

export interface Member {
	memberId: number;
	familyId?: number;
	memberFirstName: string;
	memberMiddleName?: string;
	memberLastName: string;
	dob?: Date;
	email?: string;
	relationship?: string;
	gender: GenderEnum;
	bloodGroup?: BloodGroupEnum;
	status: StatusEnum;
	schoolName?: string;
	qualification?: string;
	idProofType?: IdProofEnum;
	idProofNumber?: string;
	contactNumber?: string;
	transportMode?: TransportModeEnum;
	addressId?: number;
	remarks?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
