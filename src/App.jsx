import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Classroom from "./pages/Classroom";
import Admin from "./pages/Admin";
import CourseDetail from "./pages/CourseDetail";
import Checkout from "./pages/Checkout";
import {
  CheckoutStatusPage,
  ForgotPasswordPage,
  LegalInfoPage,
  ResetPasswordPage,
} from "./pages/AccountSupportPages";
import {
  AboutPage,
  BundlesMembershipPage,
  ContactPage,
  CoursesPage,
  FreeCourseLessonPage,
  FaqPage,
  FreeMiniCoursePage,
  ShowcaseProjectPage,
  ShowcasePage,
} from "./pages/PublicPages";
import {
  AssignmentsPage,
  AssignmentDetailPage,
  CurriculumPage,
  FeedbackPage,
  MyCoursesPage,
  MyShowcasePage,
  NotificationsPage,
  OrdersPage,
  ProfilePage,
  StudentRoute,
  ThemeSheetPage,
} from "./pages/StudentPages";

function App() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);
  const inStudentPlatform = [
    "/app",
    "/dashboard",
    "/app/courses",
    "/app/assignments",
    "/app/feedback",
    "/app/theme-sheet",
    "/app/showcase",
    "/app/notifications",
    "/app/settings",
    "/app/billing",
    "/my-courses",
    "/curriculum/",
    "/classroom/",
    "/assignments",
    "/theme-sheet",
    "/feedback",
    "/my-showcase",
    "/notifications",
    "/profile",
    "/orders",
  ].some((path) => location.pathname.startsWith(path));
  const inClassroom =
    location.pathname.startsWith("/classroom")
    || location.pathname.startsWith("/app/learn/")
    || location.pathname.startsWith("/admin");

  return (
    <>
      {!inStudentPlatform && !inClassroom && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/bundles-membership" element={<BundlesMembershipPage />} />
        <Route path="/plans" element={<BundlesMembershipPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="/showcase/:projectSlug" element={<ShowcaseProjectPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/free-mini-course" element={<FreeMiniCoursePage />} />
        <Route path="/free-course" element={<FreeMiniCoursePage />} />
        <Route path="/free-course/lesson/:lessonNumber" element={<FreeCourseLessonPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/support" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/terms" element={<LegalInfoPage document="terms" />} />
        <Route path="/privacy" element={<LegalInfoPage document="privacy" />} />
        <Route path="/refund-policy" element={<LegalInfoPage document="refund" />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/status" element={<CheckoutStatusPage />} />
        <Route path="/app" element={<StudentRoute><Dashboard /></StudentRoute>} />
        <Route path="/dashboard" element={<StudentRoute><Dashboard /></StudentRoute>} />
        <Route path="/app/courses" element={<StudentRoute><MyCoursesPage /></StudentRoute>} />
        <Route path="/app/courses/:courseId" element={<StudentRoute><CurriculumPage /></StudentRoute>} />
        <Route path="/app/assignments" element={<StudentRoute><AssignmentsPage /></StudentRoute>} />
        <Route path="/app/assignments/:assignmentId" element={<StudentRoute><AssignmentDetailPage /></StudentRoute>} />
        <Route path="/app/theme-sheet" element={<StudentRoute><ThemeSheetPage /></StudentRoute>} />
        <Route path="/app/showcase" element={<StudentRoute><MyShowcasePage /></StudentRoute>} />
        <Route path="/app/notifications" element={<StudentRoute><NotificationsPage /></StudentRoute>} />
        <Route path="/app/orders" element={<StudentRoute><OrdersPage /></StudentRoute>} />
        <Route path="/app/settings" element={<StudentRoute><ProfilePage /></StudentRoute>} />
        <Route path="/app/billing" element={<StudentRoute><OrdersPage /></StudentRoute>} />
        <Route path="/app/feedback" element={<StudentRoute><FeedbackPage /></StudentRoute>} />
        <Route path="/app/feedback/:submissionId" element={<StudentRoute><FeedbackPage /></StudentRoute>} />
        <Route path="/app/learn/:lessonId" element={<StudentRoute classroom><Classroom /></StudentRoute>} />
        <Route path="/my-courses" element={<StudentRoute><MyCoursesPage /></StudentRoute>} />
        <Route path="/curriculum/:courseId" element={<StudentRoute><CurriculumPage /></StudentRoute>} />
        <Route path="/classroom/:courseId/:lessonId" element={<StudentRoute classroom><Classroom /></StudentRoute>} />
        <Route path="/assignments" element={<StudentRoute><AssignmentsPage /></StudentRoute>} />
        <Route path="/theme-sheet" element={<StudentRoute><ThemeSheetPage /></StudentRoute>} />
        <Route path="/feedback" element={<StudentRoute><FeedbackPage /></StudentRoute>} />
        <Route path="/my-showcase" element={<StudentRoute><MyShowcasePage /></StudentRoute>} />
        <Route path="/notifications" element={<StudentRoute><NotificationsPage /></StudentRoute>} />
        <Route path="/profile" element={<StudentRoute><ProfilePage /></StudentRoute>} />
        <Route path="/orders" element={<StudentRoute><OrdersPage /></StudentRoute>} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/checkout/:courseId" element={<Checkout />} />
      </Routes>
      {!inStudentPlatform && !inClassroom && <Footer />}
    </>
  );
}

export default App;