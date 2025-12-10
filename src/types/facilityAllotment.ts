export interface FacilityAllotment {
  facilityAllotmentId: number;
  facilityId?: number | null;
  areaId?: number | null;
  batchId?: number | null;
  assignmentDate?: string | null;
  unAssignmentDate?: string | null;
  createdAt?: string | Date | null;
    updatedAt?: string | Date | null;
    
  facilityName?: string | null;
  areaName?: string | null;
  batchName?: string | null;
}