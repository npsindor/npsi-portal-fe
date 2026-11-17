import { lazy, Suspense, useRef } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import RouteTitle from '@/components/RouteTitle';
import { LanguageProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/ThemeContext';
// Add page imports here
import ProtectedRoute from '@/components/ProtectedRoute';
import { safeReturnTo } from '@/lib/authReturnTo';
import Layout from '@/components/Layout';
import AdminLayout from '@/components/AdminLayout';
// import LaunchCurtain from '@/components/LaunchCurtain';

// Pages are lazy-loaded per route so the initial bundle only ships the
// shell + whichever page is actually visited, instead of all ~37 pages.
const Sagun = lazy(() => import('@/pages/Sagun'));
const MyRoomHunting = lazy(() => import('@/pages/MyRoomHunting'));
const SearchResults = lazy(() => import('@/pages/SearchResults'));
const AdminRoomHunting = lazy(() => import('@/pages/AdminRoomHunting'));
const AdminSagunCards = lazy(() => import('@/pages/AdminSagunCards'));
const SagunVerify = lazy(() => import('@/pages/SagunVerify'));
const EventPage = lazy(() => import('@/pages/EventPage'));
const CoreTeam = lazy(() => import('@/pages/CoreTeam'));
const AdminEventMembers = lazy(() => import('@/pages/AdminEventMembers'));
const TeamPage = lazy(() => import('@/pages/TeamPage'));
const AdminTransportation = lazy(() => import('@/pages/AdminTransportation'));
const SehatSaathi = lazy(() => import('@/pages/SehatSaathi'));
const SafarSaathi = lazy(() => import('@/pages/SafarSaathi'));
const RoomHunting = lazy(() => import('@/pages/RoomHunting'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const CommunityServices = lazy(() => import('@/pages/CommunityServices'));
const Careers = lazy(() => import('@/pages/Careers'));
const AdminPageContent = lazy(() => import('@/pages/AdminPageContent'));
const Home = lazy(() => import('@/pages/Home'));
const About = lazy(() => import('@/pages/About'));
const Events = lazy(() => import('@/pages/Events'));
const ApplicationStatus = lazy(() => import('@/pages/ApplicationStatus'));
const VerifyMember = lazy(() => import('@/pages/VerifyMember'));
const Login = lazy(() => import('@/pages/Login'));
const PortalRegistration = lazy(() => import('@/pages/PortalRegistration'));
const StudentRegistration = lazy(() => import('@/pages/StudentRegistration'));
const AdminRegistrationPayments = lazy(() => import('@/pages/AdminRegistrationPayments'));
const AdminAddressOptions = lazy(() => import('@/pages/AdminAddressOptions'));
const AdminHomeHighlights = lazy(() => import('@/pages/AdminHomeHighlights'));
const AdminCommunityServices = lazy(() => import('@/pages/AdminCommunityServices'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const MemberDashboard = lazy(() => import('@/pages/MemberDashboard'));
const MyFamily = lazy(() => import('@/pages/MyFamily'));
const MemberEvents = lazy(() => import('@/pages/MemberEvents'));
const MemberEventKharcha = lazy(() => import('@/pages/MemberEventKharcha'));
const AdminEventFinance = lazy(() => import('@/pages/AdminEventFinance'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Settings = lazy(() => import('@/pages/Settings'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminApplications = lazy(() => import('@/pages/AdminApplications'));
const AdminFamilies = lazy(() => import('@/pages/AdminFamilies'));
const AdminEvents = lazy(() => import('@/pages/AdminEvents'));
const AdminTransactions = lazy(() => import('@/pages/AdminTransactions'));
const AdminNotifications = lazy(() => import('@/pages/AdminNotifications'));
const AdminSettings = lazy(() => import('@/pages/AdminSettings'));
const AdminRules = lazy(() => import('@/pages/AdminRules'));
const AdminPrinciples = lazy(() => import('@/pages/AdminPrinciples'));
const AdminSamiti = lazy(() => import('@/pages/AdminSamiti'));
const AdminSeniorDisciplineCommittee = lazy(() => import('@/pages/AdminSeniorDisciplineCommittee'));
const AdminStudents = lazy(() => import('@/pages/AdminStudents'));
const AdminEventRegistrations = lazy(() => import('@/pages/AdminEventRegistrations'));
const Feedback = lazy(() => import('@/pages/Feedback'));
const AdminContactInfo = lazy(() => import('@/pages/AdminContactInfo'));
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
  const { isLoadingAuth } = useAuth();

  // Show a loading spinner while checking who is logged in.
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:slug" element={<EventPage />} />
      <Route path="/core-team" element={<CoreTeam />} />
      <Route path="/teams/:key" element={<TeamPage />} />
      {/* Registration is account-first now: sign up with mobile OTP, then register (with payment) in the portal. */}
      <Route path="/register" element={<RegistrationEntry />} />
      <Route path="/student-register" element={<StudentRegistration />} />
      <Route path="/application-status" element={<ApplicationStatus />} />
      {/* Family ids are sequential: verifying a card needs a login so nobody can list every family. */}
      <Route element={<ProtectedRoute unauthenticatedElement={<LoginRedirect />} />}>
        <Route path="/verify/:familyId" element={<VerifyMember />} />
      </Route>
      <Route path="/rules" element={<Navigate to="/about#rules" replace />} />
      <Route path="/principles" element={<Navigate to="/about#principles" replace />} />
      <Route path="/help" element={<Help />} />
      <Route path="/news" element={<News />} />

      <Route path="/transportation" element={<SafarSaathi />} />
      <Route path="/medical" element={<SehatSaathi />} />
      <Route path="/room-hunting" element={<RoomHunting />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/community-services" element={<CommunityServices />} />
      <Route path="/career-business" element={<Careers />} />
      <Route path="/sagun" element={<Sagun />} />
      <Route path="/sagun/verify/:token" element={<SagunVerify />} />
      <Route path="/sagun/workspace" element={<Sagun workspace />} />
      <Route path="/contact" element={<CommunityPage kind="contact" />} />
      <Route path="/public-feedback" element={<CommunityPage kind="feedback" />} />
      {/* Auth routes */}
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register-account" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Member portal (protected) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<LoginRedirect />} />}>
        <Route element={<Layout />}>
          <Route path="/portal" element={<MemberDashboard />} />
          <Route path="/portal/registration" element={<PortalRegistration />} />
          <Route path="/portal/family" element={<FamilyOnly><MyFamily /></FamilyOnly>} />
          <Route path="/portal/events" element={<MemberEvents />} />
          <Route path="/portal/event-kharcha" element={<FamilyOnly><MemberEventKharcha /></FamilyOnly>} />
          <Route path="/portal/room-hunting" element={<MyRoomHunting />} />
          <Route path="/portal/notifications" element={<Notifications />} />
          <Route path="/portal/settings" element={<Settings />} />
          <Route path="/portal/feedback" element={<Feedback />} />
        </Route>
      </Route>

      {/* Admin portal (protected, admin role only) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<LoginRedirect />} requireRole="admin" unauthorizedElement={<Navigate to="/portal" replace />} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
          <Route path="/admin/families" element={<AdminFamilies />} />
          <Route path="/admin/sagun" element={<Sagun admin />} />
          <Route path="/admin/sehat-saathi" element={<SehatSaathi admin />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/event-finance" element={<AdminEventFinance />} />
          <Route path="/admin/transactions" element={<AdminTransactions />} />
          <Route path="/admin/registration-payments" element={<AdminRegistrationPayments />} />
          <Route path="/admin/address-options" element={<AdminAddressOptions />} />
          <Route path="/admin/home-highlights" element={<AdminHomeHighlights />} />
          <Route path="/admin/community-services" element={<AdminCommunityServices />} />
          <Route path="/admin/page-content" element={<AdminPageContent />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/rules" element={<AdminRules />} />
          <Route path="/admin/principles" element={<AdminPrinciples />} />
          <Route path="/admin/samiti" element={<AdminSamiti />} />
          <Route path="/admin/senior-discipline-committee" element={<AdminSeniorDisciplineCommittee />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/event-registrations" element={<AdminEventRegistrations />} />
          <Route path="/admin/transfers" element={<AdminTransferRequests />} />
          <Route path="/admin/contact-info" element={<AdminContactInfo />} />
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/news" element={<AdminNews />} />
          <Route path="/admin/room-hunting" element={<AdminRoomHunting />} />
          <Route path="/admin/sagun-cards" element={<AdminSagunCards />} />
          <Route path="/admin/event-members" element={<AdminEventMembers />} />
          {/* The old Core Team admin page: Core Team members are managed with every other team now. */}
          <Route path="/admin/core-team" element={<Navigate to="/admin/event-members?section=CORE_TEAM" replace />} />
          <Route path="/admin/transportation" element={<AdminTransportation />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


// Family pages are not part of a Student account's portal (the API refuses their data anyway): a direct URL goes
// back to the dashboard. The account type comes from the server (/auth/me), never from browser storage.
function FamilyOnly({ children }) {
  const { user } = useAuth();
  return user?.account?.type === 'STUDENT' ? <Navigate to="/portal" replace /> : children;
}

// Protected pages send logged-out visitors to /login and bring them back afterwards.
function LoginRedirect() {
  const location = useLocation();
  return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
}

// Login and sign-up are for visitors: someone already logged in goes on to where they were heading
// (a safe ?returnTo=), else to their portal. Decided once, when the session check finishes, so a
// login completing on this page keeps its own redirect.
function GuestOnly({ children }) {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  const decision = useRef(null);
  if (isLoadingAuth && decision.current === null) return null;
  if (decision.current === null) {
    const returnTo = safeReturnTo();
    decision.current = isAuthenticated ? (returnTo !== '/' ? returnTo : user?.role === 'admin' ? '/admin' : '/portal') : '';
  }
  return decision.current ? <Navigate to={decision.current} replace /> : children;
}

// The old public registration links: members register from their account now.
function RegistrationEntry() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return null;
  return <Navigate to={isAuthenticated ? '/portal/registration' : '/register-account'} replace />;
}

function App() {

  return (
    <>
      <ThemeProvider>
        {/* <LaunchCurtain /> */}
        <AuthProvider>
          <LanguageProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <ScrollToTop />
                <RouteTitle />
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
