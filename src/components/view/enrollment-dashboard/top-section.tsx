import { useState } from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";

import FamilyPanel from "./panel/family-panel";
import EnrollmentFormNew from "./enrollment-form-modal";

export default function TopSection() {
  const [rateTableData, setRateTableData] = useState<any>(null);

  const [leftWidth] = useState(30);
  const middleWidth = 100 - leftWidth;

  return (
    <div className="flex flex-col lg:flex-row w-full h-full overflow-hidden relative">

      <motion.div
        style={{ width: `${middleWidth}%` }}
        className="overflow-hidden bg-muted/5"
      >
        <EnrollmentFormNew
          setRateTableData={setRateTableData}
        />
      </motion.div>

      <div className="w-1 border-x border-transparent flex items-center justify-center z-10">
        <GripVertical className="h-4 w-4 text-muted-foreground/20" />
      </div>

      <motion.div
        style={{ width: `${leftWidth}%` }}
        className="lg:border-r border-border/50 overflow-hidden bg-card/20 backdrop-blur-sm"
      >
        <FamilyPanel
          rateTableData={rateTableData}
        />
      </motion.div>


    </div>
  );
}