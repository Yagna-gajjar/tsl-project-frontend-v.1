import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  HelpCircle,
  Snowflake,
  Stethoscope,
  SunSnow,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export default function EnrollmentChangeActions({
  open,
  onOpenChange,
  selectedEnrollment,
}: Props) {
  const handleClick = (actionKey: string) => {
    if (!selectedEnrollment?.enrollmentId as any) return;

    navigate(`/enrollment/${selectedEnrollment?.enrollmentId}/${actionKey}`);
    onOpenChange(false);
  };

  const isFreeze = selectedEnrollment?.courseName?.toLowerCase?.() === "freeze";

  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95%] rounded-xl p-6 bg-white border-0 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Manage Enrollment
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-base">
            Choose an action to update your current enrollment status.
          </DialogDescription>
        </DialogHeader>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
            onClick={() =>
              handleClick(
                isFreeze ? "defreeze-enrollment" : "freeze-enrollment"
              )
            }
          >
            {isFreeze ? (
              <SunSnow className="w-6 h-6 text-slate-900 group-hover:text-blue-600" />
            ) : (
              <Snowflake className="w-6 h-6 text-slate-900 group-hover:text-blue-600" />
            )}
            <span className="font-semibold text-slate-900 group-hover:text-blue-700">
              {isFreeze ? "Defreeze Enrollment" : "Freeze Enrollment"}
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
            onClick={() => handleClick("course-change")}
          >
            <BookOpen className="w-6 h-6 text-slate-900 group-hover:text-blue-600" />
            <span className="font-semibold text-slate-900 group-hover:text-blue-700">
              Change Course
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
            onClick={() => handleClick("batch-change")}
          >
            <Users className="w-6 h-6 text-slate-900 group-hover:text-blue-600" />
            <span className="font-semibold text-slate-900 group-hover:text-blue-700">
              Switch Batch
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
            onClick={() => handleClick("medical-extension")}
          >
            <Stethoscope className="w-6 h-6 text-slate-900 group-hover:text-blue-600" />
            <span className="font-semibold text-slate-900 group-hover:text-blue-700">
              Medical Extension
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
            onClick={() => handleClick("other")}
          >
            <HelpCircle className="w-6 h-6 text-slate-900 group-hover:text-blue-600" />
            <span className="font-semibold text-slate-900 group-hover:text-blue-700">
              Other Request
            </span>
          </Button>
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400">Or</span>
          </div>
        </div>

        {/* Destructive/Final Action */}
        <Button
          className="w-full py-6 bg-slate-900 hover:bg-black text-white rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          onClick={() => handleClick("cancel")}
        >
          <XCircle className="w-5 h-5 text-white" />
          <span className="text-base font-medium">Cancel Enrollment</span>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
