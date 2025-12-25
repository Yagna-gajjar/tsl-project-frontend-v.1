export interface Facility {
  facilityId?: number;
  facilityName: string;
  facilityType: string;
  facilityDimension?: string | null;
  areaSQFT?: number | null;
  description?: string | null;
  academicCapacity?: number | null;
  recreationCapacity?: number | null;
  eventCapacity?: number | null;
  level: number;
  createdAt?: Date;
  updatedAt?: Date;
}
