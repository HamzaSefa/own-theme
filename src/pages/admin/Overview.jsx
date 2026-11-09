import { courses } from "../../data/courses";
import { sales, monthly, initialStudents } from "../../data/admin";

export default function Overview() {
  // reduce adds up all the amounts into one total
  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const maxRevenue = Math.max(...monthly.map((m) => m.revenue));

  return (
    <>
      <h1>Overview</h1>

      <div className="stat-grid">
        <div className="stat"><small>Total revenue</small><strong>${totalRevenue}</strong></div>
        <div className="stat"><small>Total sales</small><strong>{sales.length}</strong></div>
        <div className="stat"><small>Students</small><strong>{initialStudents.length}</strong></div>
        <div className="stat"><small>Avg. completion</small><strong>42%</strong></div>
      </div>

      <h2>Revenue by month</h2>
      <div className="chart">
        {monthly.map((m) => (
          <div className="chart-col" key={m.month}>
            <span>${m.revenue}</span>
            <div className="chart-bar" style={{ height: (m.revenue / maxRevenue) * 100 + "%" }} />
            <span>{m.month}</span>
          </div>
        ))}
      </div>

      <h2>Recent sales</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Student</th><th>Course</th><th>Amount</th><th>Date</th></tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{s.student}</td>
                <td>{courses.find((c) => c.id === s.courseId).title}</td>
                <td>${s.amount}</td>
                <td className="muted">{s.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Payment gateway</h2>
      <div className="gateway">
        <div>
          <strong>Not connected</strong>
          <p>In Phase 4 we connect a gateway (like Chapa). After each payment it tells our site, and the student is enrolled automatically.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => alert("Payment hooks come in Phase 4!")}>
          Connect gateway
        </button>
      </div>
    </>
  );
}