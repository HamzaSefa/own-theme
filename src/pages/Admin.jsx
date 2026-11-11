import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Overview from "./admin/Overview";
import {
  CourseManagement,
  LessonManagement,
  MediaManagement,
  OrdersReview,
  StudentManagement,
} from "./admin/Workspace";
import { getCurrentUser } from "../data/studentPortal";

const ADMIN_SESSION_KEY = "ownTheme_admin_preview";

const sections = [
  { id: "overview", label: "Admin overview", icon: "01" },
  { id: "courses", label: "Course management", icon: "02" },
  { id: "lessons", label: "Modules & lessons", icon: "03" },
  { id: "media", label: "Videos & documents", icon: "04" },
  { id: "students", label: "Students & access", icon: "05" },
  { id: "orders", label: "Orders & revenue", icon: "06" },
];

export default function Admin() {
  const [unlocked, setUnlocked] = useState(localStorage.getItem(ADMIN_SESSION_KEY) === "true");
  const user = getCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const courseId = location.pathname.split("/").filter(Boolean)[2];
  const legacyTab = location.pathname.slice("/admin/".length).split("/")[0];
  const routeTab = location.pathname === "/admin/courses"
    ? "courses"
    : location.pathname.startsWith("/admin/courses/")
      ? "lessons"
      : location.pathname === "/admin"
        ? "overview"
        : sections.some((section) => section.id === legacyTab)
          ? legacyTab
            : "overview";

  function leaveDemo() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setUnlocked(false);
  }

  if (!unlocked || user?.role !== "admin") {
    return (
      <main className="admin-gate-wrap">
        <section className="admin-gate">
          <Link to="/" className="logo">Own<span>Theme</span></Link>
          <span className="admin-badge">ADMIN PREVIEW</span>
          <h1>Instructor workspace</h1>
          <p>
            This local demo includes management screens. Use the admin demo
            sign-in from the login page to view this preview.
          </p>
          <p className="admin-security-warning">
            Demo only: this preview can be opened by anyone and browser data can be edited. Do not enter real student, payment, or private course data. Protect every admin route and action with server-side authentication and authorization before launch.
          </p>
          <Link to="/login" className="btn btn-primary">Go to admin demo sign-in</Link>
          <Link to="/" className="admin-back-link">← Back to public site</Link>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-workspace">
      <header className="admin-top">
        <Link to="/">← Back to site</Link>
        <span className="admin-badge">ADMIN PREVIEW</span>
        <button className="btn btn-outline btn-sm" onClick={leaveDemo}>Exit preview</button>
      </header>
      <div className="admin-layout">
        <nav className="admin-side" aria-label="Admin tools">
          {sections.map((section) => {
            const active = routeTab === section.id;
            const destination = section.id === "overview"
              ? "/admin"
              : section.id === "courses"
                ? "/admin/courses"
                : section.id === "lessons"
                  ? `/admin/courses/${courseId || "short-form"}`
                  : `/admin/${section.id}`;
            return (
              <button
                key={section.id}
                className={active ? "side-btn active" : "side-btn"}
                onClick={() => navigate(destination)}
                aria-current={active ? "page" : undefined}
              >
                <span>{section.icon}</span>{section.label}
              </button>
            );
          })}
        </nav>
        <main className="admin-main">
          {routeTab === "overview" && <Overview />}
          {routeTab === "courses" && <CourseManagement />}
          {routeTab === "lessons" && <LessonManagement courseId={courseId} />}
          {routeTab === "media" && <MediaManagement />}
          {routeTab === "students" && <StudentManagement />}
          {routeTab === "orders" && <OrdersReview />}
        </main>
      </div>
      <p className="admin-preview-note">Unsecured demo preview · Browser-only controls are not admin authorization. Server-side access checks are required for every protected action.</p>
    </div>
  );
}
