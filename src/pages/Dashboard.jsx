import { Link } from "react-router-dom";
import { courses, student, getAllLessons, getProgress } from "../data/courses";
import { getCurrentUser, readStudentData } from "../data/studentPortal";

const ASSIGNMENTS_KEY = "ownTheme_assignments";
const NOTIFICATIONS_KEY = "ownTheme_notifications";

function getActivityDate(item) {
  const timestamp = item.createdAt || item.submittedAt || item.feedbackAt || item.updatedAt;
  const date = timestamp ? new Date(timestamp) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function formatActivityDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function getCourseProgress(course, completed) {
  return getProgress(course, completed);
}

export default function Dashboard() {
  const user = getCurrentUser();
  const name = user?.name?.trim().split(/\s+/)[0] || "editor";
  const enrolledCourses = student.enrolled
    .map((enrollment) => ({
      course: courses.find((course) => course.id === enrollment.courseId),
      completed: enrollment.completed || [],
    }))
    .filter(({ course }) => course);
  const assignments = readStudentData(ASSIGNMENTS_KEY, []);
  const notifications = readStudentData(NOTIFICATIONS_KEY, []);
  const feedbackItems = assignments.filter((assignment) => assignment.feedback?.trim());
  const pendingReview = assignments.filter((assignment) => assignment.status === "Submitted");
  const completedLessons = enrolledCourses.reduce((total, item) => total + item.completed.length, 0);
  const totalLessons = enrolledCourses.reduce((total, item) => total + getAllLessons(item.course).length, 0);
  const overallProgress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const currentCourse = enrolledCourses.find(({ course, completed }) =>
    getAllLessons(course).some((lesson) => !completed.includes(lesson.id))
  ) || enrolledCourses[0];
  const nextLesson = currentCourse && (
    getAllLessons(currentCourse.course).find((lesson) => !currentCourse.completed.includes(lesson.id))
    || getAllLessons(currentCourse.course)[0]
  );
  const activity = [
    ...notifications.map((item) => ({
      id: `notification-${item.id}`,
      title: item.title,
      detail: item.message,
      date: getActivityDate(item),
      type: "UPDATE",
    })),
    ...assignments.map((item) => ({
      id: `assignment-${item.id}`,
      title: item.feedback ? `Feedback added: ${item.title}` : `Assignment submitted: ${item.title}`,
      detail: item.feedback || `Your work is ${item.status?.toLowerCase() || "saved"}.`,
      date: getActivityDate(item),
      type: item.feedback ? "FEEDBACK" : "ASSIGNMENT",
    })),
  ]
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
    .slice(0, 4);

  return (
    <div className="student-dashboard">
      <header className="student-workspace-heading">
        <span className="eyebrow">YOUR WORKSPACE</span>
        <h1>Welcome back, {name}.</h1>
        <p>Keep your momentum going. Pick up a lesson or take the next step on a project.</p>
      </header>

      <section className="student-continue-panel" aria-labelledby="continue-title">
        <div className="student-continue-copy">
          <span className="eyebrow">CONTINUE LEARNING</span>
          {currentCourse && nextLesson ? (
            <>
              <h2 id="continue-title">{currentCourse.course.title}</h2>
              <p>{nextLesson.title}</p>
              <div className="student-progress-label">
                <span>Your course progress</span>
                <span>{getCourseProgress(currentCourse.course, currentCourse.completed)}%</span>
              </div>
              <div
                className="student-progress-track"
                role="progressbar"
                aria-label={`${currentCourse.course.title} progress`}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={getCourseProgress(currentCourse.course, currentCourse.completed)}
              >
                <span style={{ width: `${getCourseProgress(currentCourse.course, currentCourse.completed)}%` }} />
              </div>
              <Link
                to={`/app/learn/${nextLesson.id}`}
                className="btn btn-primary"
              >
                Continue learning <span aria-hidden="true">→</span>
              </Link>
            </>
          ) : (
            <>
              <h2 id="continue-title">Start your learning journey.</h2>
              <p>Explore the courses and choose a track for your next edit.</p>
              <Link to="/courses" className="btn btn-primary">Explore courses <span aria-hidden="true">→</span></Link>
            </>
          )}
        </div>
        <div className="student-workspace-art" aria-hidden="true">
          <span className="student-art-frame student-art-frame-back" />
          <span className="student-art-frame student-art-frame-front">
            <i />
          </span>
          <span className="student-art-caption">OWN YOUR CUT</span>
        </div>
      </section>

      <section className="student-dashboard-section" aria-labelledby="enrolled-heading">
        <div className="student-dashboard-section-heading">
          <div>
            <span className="eyebrow">YOUR LEARNING</span>
            <h2 id="enrolled-heading">Enrolled courses</h2>
          </div>
          <Link to="/app/courses" className="text-link">All courses <span aria-hidden="true">↗</span></Link>
        </div>
        {enrolledCourses.length ? (
          <div className="student-enrolled-grid">
            {enrolledCourses.map(({ course, completed }) => {
              const lessons = getAllLessons(course);
              const next = lessons.find((lesson) => !completed.includes(lesson.id)) || lessons[0];
              const progress = getCourseProgress(course, completed);
              return (
                <article className="student-enrolled-card" key={course.id}>
                  <span className="eyebrow">{course.tag}</span>
                  <h3>{course.title}</h3>
                  <div className="student-progress-label">
                    <span>{completed.length} of {lessons.length} lessons</span>
                    <span>{progress}%</span>
                  </div>
                  <div
                    className="student-progress-track"
                    role="progressbar"
                    aria-label={`${course.title} progress`}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={progress}
                  >
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <Link to={`/app/learn/${next.id}`} className="text-link">
                    {progress === 100 ? "Review course" : "Continue course"} <span aria-hidden="true">→</span>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="student-dashboard-empty">
            <p>You have no enrolled courses yet.</p>
            <Link to="/courses" className="text-link">Explore courses <span aria-hidden="true">↗</span></Link>
          </div>
        )}
      </section>

      <section className="student-progress-overview" aria-labelledby="progress-heading">
        <div className="student-progress-overview-heading">
          <div>
            <span className="eyebrow">COURSE COMPLETION</span>
            <h2 id="progress-heading">Your progress, at a glance.</h2>
          </div>
        </div>
        {totalLessons ? (
          <>
            <div className="student-overall-progress">
              <div><strong>{overallProgress}%</strong><span>across enrolled courses</span></div>
              <div className="student-progress-track" role="progressbar" aria-label="Overall course progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={overallProgress}>
                <span style={{ width: `${overallProgress}%` }} />
              </div>
              <small>{completedLessons} of {totalLessons} lessons complete</small>
            </div>
            <p className="student-progress-note">Based on lessons marked complete in this browser preview.</p>
          </>
        ) : (
          <div className="student-progress-empty">
            <p>Progress appears here once you enroll in a course.</p>
            <Link to="/courses" className="text-link">Browse courses <span aria-hidden="true">↗</span></Link>
          </div>
        )}
      </section>

      <section className="student-dashboard-next-steps" aria-label="Assignments and instructor feedback">
        <article className="student-next-step-card">
          <span className="eyebrow">ASSIGNMENTS</span>
          <h2>{pendingReview.length ? `${pendingReview.length} submitted for review` : "Ready for your next submission?"}</h2>
          <p>
            {pendingReview.length
              ? "Your submitted work is waiting for instructor review."
              : "Your course assignments and submissions are gathered in one place."}
          </p>
          <Link to="/app/assignments" className="text-link">
            {pendingReview.length ? "View submissions" : "Go to assignments"} <span aria-hidden="true">↗</span>
          </Link>
        </article>
        <article className="student-next-step-card">
          <span className="eyebrow">RECENT FEEDBACK</span>
          {feedbackItems.length ? (
            <>
              <h2>{feedbackItems[0].title}</h2>
              <p className="student-feedback-preview">{feedbackItems[0].feedback}</p>
              <Link to="/feedback" className="text-link">Read all feedback <span aria-hidden="true">↗</span></Link>
            </>
          ) : (
            <>
              <h2>No feedback yet.</h2>
              <p>Submit a project to start a feedback thread with your instructor.</p>
              <Link to="/app/assignments" className="text-link">Submit an assignment <span aria-hidden="true">↗</span></Link>
            </>
          )}
        </article>
      </section>

      <section className="student-dashboard-bottom-grid">
        <article className="student-dashboard-info-card">
          <div className="student-dashboard-section-heading">
            <div>
              <span className="eyebrow">UPCOMING</span>
              <h2>Deadlines</h2>
            </div>
          </div>
          <p>Deadlines are not configured in this learning preview.</p>
          <Link to="/app/assignments" className="text-link">Check assignments <span aria-hidden="true">↗</span></Link>
        </article>
        <article className="student-dashboard-info-card">
          <div className="student-dashboard-section-heading">
            <div>
              <span className="eyebrow">RECENT ACTIVITY</span>
              <h2>Your latest updates</h2>
            </div>
            <Link to="/notifications" className="text-link">All updates <span aria-hidden="true">↗</span></Link>
          </div>
          {activity.length ? (
            <ul className="student-activity-list">
              {activity.map((item) => (
                <li key={item.id}>
                  <span className="student-activity-dot" aria-hidden="true" />
                  <div>
                    <span className="eyebrow">{item.type}{item.date ? ` · ${formatActivityDate(item.date)}` : ""}</span>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>Your course, assignment, and feedback updates will appear here.</p>
          )}
        </article>
      </section>

      <section className="student-dashboard-quick-links" aria-label="Creative tools">
        <Link to="/theme-sheet"><span>01</span><strong>Open your Theme Sheet</strong><span aria-hidden="true">↗</span></Link>
        <Link to="/my-showcase"><span>02</span><strong>Visit My Showcase</strong><span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  );
}
