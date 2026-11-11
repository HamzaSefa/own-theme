import { Link } from "react-router-dom";
import { courses, getCurrentEnrollments, getAllLessons, getProgress } from "../data/courses";
import { getCurrentUser, getUserSubmissions, readStudentData } from "../data/studentPortal";

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

function getOpenAssignments(enrolledCourses, submissions) {
  return enrolledCourses.flatMap(({ course }) => course.modules.flatMap((module, moduleIndex) => {
    const configured = Array.isArray(module.assignments)
      ? module.assignments
      : module.assignment
        ? [module.assignment]
        : module.assignmentTitle
          ? [{ title: module.assignmentTitle, description: module.assignmentDescription }]
          : [];

    return configured.flatMap((assignment, assignmentIndex) => {
      const details = typeof assignment === "string" ? { title: assignment } : assignment;
      const id = String(details.id || `${course.id}-${moduleIndex}-${assignmentIndex}`);
      const title = details.title || "Course assignment";
      const submission = submissions.find((item) =>
        item.assignmentId === id || (!item.assignmentId && item.title === title && item.courseId === course.id)
      );
      if (submission && submission.status !== "Draft") return [];
      return [{ id, title, courseTitle: course.title, submission }];
    });
  }));
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
  const assignments = getUserSubmissions();
  const openAssignments = getOpenAssignments(enrolledCourses, assignments);
  const notifications = readStudentData(NOTIFICATIONS_KEY, []).filter(
    (notification) => notification.recipientEmail?.trim().toLowerCase() === email,
  );
  const feedbackItems = assignments.filter((assignment) =>
    assignment.feedback?.trim() || assignment.feedbackHistory?.length
  );
  const pendingReview = assignments.filter((assignment) =>
    ["Submitted", "Under Review"].includes(assignment.status)
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
  const revisionRequested = assignments.find((item) => item.status === "Revision Requested");
  const unreadFeedback = assignments.find((item) =>
    (item.feedback?.trim() || item.feedbackHistory?.length)
    && !item.reviewedByStudentAt
  );
  const nextAction = revisionRequested
    ? {
        eyebrow: "REVISION REQUESTED",
        title: revisionRequested.title,
        description: revisionRequested.revisionRequirements || "Your instructor requested a revision. Review the feedback and update your submission.",
        to: `/app/assignments/${revisionRequested.assignmentId || revisionRequested.id}`,
        label: "Revise and resubmit",
      }
    : unreadFeedback
      ? {
          eyebrow: "NEW INSTRUCTOR FEEDBACK",
          title: unreadFeedback.title,
          description: "Your instructor has reviewed this submission. Read the feedback before continuing.",
          to: `/app/feedback/${unreadFeedback.id}`,
          label: "Read feedback",
        }
      : openAssignments.length
        ? {
            eyebrow: openAssignments[0].submission ? "DRAFT ASSIGNMENT" : "ASSIGNMENT TO DO",
            title: openAssignments[0].title,
            description: `${openAssignments[0].courseTitle} · ${openAssignments[0].submission ? "Finish and submit your saved draft." : "Open the brief, review the requirements, and submit your work."}`,
            to: `/app/assignments/${openAssignments[0].id}`,
            label: openAssignments[0].submission ? "Continue draft" : "Open assignment",
          }
      : currentCourse && nextLesson
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
  const activity = [
    ...notifications.map((item) => ({
      id: `notification-${item.id}`,
      title: item.title,
      detail: item.message,
      date: getActivityDate(item),
      type: "UPDATE",
      to: item.href || "/app/notifications",
    })),
    ...assignments.map((item) => ({
      id: `assignment-${item.id}`,
      title: item.feedback ? `Feedback added: ${item.title}` : `Assignment submitted: ${item.title}`,
      detail: item.feedback || `Your work is ${item.status?.toLowerCase() || "saved"}.`,
      date: getActivityDate(item),
      type: item.feedback ? "FEEDBACK" : "ASSIGNMENT",
      to: item.feedback
        ? `/app/feedback/${item.id}`
        : `/app/assignments/${item.assignmentId || item.id}`,
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
        <div className="student-workspace-art" data-swarm-media="student-dashboard-art" aria-hidden="true">
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
          <h2>
            {pendingReview.length
              ? `${pendingReview.length} submitted for review`
              : openAssignments.length
                ? `${openAssignments.length} assignment${openAssignments.length === 1 ? "" : "s"} need attention`
                : "No assignments need attention"}
          </h2>
          <p>
            {pendingReview.length
              ? "Your submitted work is waiting for instructor review."
              : openAssignments.length
                ? "Open your worklist to review briefs, drafts, or requested revisions."
                : "New briefs and submission updates will appear in your assignment worklist."}
          </p>
          <Link to="/app/assignments" className="text-link">
            {pendingReview.length ? "View submissions" : openAssignments.length ? "Open assignments" : "View assignment worklist"} <span aria-hidden="true">↗</span>
          </Link>
        </article>
        <article className="student-next-step-card">
          <span className="eyebrow">RECENT FEEDBACK</span>
          {feedbackItems.length ? (
            <>
              <h2>{feedbackItems[0].title}</h2>
              <p className="student-feedback-preview">
                {feedbackItems[0].feedbackHistory?.at(-1)?.comment || feedbackItems[0].feedback}
              </p>
              <Link to="/app/feedback" className="text-link">Read all feedback <span aria-hidden="true">↗</span></Link>
            </>
          ) : (
            <>
              <h2>No feedback yet.</h2>
              <p>Feedback will appear here after your instructor reviews course work.</p>
              <Link to={openAssignments.length ? "/app/assignments" : "/app/courses"} className="text-link">
                {openAssignments.length ? "Open assignments" : "Browse course lessons"} <span aria-hidden="true">↗</span>
              </Link>
            </>
          )}
        </article>
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
            <p>Your course, assignment, and feedback updates will appear here.</p>
          )}
        </article>
      </section>

      <section className="student-dashboard-quick-links" aria-label="Creative tools">
        <Link to="/app/theme-sheet"><span>01</span><strong>Open your Theme Sheet</strong><span aria-hidden="true">↗</span></Link>
        <Link to="/app/showcase"><span>02</span><strong>Visit My Showcase</strong><span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  );
}
