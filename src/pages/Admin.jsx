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
  { id: "overview", label: "Admin overview", icon: "grid" },
  { id: "courses", label: "Course management", icon: "book" },
  { id: "lessons", label: "Modules & lessons", icon: "list" },
  { id: "media", label: "Video & resources", icon: "video" },
  { id: "students", label: "Student management", icon: "users" },
  { id: "orders", label: "Orders & payments", icon: "receipt" },
  { id: "assignments", label: "Assignment review", icon: "clipboard" },
  { id: "feedback", label: "Instructor feedback", icon: "message" },
  { id: "plans", label: "Bundles & plans", icon: "layers" },
  { id: "showcase", label: "Showcase moderation", icon: "image" },
  { id: "settings", label: "Site content & settings", icon: "settings" },
];

function AdminNavIcon({ name }) {
  const shared = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  const shapes = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    video: <><rect x="3" y="5" width="13" height="14" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    receipt: <><path d="M4 3v18l3-2 3 2 3-2 3 2 4-2V3l-4 2-3-2-3 2-3-2z" /><path d="M8 9h8M8 13h8" /></>,
    clipboard: <><rect x="5" y="5" width="14" height="16" rx="2" /><path d="M9 5V3h6v2M9 11h6M9 15h6" /></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2z" transform="translate(-1 -1)" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" {...shared}>{shapes[name]}</svg>;
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState(localStorage.getItem(ADMIN_SESSION_KEY) === "true");
  const user = getCurrentUser();
  const userInitials = (user?.name || "Admin").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
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
          <Link to="/admin" className="admin-side-brand"><span className="admin-side-logo">OT</span><span>Own<span>Theme</span><small>STUDIO CONTROL</small></span></Link>
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
                <AdminNavIcon name={section.icon} />
                <span>{section.label}</span>
              </button>
            );
          })}
          <div className="admin-side-profile">
            <span className="admin-profile-avatar">{userInitials}</span>
            <span><strong>{user?.name || "Admin"}</strong><small>Administrator</small></span>
          </div>
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
