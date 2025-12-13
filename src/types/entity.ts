export interface Entity {
  entityId?: number;
  entityName: string;
  regDate: Date | string;
  suspensionDate?: Date | string;
  entityType: string;
  legalStatus: string;
  legalName: string;
}