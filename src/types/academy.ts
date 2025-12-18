export interface Academy {
  academyId: number;
  academyType?: string;
  registrationDate?: Date | string;
  academyName: string;
  addressId?: number;
  contactNumber?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  about?: string;
  share_main?: number;
  share_tanna?: number;
  share_tsl?: number;
  share_expenses?: number;
  panCard?: string;
  discountinuedDate?: Date | string;
  createdAt?: Date;
  updatedAt?: Date;
}
