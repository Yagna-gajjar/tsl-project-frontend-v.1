import type React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import BottomSection from "./bottom-section";
import { Button } from "@/components/ui/button";
import RateTable from "./panel/rate-table";
import EnrollmentFormNew from "./enrollment-form-modal";

export default function EnrollmentDashboard() {
  const [middleview] = useState<any>(null);
  const [rateTableData, setRateTableData] = useState<any>(null);

  const [topHeight, setTopHeight] = useState(100);
  const [isDraggingY, setIsDraggingY] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [panelWidth, setPanelWidth] = useState(0);
  const [isDraggingX, setIsDraggingX] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleMouseDownY = () => { if (!isExpanded) setIsDraggingY(true); document.body.style.userSelect = "none"; };
  const handleMouseDownX = () => { setIsDraggingX(true); document.body.style.userSelect = "none"; };

  const handleMouseUp = () => {
    setIsDraggingY(false);
    setIsDraggingX(false);
    document.body.style.userSelect = "auto";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();

    if (isDraggingY && !isExpanded) {
      const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
      if (newHeight > 20 && newHeight < 85) setTopHeight(newHeight);
    }

    if (isDraggingX) {
      const mouseXFromRight = rect.right - e.clientX;
      const newWidthPercent = (mouseXFromRight / rect.width) * 100;
      if (newWidthPercent > 5 && newWidthPercent < 80) setPanelWidth(newWidthPercent);
    }
  };

  const togglePanel = () => {
    if (!isOpen) {
      setPanelWidth(90);
      setIsOpen(true);
    } else {
      setPanelWidth(0);
      setIsOpen(false);
    }
  };

  return (
    <motion.div
      className="h-[87vh] flex flex-col overflow-hidden bg-background relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <motion.div
          className="flex overflow-hidden border-b border-border/40"
          style={{ height: isExpanded ? "0%" : `${topHeight}%` }}
          animate={{ height: isExpanded ? "0%" : `${topHeight}%` }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex-1 overflow-hidden">
            <EnrollmentFormNew setRateTableData={setRateTableData} />
          </div>
        </motion.div>

        <div className="relative w-full h-10 flex justify-center items-center cursor-ns-resize z-30 group" onMouseDown={handleMouseDownY}>
          <Button onClick={() => setIsExpanded(!isExpanded)} className="py-1 h-8 px-4 rounded-full z-20 gap-2 shadow-lg" variant="secondary">
            <span className="text-xs font-bold">{isExpanded ? "SHOW CONTROLS" : "VIEW HISTORY"}</span>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <div className="absolute w-full h-[1px] bg-border group-hover:bg-primary/40 top-1/2 -translate-y-1/2" />
        </div>

        <motion.div
          className="z-10 overflow-hidden bg-muted/5"
          style={{ height: isExpanded ? "100%" : `${100 - topHeight}%` }}
          animate={{ height: isExpanded ? "100%" : `${100 - topHeight}%` }}
        >
          <BottomSection selectedMemberId={null} historyData={middleview} />
        </motion.div>
      </div>

      <motion.div
        className="absolute right-0 top-0 h-full z-[100] bg-card border-l border-border shadow-2xl flex flex-row items-start"
        style={{ width: `${panelWidth}%` }}
        animate={{ width: `${panelWidth}%` }}
        transition={isDraggingX ? { duration: 0 } : { duration: 0.4 }}
      >
        <div
          className="absolute left-0 top-0 h-full w-10 -translate-x-full flex items-center justify-center cursor-ew-resize group"
          onMouseDown={handleMouseDownX}
        >
          <Button onClick={togglePanel} className="rotate-[-90deg] py-1 h-8 px-4 rounded-full z-20 gap-2 shadow-lg" variant="secondary">
            <span className="text-xs font-bold"> {panelWidth > 5 ? "HIDE RATES" : "VIEW RATES"}</span>
            {panelWidth > 5 ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <div className="absolute w-[1px] h-full bg-border group-hover:bg-primary/40 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex-1 h-full overflow-hidden flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-bold">RATE TABLE</h3>
            <Button variant="ghost" size="icon" onClick={() => { setPanelWidth(0); setIsOpen(false); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <RateTable rateTableData={rateTableData} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}