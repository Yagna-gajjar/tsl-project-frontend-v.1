import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronUp, ChevronDown, X } from "lucide-react"
import BottomSection from "./bottom-section"
import { Button } from "@/components/ui/button"
import RateTable from "./panel/rate-table"
import BatchTable from "./panel/batch-table" // Added BatchTable import
import EnrollmentFormNew from "./enrollment-form-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Added Tabs components
import type { CourseRate } from "@/types/courseRate"

export default function EnrollmentDashboard() {
  const [middleview] = useState<any>(null)
  const [rateTableData, setRateTableData] = useState<any>(null)
  const [batchTableData, setBatchTableData] = useState<any>([]) // State for batch data
  const [memberId, setMemberId] = useState<number>();
  const [selectedRate, setSelectedRate] = useState<CourseRate>();

  const [topHeight, setTopHeight] = useState(100)
  const [isDraggingY, setIsDraggingY] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const [panelWidth, setPanelWidth] = useState(0)
  const [isDraggingX, setIsDraggingX] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const [enableCourseView, setEnableCourseView] = useState(false);

  const [selectedNoOfDays, setSelectedNoOfDays] = useState(0);

  const [actualDaysInWeek, setActualDaysInWeek] = useState(0);
  const [selectedCourseDayInWeek, setSelectedCourseDayInWeek] = useState();

  const handleMouseDownY = () => {
    if (!isExpanded) setIsDraggingY(true)
    document.body.style.userSelect = "none"
  }
  const handleMouseDownX = () => {
    setIsDraggingX(true)
    document.body.style.userSelect = "none"
  }

  const handleMouseUp = () => {
    setIsDraggingY(false)
    setIsDraggingX(false)
    document.body.style.userSelect = "auto"
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()

    if (isDraggingY && !isExpanded) {
      const newHeight = ((e.clientY - rect.top) / rect.height) * 100
      if (newHeight > 20 && newHeight < 85) setTopHeight(newHeight)
    }

    if (isDraggingX) {
      const mouseXFromRight = rect.right - e.clientX
      const newWidthPercent = (mouseXFromRight / rect.width) * 100
      if (newWidthPercent > 5 && newWidthPercent < 80) setPanelWidth(newWidthPercent)
    }
  }

  const togglePanel = () => {
    if (!isOpen) {
      setPanelWidth(90)
      setIsOpen(true)
    } else {
      setPanelWidth(0)
      setIsOpen(false)
    }
  }

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
            <EnrollmentFormNew
              setSelectedNoOfDays={setSelectedNoOfDays}
              setEnableCourseView={setEnableCourseView}
              setRateTableData={setRateTableData}
              setBatchTableData={setBatchTableData}
              setMemberId={setMemberId}
              selectedRate={selectedRate}
              setActualDaysInWeek={setActualDaysInWeek}
              setSelectedCourseDayInWeek={setSelectedCourseDayInWeek}
            />
          </div>
        </motion.div>

        <div
          className="relative w-full h-10 flex justify-center items-center cursor-ns-resize z-30 group"
          onMouseDown={handleMouseDownY}
        >
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-1 h-8 px-4 rounded-full z-20 gap-2 shadow-lg"
            variant="secondary"
          >
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
        {enableCourseView && <div
          className="absolute left-0 top-0 h-full w-10 -translate-x-full flex items-center justify-center cursor-ew-resize group"
          onMouseDown={handleMouseDownX}
        >
          <Button
            onClick={togglePanel}
            className="rotate-[-90deg] py-1 h-8 px-4 rounded-full z-20 gap-2 shadow-lg"
          >
            <span className="text-xs font-bold"> {panelWidth > 5 ? "HIDE RATES" : "VIEW RATES"}</span>
            {panelWidth > 5 ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <div className="absolute w-[1px] h-[80vh] bg-border group-hover:bg-primary/40 top-1/2 -translate-y-1/2" />
        </div>}

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <Tabs defaultValue="rates" className="w-full">
              <div className="flex  items-center justify-between">
                <TabsList className="grid grid-cols-2 ">
                  <TabsTrigger value="rates">COURSE DATA</TabsTrigger>
                  <TabsTrigger value="batches">BATCH DATA</TabsTrigger>
                </TabsList>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setPanelWidth(0)
                    setIsOpen(false)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Change h-[50vh] to something more flexible or larger like h-[calc(100vh-150px)] */}
              <div className="flex-1 overflow-hidden h-[80vh] py-4">
                <TabsContent value="rates" className="m-0 h-full"> {/* Added h-full */}
                  <RateTable
                    rateTableData={rateTableData}
                    NoOfDays={selectedNoOfDays}
                    memberId={Number(memberId)}
                    setSelectedRate={setSelectedRate}
                    actualDaysInWeek={actualDaysInWeek}
                    selectedCourseDayInWeek={Number(selectedCourseDayInWeek)}
                  />
                </TabsContent>
                <TabsContent value="batches" className="m-0 h-full"> {/* Added h-full */}
                  <BatchTable batchData={batchTableData} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
