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
import LoginForm from "./components/login-form";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import { AuthProvider } from "./contexts/authContext";
import Setting from "./pages/setting";
import MemberPage from "./pages/member";
import FamilyTypePage from "@/components/setting/family-type/family-type";
import TeamCategoryPage from "@/components/setting/team-category/team-category";
import IdentityTypePage from "@/components/setting/identity-type/identity-type";
import ActivityPage from "@/components/setting/activity/activity";
import FacilityPage from "@/pages/facility";
import AreaPage from "@/pages/area";
import CoachSkillPage from "@/pages/coachSkill";
import CoursePage from "@/pages/course";
import BatchPage from "./pages/batch";
import EnrollmentPage from "./pages/enrollment";
import AttendanceSheet from "./components/view/batch/attendance-sheet";
import RefundFormModal from "./components/view/enrollment-actions/Refund";
import MembershipMasterPage from "./pages/membershipMaster";
import MembershipPage from "./pages/membership";
import StaffAttendance from "./pages/staff-attendance";
import CoachAssignmentsPage from "./pages/coachAssignment";
import FacilityAllotmentsPage from "./pages/facilityAllotment";
import EntityPage from "./pages/entity";
import AccountPage from "./pages/account";
import AccountMemberPage from "./pages/accountMember";
import MembershipLinkPage from "./pages/membership-link";
import CoursePackagePage from "./pages/course-package";
import CourseSharePage from "./pages/courseShare";
import CourseRatePage from "./pages/course-rate";
import AuthorityPage from "./pages/authority";
import TransactionPage from "./pages/transaction";
import AccessAndDetails from "./pages/access-details";
import UserAccessPage from "./components/view/user/UserAccessPage";
import StatusVisible from "./pages/status-visible";
import { EnrollmentFlow } from "./components/view/enrollment-dashboard/enrollment-flow";
import ChangeEnrollment from "./pages/Change";
import Ledger from "./pages/ledger";
import ProfilePage from "./pages/profile";
import TrialBalancePage from "./components/view/transaction/transaction-trialbalance";
import IncidentReportingPage from "./pages/incidentReport";
import AuditLogsPage from "./pages/audit-logs";
import { EnrDashTabsProvider, EnrollmentProvider } from "./contexts/enrollmentContext";
import BatchChangeBulk from "./components/view/batch/batch-change-bulk";
export default function App() {
  return (
    <ThemeProvider>
      <ConfirmationProvider>
        <AuthProvider>
          <Router>
            <EnrDashTabsProvider>
              <EnrollmentProvider>
                <Routes>
                  <Route path="/404error" element={<NotFound />} />
                </Routes>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route
                      path="/enrollment-dashboard"
                      element={<EnrollmentFlow />}
                    />
                    {/* <Route
                  path="/enrollment-dashboard"
                  element={<EnrollmentDashboard />}
                /> */}
                    <Route path="/enrollment" element={<EnrollmentPage />} />
                    <Route path="/enrollment/change" element={<ChangeEnrollment />} />
                    <Route path="/account/authority" element={<AuthorityPage />} />
                    <Route path="/account/accounts" element={<AccountPage />} />
                    <Route
                      path="/account/account-member"
                      element={<AccountMemberPage />}
                    />
                    {/* <Route
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
                /> */}
                    <Route
                      path="/enrollment/:id/refund"
                      element={<RefundFormModal />}
                    />
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
                    <Route path="/account/member" element={<MemberPage />} />
                    <Route
                      path="/staff-management/access-details"
                      element={<AccessAndDetails />}
                    />
                    <Route
                      path="/staff-management/user-access"
                      element={<UserAccessPage />}
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
                    <Route
                      path="/course/course-rate"
                      element={<CourseRatePage />}
                    />
                    <Route path="/batches" element={<BatchPage />} />
                    <Route path="/batches/batch-change-bulk" element={<BatchChangeBulk />} />
                    <Route
                      path="/batch/attendance-sheet/:id"
                      element={<AttendanceSheet />}
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
                      path="/membership/membership-master"
                      element={<MembershipMasterPage />}
                    />
                    <Route
                      path="/membership/membership-registration"
                      element={<MembershipPage />}
                    />
                    <Route
                      path="/membership/membership-link"
                      element={<MembershipLinkPage />}
                    />
                    <Route path="/finance/transaction" element={<TransactionPage />} />
                    <Route path="/finance/ledger" element={<Ledger />} />
                    <Route path="/finance/trialbalance" element={<TrialBalancePage />} />
                    <Route path="/incident-reporting" element={<IncidentReportingPage />} />
                    <Route path="/audit-logs" element={<AuditLogsPage />} />

                    <Route path="*" element={<NotFound />} />
                  </Route >
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
                    <Route
                      path="/setting/status"
                      element={<StatusVisible />}
                    />
                    <Route path="/setting/activity" element={<ActivityPage />} />
                    <Route path="/setting/common-lookups" element={<EnumsPage />} />
                    <Route path="/setting/*" element={<NotFound />} />
                  </Route>
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/signup" element={<Signup />} />
                </Routes >
              </EnrollmentProvider >
            </EnrDashTabsProvider >
          </Router >
        </AuthProvider >
      </ConfirmationProvider >
    </ThemeProvider >
  );
}
