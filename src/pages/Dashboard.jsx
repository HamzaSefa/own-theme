import { Link } from "react-router-dom";
import { courses, getAllLessons, getCurrentEnrollments, getProgress } from "../data/courses";
import { getCurrentUser } from "../data/studentPortal";

export default function Dashboard() {
  const name = getCurrentUser()?.name?.trim() || "editor";
  const enrolledCourses = getCurrentEnrollments()
    .map((enrollment) => {
      const course = courses.find((item) => item.id === enrollment.courseId);
      if (!course) return null;
      const lessons = getAllLessons(course);
      const completed = (enrollment.completed || []).filter((id) =>
        lessons.some((lesson) => lesson.id === id)
      );
      const nextLesson = lessons.find((lesson) => !completed.includes(lesson.id) && lesson.locked !== true);
      return { course, lessons, completed, nextLesson, progress: getProgress(course, completed) };
    })
    .filter(Boolean);
  const lessonCount = enrolledCourses.reduce((total, item) => total + item.lessons.length, 0);
  const completedCount = enrolledCourses.reduce((total, item) => total + item.completed.length, 0);
  const overallProgress = lessonCount ? Math.round((completedCount / lessonCount) * 100) : 0;

  return (
    <div className="student-dashboard">
      <header className="student-workspace-heading">
        <span className="eyebrow">YOUR LEARNING SPACE</span>
        <h1>Welcome back, {name}.</h1>
        <p>Your courses, next lessons, and learning progress.</p>
      </header>

      <section className="student-course-progress-card" aria-label="Overall learning progress">
        <div className="student-course-progress-topline">
          <div>
            <span className="eyebrow">OVERALL PROGRESS</span>
            <h2>{overallProgress}% complete</h2>
          </div>
          <span>{completedCount} of {lessonCount} lessons complete</span>
        </div>
        <div className="student-progress-track" role="progressbar" aria-label="Overall learning progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={overallProgress}>
          <span style={{ width: `${overallProgress}%` }} />
        </div>
      </section>

      <section className="student-dashboard-courses">
        <header className="student-course-overview-heading">
          <div>
            <span className="eyebrow">YOUR LIBRARY</span>
            <h2>Enrolled courses</h2>
          </div>
          <Link className="text-link" to="/app/courses">View all courses <span aria-hidden="true">↗</span></Link>
        </header>
        {enrolledCourses.length ? (
          <div className="student-owned-course-grid">
            {enrolledCourses.map(({ course, lessons, completed, nextLesson, progress }) => (
              <article className="student-owned-course-card" key={course.id}>
                <div className={`student-owned-course-art student-owned-course-art-${course.id}`}>
                  <span>{course.tag}</span>
                  <i aria-hidden="true" />
                </div>
                <div className="student-owned-course-content">
                  <span className="eyebrow">{course.tag}</span>
                  <h3>{course.title}</h3>
                  <div className="student-progress-label">
                    <span>{completed.length} of {lessons.length} lessons</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="student-progress-track" role="progressbar" aria-label={`${course.title} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  {nextLesson ? (
                    <Link className="btn btn-primary" to={`/app/learn/${nextLesson.id}`}>
                      {progress ? "Resume learning" : "Start learning"}
                    </Link>
                  ) : (
                    <Link className="btn btn-outline" to={`/app/courses/${course.id}`}>Review course</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="student-course-empty">
            <h3>Your courses will appear here.</h3>
            <p>Once the course owner grants your account access, lessons and progress will be available in your learning space.</p>
          </div>
        )}
      </section>
    </div>
  );
}
