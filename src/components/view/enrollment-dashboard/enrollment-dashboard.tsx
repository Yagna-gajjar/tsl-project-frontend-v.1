import type React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, TableProperties, X } from "lucide-react";

import TopSection from "./top-section";
import BottomSection from "./bottom-section";
import { Button } from "@/components/ui/button";
import RateTable from "./panel/rate-table";

export default function EnrollmentDashboard() {
  const [middleview] = useState<any>(null);
  const [rateTableData, setRateTableData] = useState<any>(null); // Lifted state
  const [showRateTable, setShowRateTable] = useState(false);
  const [topHeight, setTopHeight] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseDown = () => { if (!isExpanded) { setIsDragging(true); document.body.style.userSelect = "none"; } };
  const handleMouseUp = () => { setIsDragging(false); document.body.style.userSelect = "auto"; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isExpanded) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
    if (newHeight > 20 && newHeight < 85) setTopHeight(newHeight);
  };

  return (
    <motion.div
      className="h-[87vh] flex flex-col overflow-hidden bg-background relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 1. TOP SECTION */}
      <motion.div
        className="flex overflow-hidden border-b border-border/40"
        style={{ height: isExpanded ? "0%" : `${topHeight}%` }}
        animate={{ height: isExpanded ? "0%" : `${topHeight}%` }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <TopSection setRateTableData={setRateTableData} />
      </motion.div>

      {/* 2. DRAGGABLE DIVIDER */}
      <div className="relative w-full h-10 flex justify-center items-center cursor-ns-resize z-30 group" onMouseDown={handleMouseDown}>
        <Button onClick={() => setIsExpanded(!isExpanded)} className="py-1 h-8 px-4 rounded-full z-20 gap-2 shadow-lg" variant="secondary">
          <span className="text-xs font-bold">{isExpanded ? "SHOW CONTROLS" : "VIEW HISTORY"}</span>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
        <div className="absolute w-full h-[1px] bg-border group-hover:bg-primary/40 top-1/2 -translate-y-1/2" />
      </div>

      {/* 3. BOTTOM SECTION */}
      <motion.div
        className="z-40 overflow-hidden bg-muted/5"
        style={{ height: isExpanded ? "100%" : `${100 - topHeight}%` }}
        animate={{ height: isExpanded ? "100%" : `${100 - topHeight}%` }}
      >
        <BottomSection selectedMemberId={null} historyData={middleview} />
      </motion.div>

      {/* 4. VERTICAL TOGGLE BUTTON (Right Side) */}
      <AnimatePresence>
        {rateTableData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-0 top-1/3 z-[55]"
          >
            <Button
              onClick={() => setShowRateTable(true)}
              className="flex items-center gap-2 rounded-lg h-32 px-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xl transition-all"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              <span className="text-[13px] font-bold tracking-widest uppercase">Course Rates</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRateTable && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRateTable(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
            <motion.div
              initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
              className="absolute right-4 w-[calc(100vw-200px)] top-5 max-h-[80vh] bg-background border border-border shadow-2xl z-[101] rounded-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b bg-muted/5">
              <span className="text-sm font-bold flex items-center gap-2">
                <TableProperties className="h-4 w-4 text-blue-600" /> Course Rate Matrix
              </span>
              <Button variant="ghost" size="icon" onClick={() => setShowRateTable(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="overflow-y-auto p-2"><RateTable rateTableData={rateTableData} /></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}