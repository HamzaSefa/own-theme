import { Link } from "react-router-dom";
import { courses } from "../../data/courses";
import { adminStorageKeys, readAdminData } from "../../data/adminWorkspace";

function getRevenueByCurrency(orders) {
  const revenue = new Map();
  orders.forEach((order) => {
    const status = (order.status || "").toLowerCase();
    if (!/paid|complete|completed|succeeded/.test(status) || /refund|cancel/.test(status)) return;
    const amount = Number(order.amount);
    if (!Number.isFinite(amount) || amount < 0) return;
    const currency = order.currency || "USD";
    revenue.set(currency, (revenue.get(currency) || 0) + amount);
  });
  return [...revenue.entries()];
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
  const paidOrders = orders.filter((order) => /paid|complete|completed|succeeded/i.test(order.status || "")
    && !/refund|cancel/i.test(order.status || ""));
  const pendingOrders = orders.filter((order) => /pending|approval|review/i.test(order.status || ""));
  const revenue = getRevenueByCurrency(orders);
  const stats = [
    ["Student accounts", studentCount],
    ["Published courses", publishedCourses.length],
    ["Recorded paid orders", paidOrders.length],
    ["Orders awaiting review", pendingOrders.length],
  ];

  return (
    <div className="admin-overview-page">
      <div className="admin-heading-row">
        <div><h1>Admin overview</h1><p className="muted">Manage courses, student access, and order records.</p></div>
      </div>
      <div className="stat-grid">
        {stats.map(([label, count]) => (
          <div className="stat" key={label}><small>{label}</small><strong>{count}</strong></div>
        ))}
      </div>
      <p className="admin-disclaimer">Preview only: student, order, and revenue figures come from browser-local records and are not verified transactions.</p>

      <section className="admin-overview-section">
        <div className="admin-overview-section-heading"><h2>Recorded revenue</h2><Link to="/admin/orders">Review orders →</Link></div>
        {revenue.length ? (
          <div className="stat-grid">
            {revenue.map(([currency, total]) => (
              <div className="stat" key={currency}>
                <small>{currency} · paid order records</small>
                <strong>{currency} {total.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        ) : <p className="admin-overview-empty">No paid order totals have been recorded in this preview.</p>}
      </section>

      <section className="admin-overview-section">
        <div className="admin-overview-section-heading"><h2>Course content</h2></div>
        <div className="admin-overview-shortcuts">
          <Link to="/admin/courses"><strong>Manage courses</strong><span>Create courses, edit details, and control publication ↗</span></Link>
          <Link to={`/admin/courses/${courses[0]?.id || ""}`}><strong>Manage lessons</strong><span>Organize course modules and lessons ↗</span></Link>
          <Link to="/admin/media"><strong>Manage videos & documents</strong><span>Update lesson media and resource references ↗</span></Link>
        </div>
      </section>
    </div>
  );
}
