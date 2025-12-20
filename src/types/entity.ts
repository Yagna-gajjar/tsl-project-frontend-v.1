export interface Entity {
  entityId?: number;
  entityName: string;
  regDate: Date | string;
  suspensionDate?: Date | string | null;
  entityType: string;
  legalStatus: string;
  legalName: string;
  line1?: string;
  line2?: string;
  city?: string;
  pinCode?: string;
  state?: string;
  country?: string;
  financialDetails?: string;
  gstRegNo?: number;
  otherFinancialDetails?: string;
  email?: string;
  officeContact?: string;
  sector?: string;
  entityNature?: string;
  entityRole?: string;
  status?: string;
  createdBy?: string;
} 