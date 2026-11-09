import { Link } from "react-router-dom";
import { courses, student, getAllLessons, getProgress } from "../data/courses";

export default function Dashboard() {
  // Courses the student owns, and courses they don't
  const myCourses = student.enrolled.map((e) => ({
    course: courses.find((c) => c.id === e.courseId),
    completed: e.completed,
  }));
  const lockedCourses = courses.filter(
    (c) => !student.enrolled.some((e) => e.courseId === c.id)
  );

  return (
    <div className="container dash">
      <h1>Welcome back, {student.name}</h1>
      <p className="sub">Pick up right where you left off.</p>

      <div className="course-grid" style={{ paddingBottom: 0 }}>
        {myCourses.map(({ course, completed }) => {
          const lessons = getAllLessons(course);
          const percent = getProgress(course, completed);
          // first lesson not finished yet (or the first lesson if all done)
          const next = lessons.find((l) => !completed.includes(l.id)) || lessons[0];

          return (
            <div className="card" key={course.id}>
              <div className="tag">{course.tag}</div>
              <h3>{course.title}</h3>
              <div className="progress">
                <div className="progress-bar" style={{ width: percent + "%" }} />
              </div>
              <div className="progress-label">
                <span>{completed.length} of {lessons.length} lessons</span>
                <span>{percent}%</span>
              </div>
              <Link to={`/classroom/${course.id}/${next.id}`} className="btn btn-primary">
                {completed.length === 0 ? "Start course" : "Continue"}
              </Link>
            </div>
          );
        })}
      </div>

      {lockedCourses.length > 0 && (
        <>
          <h2>More courses</h2>
          <div className="course-grid" style={{ paddingBottom: 0 }}>
            {lockedCourses.map((course) => (
              <div className="card locked" key={course.id}>
                <div className="tag">🔒 {course.tag}</div>
                <h3>{course.title}</h3>
                <p>You don't own this course yet.</p>
                <a href="/#courses" className="btn btn-outline">Learn more</a>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}