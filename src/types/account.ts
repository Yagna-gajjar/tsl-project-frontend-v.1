export interface Account {
  accountId?: number;
  regDate: Date | string;
  suspensionDate?: Date | string;
  accountType?: string;
  entityId: number;
  defineEntity?: string;
  accountName: string;
  addressId?: number;
  contact: string;
  proffesionalSector: string;
  adminInstruction: string;

  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
}