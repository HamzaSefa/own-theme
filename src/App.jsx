import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Classroom from "./pages/Classroom";
import Admin from "./pages/Admin";
import {
  ForgotPasswordPage,
  ResetPasswordPage,
} from "./pages/AccountSupportPages";
import {
  CurriculumPage,
  MyCoursesPage,
  ProfilePage,
  StudentRoute,
} from "./pages/StudentPages";

function App() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);
  const inStudentPlatform = location.pathname.startsWith("/app")
    || location.pathname.startsWith("/classroom/");
  const inClassroom =
    location.pathname.startsWith("/classroom")
    || location.pathname.startsWith("/app/learn/")
    || location.pathname.startsWith("/admin");

  return (
    <>
      {!inStudentPlatform && !inClassroom && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/app" element={<StudentRoute><Dashboard /></StudentRoute>} />
        <Route path="/app/courses" element={<StudentRoute><MyCoursesPage /></StudentRoute>} />
        <Route path="/app/courses/:courseId" element={<StudentRoute><CurriculumPage /></StudentRoute>} />
        <Route path="/app/settings" element={<StudentRoute><ProfilePage /></StudentRoute>} />
        <Route path="/app/learn/:lessonId" element={<StudentRoute classroom><Classroom /></StudentRoute>} />
        <Route path="/classroom/:courseId/:lessonId" element={<StudentRoute classroom><Classroom /></StudentRoute>} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!inStudentPlatform && !inClassroom && <Footer />}
    </>
  );
}

export default App;