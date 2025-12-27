"use client";

import type React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, X, History, Settings2 } from "lucide-react";
import BottomSection from "./bottom-section";
import { Button } from "@/components/ui/button";
import RateTable from "./panel/rate-table";
import BatchTable from "./panel/batch-table";
import EnrollmentFormNew from "./enrollment-form-modal";
import CourseTable from "./panel/course-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CourseRate } from "@/types/courseRate";
import type { Course } from "@/types/course";

export default function EnrollmentDashboard() {
  // --- Data State ---
  const [middleview] = useState<any>(null);
  const [rateTableData, setRateTableData] = useState<any>(null);
  const [batchTableData, setBatchTableData] = useState<any>([]);
  const [memberId, setMemberId] = useState<number>();
  const [selectedRate, setSelectedRate] = useState<CourseRate>();
  const [allCourse, setAllCourse] = useState<Course[]>([]);
  const [filters, setFilters] = useState({
    activityId: null as number | null,
    entityId: null as number | null,
    startTime: "" as string,
  });

  // --- Layout State ---
  const [topHeight, setTopHeight] = useState(100);
  const [isDraggingY, setIsDraggingY] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [panelWidth, setPanelWidth] = useState(0);
  const [isDraggingX, setIsDraggingX] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // --- Logic State ---
  const [enableCourseView, setEnableCourseView] = useState(false);
  const [selectedNoOfDays, setSelectedNoOfDays] = useState(0);
  const [actualDaysInWeek, setActualDaysInWeek] = useState(0);
  const [selectedCourseDayInWeek, setSelectedCourseDayInWeek] = useState<number>(0);

  // --- Handlers ---
  const handleMouseDownY = () => {
    if (!isExpanded) setIsDraggingY(true);
    document.body.style.userSelect = "none";
  };

  const handleMouseDownX = () => {
    setIsDraggingX(true);
    document.body.style.userSelect = "none";
  };

  const handleMouseUp = () => {
    setIsDraggingY(false);
    setIsDraggingX(false);
    document.body.style.userSelect = "auto";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();

    if (isDraggingY && !isExpanded) {
      const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
      if (newHeight > 15 && newHeight < 85) setTopHeight(newHeight);
    }

    if (isDraggingX) {
      const mouseXFromRight = rect.right - e.clientX;
      const newWidthPercent = (mouseXFromRight / rect.width) * 100;
      if (newWidthPercent > 10 && newWidthPercent < 95) setPanelWidth(newWidthPercent);
    }
  };

  const togglePanel = () => {
    if (!isOpen) {
      setPanelWidth(85);
      setIsOpen(true);
    } else {
      setPanelWidth(0);
      setIsOpen(false);
    }
  };

  return (
    <motion.div
      className="h-[87vh] flex flex-col overflow-hidden bg-background relative border rounded-xl m-2 shadow-inner"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* MAIN CONTENT AREA (Form + History) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP SECTION: Enrollment Form */}
        <motion.div
          className="flex overflow-hidden border-b bg-card/30"
          style={{ height: isExpanded ? "0%" : `${topHeight}%` }}
          animate={{ height: isExpanded ? "0%" : `${topHeight}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="flex-1 overflow-auto p-1">
            <EnrollmentFormNew
              setSelectedNoOfDays={setSelectedNoOfDays}
              setEnableCourseView={setEnableCourseView}
              setRateTableData={setRateTableData}
              setBatchTableData={setBatchTableData}
              setMemberId={setMemberId}
              selectedRate={selectedRate}
              setActualDaysInWeek={setActualDaysInWeek}
              setSelectedCourseDayInWeek={setSelectedCourseDayInWeek}
              allCourse={allCourse}
              setAllCourse={setAllCourse}
              onFilterChange={(newFilters) => setFilters(f => ({ ...f, ...newFilters }))}
            />
          </div>
        </motion.div>

        {/* HORIZONTAL RESIZER / HISTORY TOGGLE */}
        <div
          className="relative w-full h-10 flex justify-center items-center cursor-ns-resize z-30 group select-none"
          onMouseDown={handleMouseDownY}
        >
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-1 h-8 px-6 rounded-full z-20 gap-2 shadow-xl border-2 border-background"
            variant={isExpanded ? "default" : "secondary"}
          >
            {isExpanded ? <History className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
            <span className="text-[10px] font-black tracking-widest uppercase">
              {isExpanded ? "Back to Registration" : "View Member History"}
            </span>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <div className="absolute w-full h-[1px] bg-border group-hover:bg-primary/50 top-1/2 -translate-y-1/2 transition-colors" />
        </div>

        {/* BOTTOM SECTION: Member History */}
        <motion.div
          className="z-10 overflow-hidden bg-muted/20"
          style={{ height: isExpanded ? "100%" : `${100 - topHeight}%` }}
          animate={{ height: isExpanded ? "100%" : `${100 - topHeight}%` }}
        >
          <BottomSection selectedMemberId={memberId || null} historyData={middleview} />
        </motion.div>
      </div>

      {/* RIGHT SLIDE-OUT PANEL (Course/Rate/Batch Tables) */}
      <motion.div
        className="absolute right-0 top-0 h-full z-[100] bg-card border-l border-border shadow-2xl flex flex-col items-stretch overflow-visible"
        style={{ width: `${panelWidth}%` }}
        animate={{ width: `${panelWidth}%` }}
        transition={isDraggingX ? { duration: 0 } : { duration: 0.4 }}
      >
        {/* PANEL TOGGLE BUTTON (Floating on the left edge) */}
        <div className="absolute left-0 top-0 h-full w-10 -translate-x-full flex items-center justify-center cursor-ew-resize z-[110]">
          <Button
            onClick={togglePanel}
            className={`rotate-[-90deg] py-1 h-9 px-6 rounded-t-xl rounded-b-none z-20 gap-2 shadow-2xl border-x border-t transition-all ${isOpen ? "bg-destructive hover:bg-destructive/90 text-white" : "bg-primary"
              }`}
          >
            <span className="text-[10px] font-black tracking-widest uppercase">
              {panelWidth > 10 ? "CLOSE PANEL" : "COURSE CATALOG"}
            </span>
          </Button>
          <div className="absolute w-[2px] h-full bg-primary/20 hover:bg-primary/60 top-0 right-0" onMouseDown={handleMouseDownX} />
        </div>

        {/* PANEL CONTENT: Tabs and Tables */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background/50 backdrop-blur-sm">
          <Tabs defaultValue="courses" className="flex-1 flex flex-col min-h-0">
            {/* Header Area */}
            <div className="p-4 border-b flex items-center justify-between shrink-0 bg-muted/10">
              <TabsList className="grid grid-cols-3 w-[450px] h-11 bg-muted/50 p-1">
                <TabsTrigger value="courses" className="text-xs font-bold data-[state=active]:bg-background">
                  1. COURSE LIST
                </TabsTrigger>
                <TabsTrigger
                  value="rates"
                  disabled={!enableCourseView}
                  className="text-xs font-bold data-[state=active]:bg-background"
                >
                  2. PRICE RATES
                </TabsTrigger>
                <TabsTrigger
                  value="batches"
                  disabled={!enableCourseView}
                  className="text-xs font-bold data-[state=active]:bg-background"
                >
                  3. BATCHES
                </TabsTrigger>
              </TabsList>

              <Button
                variant="outline"
                size="icon"
                className="rounded-full hover:bg-destructive hover:text-white transition-colors"
                onClick={() => {
                  setPanelWidth(0);
                  setIsOpen(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <TabsContent value="courses">
                  <CourseTable
                    courses={allCourse}
                    activityId={filters.activityId}
                    entityId={filters.entityId}
                    startTime={filters.startTime}
                  />
                </TabsContent>

                <TabsContent value="rates" className="m-0 h-full w-full flex flex-col overflow-hidden outline-none">
                  <RateTable
                    rateTableData={rateTableData}
                    NoOfDays={selectedNoOfDays}
                    memberId={Number(memberId)}
                    setSelectedRate={setSelectedRate}
                    actualDaysInWeek={actualDaysInWeek}
                    selectedCourseDayInWeek={Number(selectedCourseDayInWeek)}
                  />
                </TabsContent>

                <TabsContent value="batches" className="m-0 h-full w-full flex flex-col overflow-hidden outline-none">
                  <BatchTable batchData={batchTableData} />
                </TabsContent>
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
      </motion.div>
    </motion.div>
  );
}