export interface Area {
  areaId: number;
  facilityId: number;
  areaName: string;
  areaDimension?: string;
  areaSQFT?: number;
  portion?: number;
  groundAreaPart?: string;
  facilityName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
