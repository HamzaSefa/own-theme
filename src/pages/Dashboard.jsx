import { Link } from "react-router-dom";
import { courses, getCurrentEnrollments, getAllLessons, getProgress } from "../data/courses";
import { getCurrentUser, readStudentData } from "../data/studentPortal";

const NOTIFICATIONS_KEY = "ownTheme_notifications";

function getActivityDate(item) {
  const timestamp = item.createdAt || item.updatedAt;
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
  const name = user?.name?.trim() || "editor";
  const email = user?.email?.trim().toLowerCase();
  const enrolledCourses = getCurrentEnrollments()
    .map((enrollment) => ({
      course: courses.find((course) => course.id === enrollment.courseId),
      completed: enrollment.completed || [],
    }))
    .filter(({ course }) => course);
  const notifications = readStudentData(NOTIFICATIONS_KEY, []).filter(
    (notification) => notification.recipientEmail?.trim().toLowerCase() === email,
  );
  const completedLessons = enrolledCourses.reduce((total, item) => total + item.completed.length, 0);
  const totalLessons = enrolledCourses.reduce((total, item) => total + getAllLessons(item.course).length, 0);
  const overallProgress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const currentCourse = enrolledCourses.find(({ course, completed }) =>
    getAllLessons(course).some((lesson) => !completed.includes(lesson.id))
  );
  const nextLesson = currentCourse && (
    getAllLessons(currentCourse.course).find((lesson) => !currentCourse.completed.includes(lesson.id))
  );
  const nextAction = currentCourse && nextLesson
    ? {
        eyebrow: "CONTINUE LEARNING",
        title: currentCourse.course.title,
        description: nextLesson.title,
        to: `/app/learn/${nextLesson.id}`,
        label: "Continue lesson",
      }
    : {
        eyebrow: "YOUR NEXT STEP",
        title: enrolledCourses.length ? "You’re up to date." : "Start your learning journey.",
        description: enrolledCourses.length
          ? "You’ve completed the lessons currently available in your courses."
          : "Explore the course catalog and choose a learning track.",
        to: enrolledCourses.length ? "/app/courses" : "/courses",
        label: enrolledCourses.length ? "Review my courses" : "Explore courses",
      };
  const activity = notifications.map((item) => ({
    id: `notification-${item.id}`,
    title: item.title,
    detail: item.message,
    date: getActivityDate(item),
    type: "UPDATE",
    to: item.href || "/app/notifications",
  }))
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
          <span className="eyebrow">{nextAction.eyebrow}</span>
          <h2 id="continue-title">{nextAction.title}</h2>
          <p>{nextAction.description}</p>
          {nextAction.eyebrow === "CONTINUE LEARNING" && currentCourse ? (
            <>
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
              <Link to={nextAction.to} className="btn btn-primary">
                {nextAction.label} <span aria-hidden="true">→</span>
              </Link>
            </>
          ) : (
            <Link to={nextAction.to} className="btn btn-primary">
              {nextAction.label} <span aria-hidden="true">→</span>
            </Link>
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
                  <div className={`student-enrolled-card-art student-owned-course-art-${course.id}`}>
                    {(course.thumbnail || course.heroImage) && <img src={course.thumbnail || course.heroImage} alt="" loading="lazy" decoding="async" />}
                    <span>{course.tag}</span>
                    <i aria-hidden="true" />
                  </div>
                  <div className="student-enrolled-card-content">
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
                  </div>
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

      <section className="student-dashboard-bottom-grid student-dashboard-activity-only">
        <article className="student-dashboard-info-card">
          <div className="student-dashboard-section-heading">
            <div>
              <span className="eyebrow">RECENT ACTIVITY</span>
              <h2>Your latest updates</h2>
            </div>
            <Link to="/app/notifications" className="text-link">All updates <span aria-hidden="true">↗</span></Link>
          </div>
          {activity.length ? (
            <ul className="student-activity-list">
              {activity.map((item) => (
                <li key={item.id}>
                  <span className="student-activity-dot" aria-hidden="true" />
                  <Link to={item.to} className="student-activity-link">
                    <span className="eyebrow">{item.type}{item.date ? ` · ${formatActivityDate(item.date)}` : ""}</span>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>Your course updates will appear here.</p>
          )}
        </article>
      </section>
    </div>
  );
}
