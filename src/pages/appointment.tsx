import { useState } from "react";
import AppointmentTable from "@/components/view/appointment/appointment-table";
import AppointmentViewModal from "@/components/view/appointment/appointment-view-modal";

export default function AppointmentsPage() {
  const [refreshKey] = useState(0);


  const [viewOpen, setViewOpen] = useState(false);
  const [viewingId, setViewingId] = useState<number | undefined>(undefined);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Appointments</h1>
          <p className="text-sm text-muted-foreground">
            Manage appointment bookings (create / edit / view).
          </p>
        </div>
      </div>

      <div className="bg-background/80 p-4 rounded-lg shadow-sm">
        <AppointmentTable
          refreshKey={refreshKey}
          onView={(row) => {
            setViewingId(row.appointmentId);
            setViewOpen(true);
          }}
        />
      </div>

      <AppointmentViewModal
        isOpen={viewOpen}
        appointmentId={viewingId}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
}
