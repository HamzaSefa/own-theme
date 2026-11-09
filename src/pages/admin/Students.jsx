import { useState } from "react";
import { courses } from "../../data/courses";
import { initialStudents } from "../../data/admin";

export default function Students() {
  const [students, setStudents] = useState(initialStudents);
  const [query, setQuery] = useState("");

  // Give or remove one course for one student
  function toggleCourse(studentId, courseId) {
    setStudents(
      students.map((s) => {
        if (s.id !== studentId) return s;
        const has = s.courses.includes(courseId);
        return {
          ...s,
          courses: has ? s.courses.filter((c) => c !== courseId) : [...s.courses, courseId],
        };
      })
    );
  }

  // Log the student out of their device
  function resetDevice(studentId) {
    setStudents(students.map((s) => (s.id === studentId ? { ...s, device: null } : s)));
  }

  // Search by name or email
  const shown = students.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <h1>Students & access</h1>
      <input
        className="search"
        placeholder="Search by name or email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Student</th><th>Course access (click to toggle)</th><th>Device session</th></tr>
          </thead>
          <tbody>
            {shown.map((s) => (
              <tr key={s.id}>
                <td>{s.name}<small>{s.email}</small></td>
                <td>
                  <div className="chips">
                    {courses.map((c) => (
                      <button
                        key={c.id}
                        className={s.courses.includes(c.id) ? "chip on" : "chip"}
                        onClick={() => toggleCourse(s.id, c.id)}
                      >
                        {c.title}
                      </button>
                    ))}
                  </div>
                </td>
                <td>
                  {s.device ? (
                    <>
                      {s.device}<small>Active {s.lastActive}</small>
                      <button className="btn btn-danger btn-sm" style={{ marginTop: 8 }} onClick={() => resetDevice(s.id)}>
                        Reset session
                      </button>
                    </>
                  ) : (
                    <span className="muted">No active session</span>
                  )}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan="3" className="muted">No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}