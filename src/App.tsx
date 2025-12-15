import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./contexts/theme-context";
import { ConfirmationProvider } from "./contexts/confirmation-context";
import Layout from "./components/layout";
import Dashboard from "./pages/dashboard";
import Projects from "./pages/projects";
import EnumsPage from "./components/setting/enums/enums";
import { Toaster } from "./components/ui/toaster";
import LoginForm from "./components/login-form";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import { AuthProvider } from "./contexts/authContext";
import Setting from "./pages/setting";
import FamilyPage from "./pages/family";
import MemberPage from "./pages/member";
import FamilyTypePage from "@/components/setting/family-type/family-type";
import TeamCategoryPage from "@/components/setting/team-category/team-category";
import IdentityTypePage from "@/components/setting/identity-type/identity-type";
import ActivityPage from "@/components/setting/activity/activity";
import FacilityPage from "@/pages/facility";
import AreaPage from "@/pages/area";
import AcademyPage from "@/pages/academy";
import CoachPage from "@/pages/coach";
import AcademyCoachPage from "@/pages/academyCoach";
import CoachSkillPage from "@/pages/coachSkill";
import CoursePage from "@/pages/course";
import DiscountPage from "./pages/discount";
import BatchPage from "./pages/batch";
import EnrollmentPage from "./pages/enrollment";
import CourseChange from "./components/view/enrollment-actions/CourseChange";
import BatchChange from "./components/view/enrollment-actions/BatchChange";
import FreezeEnrollment from "./components/view/enrollment-actions/FreezeEnrollment";
import EnrollmentDashboard from "./components/view/enrollment-dashboard/enrollment-dashboard";
import AttendanceSheet from "./components/view/batch/attendance-sheet";
import DefreezeEnrollment from "./components/view/enrollment-actions/DefreezeEnrollment";
import DebitNote from "./pages/debitNote";
import PaymentPage from "./pages/payment";
import Billing from "./pages/billing";
import RefundFormModal from "./components/view/enrollment-actions/Refund";
import MembershipMasterPage from "./pages/membershipMaster";
import MembershipPage from "./pages/membership";
import StaffAttendance from "./pages/staff-attendance";
import MedicalBreak from "./components/view/enrollment-actions/MedicalBreak";
import BatchConnectionsPage from "./pages/batchConnection";
import CoachAssignmentsPage from "./pages/coachAssignment";
import FacilityAllotmentsPage from "./pages/facilityAllotment";
import EntityPage from "./pages/entity";
import AccountPage from "./pages/account";
import AccountMemberPage from "./pages/accountMember";
import MembershipLinkPage from "./pages/membership-link";
import CoursePackagePage from "./pages/course-package";
import CourseSharePage from "./pages/courseShare";

export default function App() {
  return (
    <ThemeProvider>
      <ConfirmationProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/404error" element={<NotFound />} />
            </Routes>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/enrollment-dashboard"
                  element={<EnrollmentDashboard />}
                />
                <Route path="/enrollment" element={<EnrollmentPage />} />
                <Route path="/account/accounts" element={<AccountPage />} />
                <Route
                  path="/account/account-member"
                  element={<AccountMemberPage />}
                />
                <Route
                  path="/enrollment/:id/course-change"
                  element={<CourseChange />}
                />
                <Route
                  path="/enrollment/:id/batch-change"
                  element={<BatchChange />}
                />
                <Route
                  path="/enrollment/:id/freeze-enrollment"
                  element={<FreezeEnrollment />}
                />
                <Route
                  path="/enrollment/:id/medical-extension"
                  element={<MedicalBreak />}
                />
                <Route
                  path="/enrollment/:id/defreeze-enrollment"
                  element={<DefreezeEnrollment />}
                />
                <Route
                  path="/enrollment/:id/refund"
                  element={<RefundFormModal />}
                />
                <Route path="/discount" element={<DiscountPage />} />
                <Route path="/projects" element={<Projects />} />
                <Route
                  path="/infrastructure-Configurations"
                  element={
                    <Navigate to="/infrastructure-configurations/facility" />
                  }
                />
                <Route
                  path="/infrastructure-configurations/facility-allotment"
                  element={<FacilityAllotmentsPage />}
                />
                <Route path="/member" element={<MemberPage />} />
                <Route path="/academy" element={<AcademyPage />} />
                <Route path="/staff-management/coach" element={<CoachPage />} />
                <Route
                  path="/staff-management/academy-coaches"
                  element={<AcademyCoachPage />}
                />
                <Route
                  path="/staff-management/coach-skills"
                  element={<CoachSkillPage />}
                />
                <Route
                  path="/staff-management/attendance"
                  element={<StaffAttendance />}
                />
                <Route
                  path="/staff-management/coach-assignment"
                  element={<CoachAssignmentsPage />}
                />
                <Route path="/course/courses" element={<CoursePage />} />
                <Route
                  path="course/course-share"
                  element={<CourseSharePage />}
                />
                <Route
                  path="/course/course-package"
                  element={<CoursePackagePage />}
                />
                <Route path="/batch/batches" element={<BatchPage />} />
                <Route
                  path="/batch/attendance-sheet/:id"
                  element={<AttendanceSheet />}
                />
                <Route
                  path="/batch/batch-connection"
                  element={<BatchConnectionsPage />}
                />
                <Route
                  path="/infrastructure-configurations/facility"
                  element={<FacilityPage />}
                />
                <Route
                  path="/infrastructure-configurations/area"
                  element={<AreaPage />}
                />
                <Route
                  path="/membership-master"
                  element={<MembershipMasterPage />}
                />
                <Route
                  path="/membership-registration"
                  element={<MembershipPage />}
                />
                <Route
                  path="/membership-link"
                  element={<MembershipLinkPage />}
                />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/debit-note" element={<DebitNote />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="/setting" element={<Setting />}>
                <Route path="/setting/entity" element={<EntityPage />} />
                <Route
                  path="/setting/family-type"
                  element={<FamilyTypePage />}
                />
                <Route
                  path="/setting/team-category"
                  element={<TeamCategoryPage />}
                />
                <Route
                  path="/setting/identity-type"
                  element={<IdentityTypePage />}
                />
                <Route path="/setting/activity" element={<ActivityPage />} />
                <Route path="/setting/common-lookups" element={<EnumsPage />} />
                <Route path="/setting/*" element={<NotFound />} />
              </Route>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<Signup />} />
            </Routes>
          </Router>
          <Toaster />
        </AuthProvider>
      </ConfirmationProvider>
    </ThemeProvider>
  );
}
