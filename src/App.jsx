import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { LanguageProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/ThemeContext';
// Add page imports here
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import AdminLayout from '@/components/AdminLayout';
// import LaunchCurtain from '@/components/LaunchCurtain';
import GarbaVideoPopup from '@/components/GarbaVideoPopup'; // GARBA PROMO — see removal notes in that file

// Pages are lazy-loaded per route so the initial bundle only ships the
// shell + whichever page is actually visited, instead of all ~37 pages.
const Home = lazy(() => import('@/pages/Home'));
const About = lazy(() => import('@/pages/About'));
const Events = lazy(() => import('@/pages/Events'));
const FamilyRegistration = lazy(() => import('@/pages/FamilyRegistration'));
const ApplicationStatus = lazy(() => import('@/pages/ApplicationStatus'));
const VerifyMember = lazy(() => import('@/pages/VerifyMember'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const MemberDashboard = lazy(() => import('@/pages/MemberDashboard'));
const MyFamily = lazy(() => import('@/pages/MyFamily'));
const MemberEvents = lazy(() => import('@/pages/MemberEvents'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Settings = lazy(() => import('@/pages/Settings'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminApplications = lazy(() => import('@/pages/AdminApplications'));
const AdminFamilies = lazy(() => import('@/pages/AdminFamilies'));
const AdminEvents = lazy(() => import('@/pages/AdminEvents'));
const AdminTransactions = lazy(() => import('@/pages/AdminTransactions'));
const AdminNotifications = lazy(() => import('@/pages/AdminNotifications'));
const AdminSettings = lazy(() => import('@/pages/AdminSettings'));
const Rules = lazy(() => import('@/pages/Rules'));
const AdminRules = lazy(() => import('@/pages/AdminRules'));
const Principles = lazy(() => import('@/pages/Principles'));
const AdminPrinciples = lazy(() => import('@/pages/AdminPrinciples'));
const AdminSamiti = lazy(() => import('@/pages/AdminSamiti'));
const StudentRegistration = lazy(() => import('@/pages/StudentRegistration'));
const AdminStudents = lazy(() => import('@/pages/AdminStudents'));
const AdminEventRegistrations = lazy(() => import('@/pages/AdminEventRegistrations'));
const Feedback = lazy(() => import('@/pages/Feedback'));
const AdminFeedback = lazy(() => import('@/pages/AdminFeedback'));
const AdminTransferRequests = lazy(() => import('@/pages/AdminTransferRequests'));
const Help = lazy(() => import('@/pages/Help'));
const News = lazy(() => import('@/pages/News'));
const AdminNews = lazy(() => import('@/pages/AdminNews'));

const RouteLoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/events" element={<Events />} />
      <Route path="/register" element={<FamilyRegistration />} />
      <Route path="/student-register" element={<StudentRegistration />} />
      <Route path="/application-status" element={<ApplicationStatus />} />
      <Route path="/verify/:familyId" element={<VerifyMember />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/principles" element={<Principles />} />
      <Route path="/help" element={<Help />} />
      <Route path="/news" element={<News />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register-account" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Member portal (protected) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/portal" element={<MemberDashboard />} />
          <Route path="/portal/family" element={<MyFamily />} />
          <Route path="/portal/events" element={<MemberEvents />} />
          <Route path="/portal/notifications" element={<Notifications />} />
          <Route path="/portal/settings" element={<Settings />} />
          <Route path="/portal/feedback" element={<Feedback />} />
        </Route>
      </Route>

      {/* Admin portal (protected, admin role only) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} requireRole="admin" unauthorizedElement={<Navigate to="/portal" replace />} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
          <Route path="/admin/families" element={<AdminFamilies />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/transactions" element={<AdminTransactions />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/rules" element={<AdminRules />} />
          <Route path="/admin/principles" element={<AdminPrinciples />} />
          <Route path="/admin/samiti" element={<AdminSamiti />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/event-registrations" element={<AdminEventRegistrations />} />
          <Route path="/admin/transfers" element={<AdminTransferRequests />} />
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/news" element={<AdminNews />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <>
      <ThemeProvider>
        {/* <LaunchCurtain /> */}
        <GarbaVideoPopup /> {/* GARBA PROMO — see removal notes in GarbaVideoPopup.jsx */}
        <AuthProvider>
          <LanguageProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router>
                <ScrollToTop />
                <AuthenticatedApp />
              </Router>
              <Toaster />
            </QueryClientProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  )
}

export default App