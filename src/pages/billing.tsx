import { motion } from "framer-motion";
import { getAcademies } from "@/api/academy.api";
import BillingPage from "@/components/view/billing/BillingPage";
import { useState } from "react";
import type { Academy } from "@/types/academy";
export default function Billing() {
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <BillingPage academy={{
        academyId: 9,
        academyType: "Football",
        registrationDate: "2022-10-31T18:30:00.000Z",
        academyName: "Master FC",
        contactNumber: "1234567890",
        email: "mfc@gmail.com",
        share_main: 50,
        share_tanna: 30,
        share_tsl: 10,
        share_expenses: 10,
        panCard: "UGSVGSC",
        discontinuedDate: null,
        createdAt: "2025-11-30T23:58:54.008Z",
        updatedAt: "2025-11-30T23:58:54.008Z"
      }} />
    </motion.div>
  );
}
