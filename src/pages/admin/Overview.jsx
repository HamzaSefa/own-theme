import { Link } from "react-router-dom";
import { courses } from "../../data/courses";
import { adminStorageKeys, readAdminData } from "../../data/adminWorkspace";

function getDate(record) {
  const value = record.submittedAt || record.createdAt || record.updatedAt;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function formatDate(date) {
  return date ? date.toLocaleString() : "Date unavailable";
}

function courseTitle(courseId) {
  return courses.find((course) => course.id === courseId)?.title || courseId || "Course";
}

function AdminEmpty({ children }) {
  return <p className="admin-overview-empty">{children}</p>;
}

export default function Overview() {
  const persistedStudents = readAdminData(adminStorageKeys.students, []);
  const sessionUser = JSON.parse(localStorage.getItem("ownTheme_session") || "null");
  const students = [...persistedStudents, ...(sessionUser?.email ? [sessionUser] : [])];
  const studentCount = new Set(students.map((item) => item.email?.toLowerCase()).filter(Boolean)).size;
  const publishedCourses = courses.filter((course) =>
    (course.publicationStatus || "Published") === "Published" && course.visibility !== false
  );
  const orders = readAdminData(adminStorageKeys.orders, []);
  const pendingOrders = orders.filter((order) =>
    /pending|approval|review/i.test(order.status || "")
  );
  const activity = orders
    .filter((item) => getDate(item))
    .map((item) => ({
      id: `order-${item.id}`,
      title: `Order update: ${item.status || "Status unavailable"}`,
      detail: item.item === "bundle" ? "Complete Bundle" : courseTitle(item.item),
      date: getDate(item),
      href: "/admin/orders",
    }))
    .sort((a, b) => b.date - a.date)
    .slice(0, 6);

  const stats = [
    { label: "Student accounts", count: studentCount, icon: "users" },
    { label: "Published courses", count: publishedCourses.length, icon: "courses" },
    { label: "Pending order reviews", count: pendingOrders.length, icon: "orders" },
  ];

  return (
    <div className="admin-overview-page">
      <div className="admin-heading-row">
        <div><h1>Admin overview</h1><p className="muted">A snapshot of records currently stored in this preview.</p></div>
      </div>
      <div className="stat-grid">
        {stats.map(({ label, count, icon }) => (
          <div className="stat admin-stat" key={label}>
            <span className={`admin-stat-icon admin-stat-icon-${icon}`} aria-hidden="true">
              {icon === "users" ? <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                : icon === "courses" ? <svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" /></svg>
                  : <svg viewBox="0 0 24 24"><path d="M4 3v18l3-2 3 2 3-2 3 2 4-2V3l-4 2-3-2-3 2-3-2z" /><path d="M8 9h8M8 13h8" /></svg>}
            </span>
            <small>{label}</small><strong>{count}</strong>
          </div>
        ))}
      </div>
      <p className="admin-disclaimer">These are browser-local preview records, not verified production accounts or payments. No demo sales, monthly figures, or completion estimates are included.</p>

      <section className="admin-overview-section">
        <div className="admin-overview-section-heading"><h2>Recent order activity</h2><Link to="/admin/orders">View orders →</Link></div>
        {activity.length ? (
          <div className="admin-overview-list">
            {activity.map((item) => (
              <Link className="admin-overview-row" to={item.href} key={item.id}>
                <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                <time>{formatDate(item.date)}</time>
              </Link>
            ))}
          </div>
        ) : <AdminEmpty>No order activity has been recorded yet.</AdminEmpty>}
      </section>

      <section className="admin-overview-section">
        <div className="admin-overview-section-heading"><h2>Course & content management</h2></div>
        <div className="admin-overview-shortcuts">
          <Link to="/admin/courses"><strong>Manage courses</strong><span>Create courses, edit details, and set publication status ↗</span></Link>
          <Link to={`/admin/courses/${courses[0]?.id || ""}`}><strong>Manage curriculum</strong><span>Organize modules, lessons, videos, and assignments ↗</span></Link>
          <Link to="/admin/media"><strong>Video & resources</strong><span>Review hosted video and resource references ↗</span></Link>
        </div>
      </section>
    </div>
  );
}
