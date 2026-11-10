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
  const submissions = readAdminData(adminStorageKeys.assignments, []);
  const awaitingReview = submissions.filter((item) =>
    ["submitted", "under review"].includes((item.status || "").toLowerCase())
    && Boolean(item.url)
  );
  const recentSubmissions = submissions
    .filter((item) => item.submittedAt && item.status !== "Draft")
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 5);
  const activity = [
    ...submissions.filter((item) => getDate(item)).map((item) => ({
      id: `submission-${item.id}`,
      title: `Project submitted: ${item.title || "Untitled project"}`,
      detail: courseTitle(item.courseId),
      date: getDate(item),
      href: `/admin/assignments`,
    })),
    ...orders.filter((item) => getDate(item)).map((item) => ({
      id: `order-${item.id}`,
      title: `Order update: ${item.status || "Status unavailable"}`,
      detail: item.item === "bundle" ? "Complete Bundle" : courseTitle(item.item),
      date: getDate(item),
      href: "/admin/orders",
    })),
  ].sort((a, b) => b.date - a.date).slice(0, 6);

  const stats = [
    ["Student accounts", studentCount],
    ["Published courses", publishedCourses.length],
    ["Pending order reviews", pendingOrders.length],
    ["Assignments awaiting review", awaitingReview.length],
  ];

  return (
    <div className="admin-overview-page">
      <div className="admin-heading-row">
        <div><h1>Admin overview</h1><p className="muted">A snapshot of records currently stored in this preview.</p></div>
      </div>
      <div className="stat-grid">
        {stats.map(([label, count]) => (
          <div className="stat" key={label}><small>{label}</small><strong>{count}</strong></div>
        ))}
      </div>
      <p className="admin-disclaimer">These are browser-local preview records, not verified production accounts or payments. No demo sales, monthly figures, or completion estimates are included.</p>

      <section className="admin-overview-section">
        <div className="admin-overview-section-heading"><h2>Recent student activity</h2><Link to="/admin/assignments">Assignment review →</Link></div>
        {activity.length ? (
          <div className="admin-overview-list">
            {activity.map((item) => (
              <Link className="admin-overview-row" to={item.href} key={item.id}>
                <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                <time>{formatDate(item.date)}</time>
              </Link>
            ))}
          </div>
        ) : <AdminEmpty>No student submissions or order activity have been recorded yet.</AdminEmpty>}
      </section>

      <section className="admin-overview-section">
        <div className="admin-overview-section-heading"><h2>Recently submitted assignments</h2><Link to="/admin/assignments">Open review queue →</Link></div>
        {recentSubmissions.length ? (
          <div className="admin-overview-list">
            {recentSubmissions.map((item) => (
              <Link className="admin-overview-row" to={`/admin/assignments?submission=${encodeURIComponent(item.id)}`} key={item.id}>
                <span><strong>{item.title || "Untitled project"}</strong><small>{courseTitle(item.courseId)} · {item.status || "Status unavailable"}</small></span>
                <time>{formatDate(getDate(item))}</time>
              </Link>
            ))}
          </div>
        ) : <AdminEmpty>No assignment submissions yet.</AdminEmpty>}
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
