import { getBatchMember, type BatchMember } from "@/api/batchMember.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Response } from "@/types/response";
import { useEffect } from "react";

export interface EnrollmentSummary {
  enrollmentId: number;
  courseName?: string | null;
  academyName?: string | null;
}

export interface EnrollmentSummary {
  enrollmentId: number;
  courseName?: string | null;
  academyName?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
    selectedEnrollment?: EnrollmentSummary | null;
  onAction?: (actionKey: string, enrollment?: EnrollmentSummary | null) => void;
}


export default function AppointmentModal({ open, onOpenChange, selectedEnrollment }: Props) {

    useEffect(() => {
        const fetchBatchMember = async () => {
            const res: Response<BatchMember[]> = await getBatchMember({ enrollmentId: selectedEnrollment?.enrollmentId })
            console.log(res?.data);
        } 
        fetchBatchMember()
    }, [selectedEnrollment]);
    

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95%] rounded-xl p-6 bg-white border-0 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Appointment List
          </DialogTitle>
        </DialogHeader>
        <div></div>
      </DialogContent>
    </Dialog>
  );
}
