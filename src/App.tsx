import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "./contexts/theme-context"
import { ConfirmationProvider } from "./contexts/confirmation-context"
import Layout from "./components/layout"
import Dashboard from "./pages/dashboard"
import Projects from "./pages/projects"
import Billing from "./pages/billing"
import Reports from "./pages/reports"
import Payments from "./pages/payments"
import { Toaster } from "./components/ui/toaster"
import LoginForm from "./components/login-form"
import NotFound from "./pages/NotFound"
import Signup from "./pages/Signup"
import { AuthProvider } from "./contexts/authContext";
import PageNotFound from "./pages/NotFound"
import FamilyTable from "./pages/family";
import Settingt from "./pages/setting";
import FamilyTypeTable from "./components/setting/family-type/family-typa-table";
import TeamCategoryTable from "./components/setting/team-category/team-category-table";
import IdentityTypeTable from "./components/setting/identity-type/identity-type-table";
import MemberTable from "./pages/member"

export default function App() {
  return (
    <ThemeProvider>
      <ConfirmationProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/404error" element={<PageNotFound />} />
            </Routes>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/family" element={<FamilyTable />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/member" element={<MemberTable />} />
                <Route path="/academy" element={<Billing />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="/setting" element={<Settingt />}>
                <Route
                  path="/setting/family-type"
                  element={<FamilyTypeTable />}
                />
                <Route
                  path="/setting/team-category"
                  element={<TeamCategoryTable />}
                />
                <Route
                  path="/setting/identity-type"
                  element={<IdentityTypeTable />}
                />
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
