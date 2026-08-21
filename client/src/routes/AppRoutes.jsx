import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "../pages/Home"
import Login from "../pages/Login"
import Register from "../pages/Register"
import Dashboard from "../pages/Dashboard"
import NotFound from "../pages/NotFound"
import ProtectedRoute from "./ProtectedRoute"
import RoleRoute from "./RoleRoute"
import Layout from "../components/Layout"

import FeedbackList from "../pages/volunteer/FeedbackList"
import FeedbackForm from "../pages/volunteer/FeedbackForm"
import MyFeedback from "../pages/volunteer/MyFeedback"
import FeedbackConfirmation from "../pages/volunteer/FeedbackConfirmation"

import AdminUsers from "../pages/admin/AdminUsers"
import AdminActivities from "../pages/admin/AdminActivities"
import AdminForms from "../pages/admin/AdminForms"
import AdminInsights from "../pages/admin/AdminInsights"

import SpocDashboard from "../pages/spoc/SpocDashboard"

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Volunteer. Submission itself is additionally gated server-side
                by requireVerifiedVolunteer. */}
            <Route element={<RoleRoute allow={["volunteer"]} />}>
              <Route path="/feedback" element={<FeedbackList />} />
              <Route path="/feedback/mine" element={<MyFeedback />} />
              <Route path="/feedback/confirmation/:id" element={<FeedbackConfirmation />} />
              <Route path="/feedback/:formId" element={<FeedbackForm />} />
            </Route>

            <Route element={<RoleRoute allow={["admin"]} />}>
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/activities" element={<AdminActivities />} />
              <Route path="/admin/forms" element={<AdminForms />} />
              <Route path="/admin/insights" element={<AdminInsights />} />
            </Route>

            <Route element={<RoleRoute allow={["spoc", "admin"]} />}>
              <Route path="/spoc" element={<SpocDashboard />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
