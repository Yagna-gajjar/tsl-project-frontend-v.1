import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "./contexts/theme-context"
import { ConfirmationProvider } from "./contexts/confirmation-context"
import Layout from "./components/layout"
import Dashboard from "./pages/dashboard"
import Projects from "./pages/projects"
import EnumsPage from "./components/setting/enums/enums";
import Reports from "./pages/reports";
import Payments from "./pages/payments";
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
import EnrollmentDashborad from "./pages/enrollment-dashboard";
import EnrollmentDashBoardPage from "./pages/enrollment-dashboard"
import EnrollmentPage from "./pages/enrollment"
import CourseChange from "./components/view/enrollment-actions/CourseChange"

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
                <Route path="/enrollment-dashboard" element={<EnrollmentDashBoardPage />} />
                <Route path="/family" element={<FamilyPage />} />
                <Route path="/enrollment" element={<EnrollmentPage />} />
                <Route path="/enrollment/:id/course-change" element={<CourseChange />} />
                <Route path="/discount" element={<DiscountPage />} />
                <Route path="/projects" element={<Projects />} />
                <Route
                  path="/infrastructure-Configurations"
                  element={
                    <Navigate to="/infrastructure-configurations/facility" />
                  }
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
                <Route path="/courses" element={<CoursePage />} />
                <Route path="/batch" element={<BatchPage />} />
                <Route
                  path="/infrastructure-configurations/facility"
                  element={<FacilityPage />}
                />
                <Route
                  path="/infrastructure-configurations/area"
                  element={<AreaPage />}
                />
                <Route path="/reports" element={<Reports />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/enrollment_dashboard"
                  element={<EnrollmentDashborad />}
                />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="/setting" element={<Setting />}>
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
            </Routes>
          </Router>
          <Toaster />
        </AuthProvider>
      </ConfirmationProvider>
    </ThemeProvider>
  );
}
