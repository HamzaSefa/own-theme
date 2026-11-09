import { Routes, Route, useLocation } from "react-router-dom";
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

function App() {
  const location = useLocation();
  const inClassroom =
  location.pathname.startsWith("/classroom") || location.pathname.startsWith("/admin");

  return (
    <>
      {!inClassroom && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/classroom/:courseId/:lessonId" element={<Classroom />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/checkout/:courseId" element={<Checkout />} />
      </Routes>
      {!inClassroom && <Footer />}
    </>
  );
}

export default App;