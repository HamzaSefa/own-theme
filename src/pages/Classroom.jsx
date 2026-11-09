import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { courses, student, getAllLessons, getProgress } from "../data/courses";

export default function Classroom() {
  // Read course and lesson from the web address
  const { courseId, lessonId } = useParams();

  const course = courses.find((c) => c.id === courseId);
  const enrollment = student.enrolled.find((e) => e.courseId === courseId);

  // The app's memory of which lessons are finished
  const [completed, setCompleted] = useState(enrollment ? enrollment.completed : []);

  // ACCESS CONTROL: no course, or not enrolled? Send back to dashboard.
  if (!course || !enrollment) return <Navigate to="/dashboard" />;

  const lessons = getAllLessons(course);
  const index = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[index];
  if (!lesson) return <Navigate to="/dashboard" />;

  const next = lessons[index + 1];
  const isDone = completed.includes(lesson.id);
  const percent = getProgress(course, completed);

  function toggleComplete() {
    if (isDone) {
      setCompleted(completed.filter((id) => id !== lesson.id));
    } else {
      setCompleted([...completed, lesson.id]);
    }
  }

  return (
    <>
      <div className="class-top">
        <Link to="/dashboard">← Dashboard</Link>
        <div className="class-title">{course.title}</div>
        <div style={{ width: 90 }} />
      </div>

      <div className="class-layout">
        <main className="class-main">
          <div className="video-box">
            <div className="play">▶</div>
            <strong>Video player placeholder</strong>
            <span>In Phase 3, a private, domain-locked video plays here.</span>
          </div>

          <div className="lesson-head">
            <h1>{lesson.title}</h1>
            <p>{lesson.duration}</p>
          </div>

          <div className="lesson-actions">
            <button
              className={isDone ? "btn btn-done" : "btn btn-primary"}
              onClick={toggleComplete}
            >
              {isDone ? "✓ Completed" : "Mark as complete"}
            </button>
            {next && (
              <Link to={`/classroom/${course.id}/${next.id}`} className="btn btn-outline">
                Next lesson →
              </Link>
            )}
          </div>

          <div className="resource">
            <div>
              <strong>Constraint card</strong>
              <small>PDF · opens in the in-app viewer (Phase 3)</small>
            </div>
            <button className="btn btn-outline" onClick={() => alert("PDF viewer comes in Phase 3!")}>
              Open
            </button>
          </div>
        </main>

        <aside className="class-sidebar">
          <div className="sidebar-progress">
            <div className="progress-label" style={{ marginBottom: 8 }}>
              <span>Your progress</span>
              <span>{percent}%</span>
            </div>
            <div className="progress">
              <div className="progress-bar" style={{ width: percent + "%" }} />
            </div>
          </div>

          {course.modules.map((module) => (
            <div key={module.title}>
              <div className="module-title">{module.title}</div>
              {module.lessons.map((l) => {
                const done = completed.includes(l.id);
                const active = l.id === lesson.id;
                return (
                  <Link
                    key={l.id}
                    to={`/classroom/${course.id}/${l.id}`}
                    className={active ? "lesson-link active" : "lesson-link"}
                  >
                    <span className={done ? "check done" : "check"}>{done ? "✓" : ""}</span>
                    <span>{l.title}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}