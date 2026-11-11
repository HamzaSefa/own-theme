import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Overview from "./admin/Overview";
import {
  AssignmentReview,
  CourseManagement,
  InstructorFeedbackTools,
  LessonManagement,
  MediaManagement,
  OrdersReview,
  PlanManagement,
  ShowcaseModeration,
  SiteSettings,
  StudentManagement,
} from "./admin/Workspace";
import { getCurrentUser } from "../data/studentPortal";

const ADMIN_SESSION_KEY = "ownTheme_admin_preview";

const sections = [
  { id: "overview", label: "Admin overview", icon: "01" },
  { id: "courses", label: "Course management", icon: "02" },
  { id: "lessons", label: "Modules & lessons", icon: "03" },
  { id: "media", label: "Video & resources", icon: "04" },
  { id: "students", label: "Student management", icon: "05" },
  { id: "orders", label: "Orders & payments", icon: "06" },
  { id: "assignments", label: "Assignment review", icon: "07" },
  { id: "feedback", label: "Instructor feedback", icon: "08" },
  { id: "plans", label: "Bundles & plans", icon: "09" },
  { id: "showcase", label: "Showcase moderation", icon: "10" },
  { id: "settings", label: "Site content & settings", icon: "11" },
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
          {routeTab === "assignments" && <AssignmentReview submissionId={location.pathname.startsWith("/admin/assignments/") ? location.pathname.slice("/admin/assignments/".length) : ""} />}
          {routeTab === "feedback" && <InstructorFeedbackTools />}
          {routeTab === "plans" && <PlanManagement />}
          {routeTab === "showcase" && <ShowcaseModeration />}
          {routeTab === "settings" && <SiteSettings />}
        </main>
      </div>
      <p className="admin-preview-note">Unsecured demo preview · Browser-only controls are not admin authorization. Server-side access checks are required for every protected action.</p>
    </div>
  );
}
