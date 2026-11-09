import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Classroom from "./pages/Classroom";

function App() {
  const location = useLocation();
  const inClassroom = location.pathname.startsWith("/classroom");

  return (
    <>
      {!inClassroom && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/classroom/:courseId/:lessonId" element={<Classroom />} />
      </Routes>
      {!inClassroom && <Footer />}
    </>
  );
}

export default App;