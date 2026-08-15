import { type Process1Result } from "@/helpers/enrollment-change/process1";
import type { Activity } from "@/types/activity";
import type { EnrollmentData } from "@/types/enrollment";
import type { Transaction } from "@/types/transaction";
import { createContext, useCallback, useContext, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const TAB_ORDER = ["member", "course", "courseRate", "batch", "bill", "confirm"]
type TabValue = (typeof TAB_ORDER)[number]

type EnrDashTabsType = {
  currentTabIndex: number,
  setCurrentTabIndex: Dispatch<SetStateAction<number>>,
  completedTabs: Set<TabValue>,
  setCompletedTabs: Dispatch<SetStateAction<Set<string>>>,
  handleTabChange: (newTabValue: string) => void,
  handleBack: () => void,
  handleNext: (state?: {
    enrollmentId: number,
    firstEnrPattern: number | undefined,
    firstEnrPatternDays: number,
    activity: Activity,
    actionType: string,
    enrollmentData: EnrollmentData,
    existingEnrollment: EnrollmentData,
    newVersion: EnrollmentData,
    newEnrollment: EnrollmentData,
  }) => void
}

const EnrDashTabsContext = createContext<EnrDashTabsType | undefined>(undefined);

export const EnrDashTabsProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTabIndex, setCurrentTabIndex] = useState<number>(0);
  const [completedTabs, setCompletedTabs] = useState<Set<TabValue>>(new Set());
  const location = useLocation()
  const navigate = useNavigate()
  const handleTabChange = useCallback((newTabValue: string) => {
    const newIndex = TAB_ORDER.indexOf(newTabValue as TabValue)
    setCurrentTabIndex(newIndex)
  }, [])
  const handleBack = useCallback(() => {
    if (currentTabIndex > 0) {
      setCurrentTabIndex(currentTabIndex - 1)
    }
  }, [currentTabIndex])

  const type = location.state?.type;

  const handleNext = useCallback(
    async (state?: {
      enrollmentId: number,
      firstEnrPattern: number | undefined,
      firstEnrPatternDays: number,
      activity: Activity,
      actionType: string,
      enrollmentData: EnrollmentData,
      existingEnrollment: EnrollmentData,
      newVersion: EnrollmentData,
      newEnrollment: EnrollmentData,
    }) => {
      if (currentTabIndex === 2 && type === "CHANGE_COURSE") {
        navigate("/enrollment/change", {
          state: { ...state },
        });
        return;
      }

      setCurrentTabIndex((prev) => prev + 1);
    },
    [currentTabIndex, type, navigate]
  );

  const value = useMemo<EnrDashTabsType>(
    () => ({
      TAB_ORDER,
      currentTabIndex,
      setCurrentTabIndex,
      completedTabs,
      setCompletedTabs,
      handleTabChange,
      handleBack,
      handleNext
    }),
    [currentTabIndex, setCurrentTabIndex, completedTabs, setCompletedTabs, handleTabChange, handleBack, handleNext]
  )

  return <EnrDashTabsContext.Provider value={value}>{children}</EnrDashTabsContext.Provider>

}

export const useEnrDashTabs = () => {
  const context = useContext(EnrDashTabsContext);
  if (!context) {
    throw new Error("useEnrDashTabs must be used within an EnrollmentProvider")
  }
  return context
}

type EnrollmentType = {
  enrollmentData: EnrollmentData | undefined,
  setEnrollmentData: Dispatch<SetStateAction<EnrollmentData | undefined>>,
  changeVersions: Process1Result | undefined,
  setChangeVersions: Dispatch<SetStateAction<Process1Result | undefined>>,
  transactionData: Transaction | undefined,
  setTransactionData: Dispatch<SetStateAction<Transaction | undefined>>,
  updateEnrollmentData: (data: Partial<EnrollmentData>, tabKey?: TabValue) => void,
  balance: number,
  setbalance: Dispatch<SetStateAction<number>>
}

const EnrollmentContext = createContext<EnrollmentType | undefined>(undefined);

export const EnrollmentProvider = ({ children }: { children: React.ReactNode }) => {
  const { setCompletedTabs, setCurrentTabIndex } = useEnrDashTabs();

  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>();
  const [changeVersions, setChangeVersions] = useState<Process1Result>();
  const [transactionData, setTransactionData] = useState<Transaction>();
  const [balance, setbalance] = useState<number>(0);

  const updateEnrollmentData = useCallback((data: Partial<EnrollmentData>, tabKey?: TabValue) => {
    setEnrollmentData((prev) => ({
      ...(prev ?? {}),
      ...data,
    } as EnrollmentData))

    if (tabKey) {
      setCompletedTabs((prev) => new Set([...prev, tabKey]))
    }

    if (data.enrollmentId) {
      setCurrentTabIndex(2);
    }
  }, [setEnrollmentData, setCompletedTabs, setCurrentTabIndex])

  const value = useMemo<EnrollmentType>(
    () => ({
      enrollmentData,
      setEnrollmentData,
      changeVersions,
      setChangeVersions,
      transactionData,
      setTransactionData,
      updateEnrollmentData,
      balance,
      setbalance
    }),
    [enrollmentData, setEnrollmentData, changeVersions, setChangeVersions, transactionData, setTransactionData, updateEnrollmentData, balance, setbalance]
  )

  return <EnrollmentContext.Provider value={value}>{children}</EnrollmentContext.Provider>
}

export const useEnrollment = () => {
  const context = useContext(EnrollmentContext);
  if (!context) {
    throw new Error("useEnrollment must be used within an EnrollmentProvider")
  }
  return context
}