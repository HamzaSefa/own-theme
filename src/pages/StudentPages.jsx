import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { courses, getAllLessons, getProgress, student } from "../data/courses";
import { adminStorageKeys, readAdminData } from "../data/adminWorkspace";
import { details } from "../data/details";
import {
  getCurrentUser,
  readStudentData,
  saveStudentData,
  setCurrentUser,
  signOut,
} from "../data/studentPortal";

const ASSIGNMENTS_KEY = "ownTheme_assignments";
const THEME_SHEET_KEY = "ownTheme_themeSheet";
const NOTIFICATIONS_KEY = "ownTheme_notifications";
const NOTIFICATION_PREFERENCES_KEY = "ownTheme_notification_preferences";
const DEFAULT_NOTIFICATION_PREFERENCES = {
  feedback: true,
  assignments: true,
  courses: true,
  billing: true,
};
const studentDashboardPath = "/app";

const themeFields = [
  ["premise", "Premise", "What is this about, and what should the viewer feel?"],
  ["rhythm", "Rhythm", "How long do you hold shots, and when do you break the pattern?"],
  ["color", "Color", "What temperature and contrast match the premise?"],
  ["sound", "Sound", "What do we hear, and where is it silent?"],
  ["typeMotion", "Type & motion", "How do words and graphics arrive and leave?"],
  ["signature", "Signature", "What recurring choice makes this feel like your work?"],
];

const studentLinks = [
  { to: studentDashboardPath, label: "Dashboard", icon: "01" },
  { to: "/app/courses", label: "My Courses", icon: "02" },
  { to: "/app/assignments", label: "Assignments", icon: "03" },
  { to: "/app/feedback", label: "Feedback", icon: "04" },
  { to: "/app/showcase", label: "My Showcase", icon: "05" },
  { to: "/app/settings", label: "Settings", icon: "06" },
];

const studentToolLinks = [
  { to: "/app/theme-sheet", label: "Theme Sheet", icon: "T" },
  { to: "/app/notifications", label: "Notifications", icon: "N" },
  { to: "/app/billing", label: "Orders & subscription", icon: "$" },
];

function useStudentUser() {
  const [user, setUser] = useState(getCurrentUser);

  useEffect(() => {
    const refresh = () => setUser(getCurrentUser());
    window.addEventListener("ownTheme:profile-updated", refresh);
    return () => window.removeEventListener("ownTheme:profile-updated", refresh);
  }, []);

  return user;
}

export function StudentRoute({ children, classroom = false }) {
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (classroom) return children;

  return <StudentLayout key={location.pathname}>{children}</StudentLayout>;
}

function StudentLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="student-platform">
      <StudentHeader menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} />
      <div className="student-shell">
        {menuOpen && (
          <button
            type="button"
            className="student-nav-backdrop"
            aria-label="Close learning space navigation"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <StudentSidebar menuOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />
        <main className="student-main">{children}</main>
      </div>
      <p className="student-demo-note">
        Student preview · Account and learning data are stored in this browser.
      </p>
    </div>
  );
}

function StudentHeader({ menuOpen, onToggleMenu }) {
  const navigate = useNavigate();
  const user = useStudentUser();

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="student-header">
      <div className="student-header-brand">
        <button
          type="button"
          className="student-menu-toggle"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="student-navigation"
          onClick={onToggleMenu}
        >
          <span />
          <span />
          <span />
        </button>
        <Link to="/" className="logo">OWN <span>THEME</span></Link>
      </div>
      <div className="student-header-user">
        <span>{user?.name || "Student"}</span>
        <button className="btn btn-outline btn-sm" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}

function StudentSidebar({ menuOpen, closeMenu }) {
  const user = useStudentUser();

  return (
    <aside className={menuOpen ? "student-sidebar open" : "student-sidebar"} id="student-navigation">
      <div className="student-sidebar-label">LEARNING SPACE</div>
      <nav aria-label="Student platform">
        {studentLinks.map((item) => (
          <NavLink
            to={item.to}
            end={item.to === studentDashboardPath}
            className={({ isActive }) => isActive ? "student-nav-link active" : "student-nav-link"}
            key={item.to}
            onClick={closeMenu}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="student-sidebar-label student-tools-label">YOUR TOOLS</div>
      <nav aria-label="Student tools">
        {studentToolLinks.map((item) => (
          <NavLink
            to={item.to}
            className={({ isActive }) => isActive ? "student-nav-link active" : "student-nav-link"}
            key={item.to}
            onClick={closeMenu}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="student-sidebar-bottom">
        <Link to="/courses">Explore courses <span aria-hidden="true">↗</span></Link>
        <small>{user?.email}</small>
      </div>
    </aside>
  );
}

function PageHeading({ eyebrow = "YOUR LEARNING SPACE", title, description, action }) {
  return (
    <header className="student-page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}

function ownedCourses() {
  return student.enrolled
    .map((enrollment) => ({
      enrollment,
      course: courses.find((course) => course.id === enrollment.courseId),
    }))
    .filter((item) => item.course);
}

function getAssignmentStatus(status) {
  const normalized = (status || "").toLowerCase();
  if (normalized.includes("revision")) return "Revision Requested";
  if (normalized === "completed" || normalized === "complete") return "Completed";
  if (normalized.includes("review")) return "Under Review";
  if (normalized.includes("feedback sent")) return "Under Review";
  if (normalized.includes("submitted") || normalized.includes("feedback")) return "Submitted";
  if (normalized === "draft") return "Draft";
  return "To Do";
}

function findSubmissionHistory(submissions, assignment) {
  return submissions
    .filter((item) => item.courseId === assignment.courseId && (
      item.assignmentId === assignment.id
      || (!item.assignmentId && item.title === assignment.title)
    ))
    .sort((a, b) => new Date(b.submittedAt || b.updatedAt || b.createdAt || 0) - new Date(a.submittedAt || a.updatedAt || a.createdAt || 0));
}

function getThemeSheets() {
  const saved = readStudentData(THEME_SHEET_KEY, []);
  if (Array.isArray(saved)) return saved;
  if (saved && typeof saved === "object" && Object.keys(saved).length) {
    return [{ id: "theme-sheet-default", title: "My Theme Sheet", values: saved, updatedAt: "" }];
  }
  return [];
}

function getOwnShowcaseProjects() {
  const email = getCurrentUser()?.email?.toLowerCase();
  if (!email) return [];
  return readStudentData(adminStorageKeys.showcaseProjects, [])
    .filter((project) => project.studentEmail?.toLowerCase() === email);
}

function saveOwnShowcaseProjects(projects) {
  const email = getCurrentUser()?.email?.toLowerCase();
  const allProjects = readStudentData(adminStorageKeys.showcaseProjects, []);
  const otherProjects = allProjects.filter((project) => project.studentEmail?.toLowerCase() !== email);
  saveStudentData(adminStorageKeys.showcaseProjects, [...projects, ...otherProjects]);
}

function getConfiguredAssignments(owned) {
  return owned.flatMap(({ course }) => course.modules.flatMap((module, moduleIndex) => {
    const configured = Array.isArray(module.assignments)
      ? module.assignments
      : module.assignment
        ? [module.assignment]
        : module.assignmentTitle
          ? [{ title: module.assignmentTitle, description: module.assignmentDescription }]
          : [];
    return configured.map((assignment, assignmentIndex) => {
      const data = typeof assignment === "string" ? { title: assignment } : assignment;
      return {
        ...data,
        id: String(data.id || `${course.id}-${moduleIndex}-${assignmentIndex}`),
        courseId: course.id,
        courseTitle: course.title,
        moduleTitle: module.title,
        moduleLessons: module.lessons || [],
        title: data.title || "Course assignment",
        instructions: data.instructions || data.description || "",
      };
    });
  }));
}

function createLocalRecordId() {
  return globalThis.crypto.randomUUID();
}

function getNotificationPreferenceKey(type) {
  if (type === "instructor_feedback" || type === "revision_requested") return "feedback";
  if (type === "assignment_status") return "assignments";
  if (type === "course_announcement" || type === "lesson_announcement") return "courses";
  if (type === "order_status" || type === "subscription_status") return "billing";
  return "";
}

function addStudentNotification(notification) {
  const preferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...readStudentData(NOTIFICATION_PREFERENCES_KEY, {}),
  };
  const preference = getNotificationPreferenceKey(notification.type);
  if (preference && !preferences[preference]) return;

  const notifications = readStudentData(NOTIFICATIONS_KEY, []);
  saveStudentData(NOTIFICATIONS_KEY, [
    {
      id: createLocalRecordId(),
      recipientEmail: getCurrentUser()?.email || "",
      createdAt: new Date().toISOString(),
      unread: true,
      ...notification,
    },
    ...notifications,
  ]);
}

export function MyCoursesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const owned = ownedCourses().map(({ course, enrollment }) => {
    const lessons = getAllLessons(course);
    const completed = (enrollment.completed || []).filter((id) =>
      lessons.some((lesson) => lesson.id === id)
    );
    const progress = getProgress(course, completed);
    const status = progress >= 100 ? "completed" : progress > 0 ? "learning" : "not-started";
    return { course, enrollment, lessons, completed, progress, status };
  });
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = owned.filter(({ course, status }) => {
    const matchesQuery = !normalizedQuery
      || `${course.title} ${course.tag}`.toLowerCase().includes(normalizedQuery);
    return matchesQuery && (statusFilter === "all" || status === statusFilter);
  });
  const filterOptions = [
    { value: "all", label: "All courses" },
    { value: "learning", label: "Currently learning" },
    { value: "not-started", label: "Not started" },
    { value: "completed", label: "Completed" },
  ];
  const sections = [
    { status: "learning", title: "Currently learning" },
    { status: "not-started", title: "Not started" },
    { status: "completed", title: "Completed" },
  ];

  return (
    <div className="student-my-courses">
      <PageHeading
        title="My courses"
        description="All the courses you can access, with your next lesson ready when you are."
      />
      <div className="student-course-controls">
        <label className="student-course-search">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Search your courses</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your courses"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear course search">
              Clear
            </button>
          )}
        </label>
        <div className="student-course-filters" role="group" aria-label="Filter courses by progress">
          {filterOptions.map((option) => (
            <button
              type="button"
              className={statusFilter === option.value ? "student-course-filter active" : "student-course-filter"}
              aria-pressed={statusFilter === option.value}
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
              {option.value === "all" && <span>{owned.length}</span>}
            </button>
          ))}
        </div>
      </div>
      {owned.length ? (
        filtered.length ? (
          <div className="student-course-sections">
            {sections.map((section) => {
              const sectionCourses = filtered.filter((item) => item.status === section.status);
              if (!sectionCourses.length) return null;
              return (
                <section className="student-course-section" key={section.status}>
                  <header className="student-course-section-heading">
                    <h2>{section.title}</h2>
                    <span>{sectionCourses.length} {sectionCourses.length === 1 ? "course" : "courses"}</span>
                  </header>
                  <div className="student-owned-course-grid">
                    {sectionCourses.map(({ course, lessons, completed, progress, status }) => {
                      const next = lessons.find((lesson) => !completed.includes(lesson.id)) || lessons[0];
                      const destination = status === "completed"
                        ? `/app/courses/${course.id}`
                        : `/app/learn/${next.id}`;
                      return (
                        <article className="student-owned-course-card" key={course.id}>
                          <div className={`student-owned-course-art student-owned-course-art-${course.id}`}>
                            <span>{course.tag}</span>
                            <i aria-hidden="true" />
                          </div>
                          <div className="student-owned-course-content">
                            <span className="eyebrow">{section.title.toUpperCase()}</span>
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
                            <div className="student-owned-course-actions">
                              <Link className="btn btn-primary" to={destination}>
                                {status === "completed" ? "Review course" : progress ? "Resume learning" : "Start course"}
                              </Link>
                              <Link className="btn btn-outline" to={`/app/courses/${course.id}`}>View curriculum</Link>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="student-course-empty">
            <span className="student-empty-mark" aria-hidden="true">⌕</span>
            <h2>No courses match that search.</h2>
            <p>Try another course name or change the progress filter.</p>
            <button type="button" className="btn btn-outline" onClick={() => { setQuery(""); setStatusFilter("all"); }}>
              Clear search and filters
            </button>
          </div>
        )
      ) : (
        <EmptyState
          title="Your first course is waiting."
          text="Courses appear here after you have access. Browse the catalog to find your next learning track."
          to="/courses"
          label="Explore course catalog"
        />
      )}
      <aside className="student-catalog-prompt">
        <div>
          <span className="eyebrow">KEEP EXPLORING</span>
          <h2>Looking for another track?</h2>
          <p>See all courses available in the public catalog. Courses without access stay out of your learning library.</p>
        </div>
        <Link className="btn btn-outline" to="/courses">Browse catalog <span aria-hidden="true">↗</span></Link>
      </aside>
    </div>
  );
}

export function CurriculumPage() {
  const { courseId } = useParams();
  const course = courses.find((item) => item.id === courseId);
  const enrollment = student.enrolled.find((item) => item.courseId === courseId);

  if (!course) return <Navigate to="/app/courses" replace />;
  if (!enrollment) return <Navigate to="/app/courses" replace />;

  const completed = (enrollment.completed || []).filter((id) =>
    getAllLessons(course).some((lesson) => lesson.id === id)
  );
  const lessons = getAllLessons(course);
  const completedLessons = new Set(completed);
  const currentLesson = lessons.find((lesson) =>
    !completedLessons.has(lesson.id) && lesson.locked !== true
  );
  const currentModuleIndex = currentLesson
    ? course.modules.findIndex((module) => module.lessons.some((lesson) => lesson.id === currentLesson.id))
    : -1;
  const progress = lessons.length ? getProgress(course, completed) : 0;
  const courseSubmissions = readStudentData(ASSIGNMENTS_KEY, [])
    .filter((assignment) => assignment.courseId === course.id);
  const moduleResources = course.modules.flatMap((module) =>
    module.lessons
      .filter((lesson) => lesson.resourceUrl)
      .map((lesson) => ({ module: module.title, lesson: lesson.title, url: lesson.resourceUrl }))
  );
  const courseSummary = details[course.id]?.promise
    || "Review your course modules, track lesson progress, and continue learning at your own pace.";

  return (
    <div className="student-course-overview">
      <PageHeading
        eyebrow={course.tag}
        title={course.title}
        description={courseSummary}
        action={currentLesson
          ? <Link className="btn btn-primary" to={`/app/learn/${currentLesson.id}`}>Resume learning</Link>
          : <Link className="btn btn-outline" to="/app/courses">Back to my courses</Link>}
      />

      <section className="student-course-progress-card" aria-label="Course progress">
        <div className="student-course-progress-topline">
          <div>
            <span className="eyebrow">YOUR PROGRESS</span>
            <h2>{progress}% complete</h2>
          </div>
          <span>{completed.length} of {lessons.length} lessons complete</span>
        </div>
        <div className="student-progress-track" role="progressbar" aria-label={`${course.title} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="student-course-overview-section">
        <header className="student-course-overview-heading">
          <div>
            <span className="eyebrow">COURSE CURRICULUM</span>
            <h2>Modules & lessons</h2>
          </div>
          <div className="student-lesson-legend" aria-label="Lesson status legend">
            <span><i className="lesson-legend-complete" />Completed</span>
            <span><i className="lesson-legend-current" />Current</span>
            <span><i className="lesson-legend-locked" />Locked</span>
          </div>
        </header>
        {course.modules.length ? (
          <div className="student-curriculum-list">
            {course.modules.map((module, index) => {
              const moduleLessons = module.lessons || [];
              const moduleCompleted = moduleLessons.filter((lesson) => completedLessons.has(lesson.id)).length;
              const moduleAssignments = Array.isArray(module.assignments)
                ? module.assignments
                : module.assignment
                  ? [module.assignment]
                  : module.assignmentTitle
                    ? [{ title: module.assignmentTitle, description: module.assignmentDescription }]
                    : [];
              return (
                <details
                  className="student-curriculum-module"
                  key={`${module.title}-${index}`}
                  open={index === currentModuleIndex}
                >
                  <summary className="student-curriculum-module-summary">
                    <span className="student-module-number">MODULE {String(index + 1).padStart(2, "0")}</span>
                    <span className="student-module-summary-title">
                      <strong>{module.title.replace(/^Module \d+:\s*/, "")}</strong>
                      <small>{moduleCompleted} of {moduleLessons.length} lessons complete</small>
                    </span>
                    <span className="student-module-count">{moduleLessons.length} lessons</span>
                    <span className="student-module-chevron" aria-hidden="true">⌄</span>
                  </summary>
                  <div className="student-module-content">
                    {details[course.id]?.modules?.find((item) => item.title === module.title)?.outcome && (
                      <p className="student-module-summary">
                        {details[course.id].modules.find((item) => item.title === module.title).outcome}
                      </p>
                    )}
                    {moduleLessons.length ? (
                      <div className="student-module-lessons">
                        {moduleLessons.map((lesson) => {
                          const isComplete = completedLessons.has(lesson.id);
                          const isLocked = lesson.locked === true;
                          const isCurrent = currentLesson?.id === lesson.id;
                          const status = isLocked ? "Locked" : isComplete ? "Completed" : isCurrent ? "Current" : "Available";
                          const className = [
                            "student-module-lesson",
                            isComplete ? "completed" : "",
                            isCurrent ? "current" : "",
                            isLocked ? "locked" : "",
                          ].filter(Boolean).join(" ");
                          const lessonContent = (
                            <>
                              <span className="student-lesson-status-icon" aria-hidden="true">
                                {isComplete ? "✓" : isLocked ? "•" : isCurrent ? "▶" : "○"}
                              </span>
                              <span className="student-module-lesson-copy">
                                <strong>{lesson.title}</strong>
                                <small>{status}</small>
                              </span>
                              {lesson.duration && <span className="student-module-lesson-duration">{lesson.duration}</span>}
                              {!isLocked && <span className="student-module-lesson-arrow" aria-hidden="true">↗</span>}
                            </>
                          );
                          return isLocked ? (
                            <div className={className} key={lesson.id} aria-label={`${lesson.title}: locked`}>
                              {lessonContent}
                            </div>
                          ) : (
                            <Link
                              className={className}
                              to={`/app/learn/${lesson.id}`}
                              key={lesson.id}
                              aria-label={`${lesson.title}: ${status}`}
                            >
                              {lessonContent}
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="student-curriculum-note">Lessons for this module have not been added yet.</p>
                    )}
                    <div className="student-module-assignment">
                      <div>
                        <span className="eyebrow">MODULE ASSIGNMENT</span>
                        {moduleAssignments.length ? (
                          moduleAssignments.map((assignment, assignmentIndex) => {
                            const assignmentTitle = typeof assignment === "string" ? assignment : assignment.title;
                            const assignmentDescription = typeof assignment === "string" ? "" : assignment.description;
                            return (
                              <div className="student-module-assignment-item" key={`${assignmentTitle}-${assignmentIndex}`}>
                                <strong>{assignmentTitle || "Assignment"}</strong>
                                {assignmentDescription && <p>{assignmentDescription}</p>}
                              </div>
                            );
                          })
                        ) : (
                          <p>No assignment has been linked to this module yet.</p>
                        )}
                      </div>
                      <Link to="/app/assignments" className="text-link">Go to assignments <span aria-hidden="true">↗</span></Link>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="student-course-empty">
            <h3>Curriculum is being prepared.</h3>
            <p>Lessons will appear here when the course curriculum is published.</p>
          </div>
        )}
      </section>

      <section className="student-course-overview-bottom">
        <article className="student-course-support-card">
          <span className="eyebrow">COURSE RESOURCES</span>
          <h2>Materials for your lessons</h2>
          {moduleResources.length ? (
            <ul className="student-course-resource-list">
              {moduleResources.map((resource) => (
                <li key={`${resource.module}-${resource.lesson}-${resource.url}`}>
                  <div>
                    <strong>{resource.lesson}</strong>
                    <small>{resource.module}</small>
                  </div>
                  <a href={resource.url} target="_blank" rel="noreferrer">Open resource ↗</a>
                </li>
              ))}
            </ul>
          ) : (
            <p>No downloadable course resources have been added to the available lessons yet.</p>
          )}
        </article>
        <article className="student-course-support-card">
          <span className="eyebrow">COMPLETION</span>
          <h2>Course completion criteria</h2>
          <p>Completion is based on marking all {lessons.length} course lessons complete.</p>
          <p>Assignments are not currently configured as a course completion requirement.</p>
          <div className="student-course-assignment-summary">
            <strong>Course submissions</strong>
            <span>{courseSubmissions.length ? `${courseSubmissions.length} submitted` : "No submissions yet"}</span>
            <Link to="/app/assignments">View assignments <span aria-hidden="true">↗</span></Link>
          </div>
        </article>
      </section>
    </div>
  );
}

export function AssignmentsPage() {
  const owned = ownedCourses();
  const submissions = readStudentData(ASSIGNMENTS_KEY, []);
  const [courseId, setCourseId] = useState(owned[0]?.course.id || "");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [showcaseConsent, setShowcaseConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [statusFilter, setStatusFilter] = useState("To Do");
  const configuredAssignments = getConfiguredAssignments(owned);
  const configuredSubmissionIds = new Set();
  const assignmentItems = configuredAssignments.map((assignment) => {
    const history = findSubmissionHistory(submissions, assignment);
    const submission = history[0];
    history.forEach((item) => configuredSubmissionIds.add(item.id));
    if (submission) configuredSubmissionIds.add(submission.id);
    return {
      ...assignment,
      submission,
      history,
      status: submission ? getAssignmentStatus(submission.status) : "To Do",
      dueDate: assignment.dueDate || null,
    };
  });
  const unlinkedSubmissions = submissions
    .filter((item) => owned.some(({ course }) => course.id === item.courseId))
    .filter((item) => !configuredSubmissionIds.has(item.id))
    .map((item) => {
      const course = owned.find(({ course: ownedCourse }) => ownedCourse.id === item.courseId)?.course;
      return {
        id: item.assignmentId || item.id,
        courseId: item.courseId,
        courseTitle: course?.title || "Course",
        title: item.title,
        instructions: item.notes || "Student project submitted for instructor review.",
        dueDate: null,
        lessonId: item.lessonId,
        status: getAssignmentStatus(item.status),
        submission: item,
      };
    });
  const allAssignmentItems = [...assignmentItems, ...unlinkedSubmissions];
  const filterOptions = ["To Do", "Draft", "Submitted", "Under Review", "Revision Requested", "Completed"];
  const filteredAssignments = allAssignmentItems.filter((item) => item.status === statusFilter);
  const selectedAssignment = configuredAssignments.find((item) => item.id === selectedAssignmentId);

  function submitAssignment(event) {
    event.preventDefault();
    const submissionId = createLocalRecordId();
    const updated = [
      {
        id: submissionId,
        courseId,
        assignmentId: selectedAssignment?.id || "",
        lessonId: selectedAssignment?.lessonId || selectedAssignment?.moduleLessons[0]?.id || "",
        studentEmail: getCurrentUser()?.email || "",
        title: title.trim(),
        url: url.trim(),
        notes: notes.trim(),
        showcaseConsent,
        showcasePublished: false,
        submittedAt: new Date().toISOString(),
        status: "Submitted",
      },
      ...submissions,
    ];
    saveStudentData(ASSIGNMENTS_KEY, updated);
    addStudentNotification({
      title: "Assignment submitted",
      message: `${title.trim()} is saved and awaiting instructor review.`,
      type: "assignment_status",
      href: `/app/assignments/${selectedAssignment?.id || submissionId}`,
    });
    setTitle("");
    setUrl("");
    setNotes("");
    setShowcaseConsent(false);
    setSelectedAssignmentId("");
    setMessage("Assignment saved in this browser preview. Instructor submission sync is not connected.");
    window.dispatchEvent(new Event("ownTheme:student-data"));
  }

  function startAssignment(assignment) {
    setSelectedAssignmentId(assignment.id);
    setCourseId(assignment.courseId);
    setTitle(assignment.title);
    setMessage("");
    window.requestAnimationFrame(() => {
      document.getElementById("assignment-submission-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="student-assignments-page">
      <PageHeading
        title="Assignments"
        description="See what needs attention, track your submissions, and open the lessons connected to your projects."
      />
      <section className="student-assignment-overview">
        <div className="student-assignment-overview-copy">
          <span className="eyebrow">YOUR PRACTICE</span>
          <h2>{allAssignmentItems.length ? "Keep your projects moving." : "Your assignment space is ready."}</h2>
          <p>
            {allAssignmentItems.length
              ? "Start an available brief or follow up on work you have already submitted."
              : "Assignment briefs and due dates have not been configured for your enrolled courses yet. You can still submit a project for feedback."}
          </p>
        </div>
        <div className="student-assignment-counts" aria-label="Assignment totals">
          {filterOptions.map((status) => (
            <div key={status}><strong>{allAssignmentItems.filter((item) => item.status === status).length}</strong><span>{status}</span></div>
          ))}
        </div>
      </section>

      <section className="student-assignment-worklist">
        <header className="student-assignment-list-heading">
          <div><span className="eyebrow">ASSIGNMENT WORKLIST</span><h2>What needs your attention?</h2></div>
          {owned.length > 0 && <a className="text-link" href="#assignment-submission-form">Submit a project <span aria-hidden="true">↓</span></a>}
        </header>
        <div className="student-assignment-filters" role="group" aria-label="Filter assignments">
          {filterOptions.map((status) => (
            <button type="button" className={statusFilter === status ? "student-course-filter active" : "student-course-filter"} aria-pressed={statusFilter === status} key={status} onClick={() => setStatusFilter(status)}>
              {status}<span>{allAssignmentItems.filter((item) => item.status === status).length}</span>
            </button>
          ))}
        </div>
        {filteredAssignments.length ? (
          <div className="student-assignment-cards">
            {filteredAssignments.map((item) => {
              const status = item.status;
              const relatedLesson = item.lessonId
                ? courses.find((course) => course.id === item.courseId)?.modules.flatMap((module) => module.lessons || []).find((lesson) => lesson.id === item.lessonId)
                : item.moduleLessons?.[0];
              return (
                <article className="student-assignment-card" key={`${item.courseId}-${item.id}`}>
                  <Link className="student-assignment-card-main" to={`/app/assignments/${item.id}`}>
                  <div className="student-assignment-card-heading">
                    <span className={`student-assignment-status status-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>
                    {item.dueDate && !Number.isNaN(new Date(item.dueDate).getTime()) && <span className="student-assignment-due">Due {new Date(item.dueDate).toLocaleDateString()}</span>}
                  </div>
                  <span className="eyebrow">{item.courseTitle}{item.moduleTitle ? ` · ${item.moduleTitle}` : ""}</span>
                  <h3>{item.title}</h3>
                  <p>{item.instructions || "Assignment instructions have not been provided."}</p>
                  </Link>
                  {item.submission?.feedback && <div className="student-assignment-feedback"><strong>Instructor feedback</strong><p>{item.submission.feedback}</p></div>}
                  <div className="student-assignment-card-footer">
                    <span className="student-assignment-action">
                      {status === "To Do" ? "Action required: submit your work." : status === "Revision Requested" ? "Action required: revise and resubmit." : status === "Submitted" ? "Your submission is awaiting review." : "This assignment is complete."}
                    </span>
                    <div className="student-assignment-card-links">
                      {relatedLesson && <Link to={`/app/learn/${relatedLesson.id}`}>Related lesson ↗</Link>}
                      {item.submission?.url && <a href={item.submission.url} target="_blank" rel="noreferrer">Open submission ↗</a>}
                      {status === "To Do" && <button type="button" onClick={() => startAssignment(item)}>Start assignment →</button>}
                      {item.submission?.feedback && <Link to={`/app/feedback/${item.submission.id}`}>Read feedback ↗</Link>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="student-course-empty">
            <span className="student-empty-mark" aria-hidden="true">✓</span>
            <h2>{statusFilter === "To Do" ? "No assignments to do." : `No ${statusFilter.toLowerCase()} assignments.`}</h2>
            <p>{statusFilter === "To Do" ? "No assignment briefs are configured right now. You can submit independent course work below." : "Assignments in this status will appear here when available."}</p>
          </div>
        )}
      </section>

      {owned.length ? (
        <form id="assignment-submission-form" className="student-form-panel student-assignment-submit-form" onSubmit={submitAssignment}>
          <span className="eyebrow">PROJECT SUBMISSION</span>
          <h2>{selectedAssignment ? `Submit: ${selectedAssignment.title}` : "Submit a project for feedback"}</h2>
          {selectedAssignment?.instructions && <p className="student-assignment-instructions">{selectedAssignment.instructions}</p>}
          <div className="field">
            <label htmlFor="assignment-course">Course</label>
            <select id="assignment-course" className="select" value={courseId} onChange={(e) => { setCourseId(e.target.value); setSelectedAssignmentId(""); }}>
              {owned.map(({ course }) => <option value={course.id} key={course.id}>{course.title}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="assignment-title">Project or assignment name</label>
            <input id="assignment-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. One-minute city portrait" />
          </div>
          <div className="field">
            <label htmlFor="assignment-url">Project link</label>
            <input id="assignment-url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="field">
            <label htmlFor="assignment-notes">What choices are you exploring?</label>
            <textarea id="assignment-notes" rows="4" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tell your instructor what you want feedback on." />
          </div>
          <label className="consent-check">
            <input type="checkbox" checked={showcaseConsent} onChange={(e) => setShowcaseConsent(e.target.checked)} />
            <span>I give permission for this project to be considered for the public Own Theme showcase. An instructor must still approve it.</span>
          </label>
          <button className="btn btn-primary" type="submit">Save submission</button>
          {message && <p className="form-success" role="status">{message}</p>}
        </form>
      ) : (
        <EmptyState title="Enroll to submit an assignment." text="Your assignments will be connected to the courses you have access to." to="/courses" label="Explore courses" />
      )}
      <p className="student-demo-callout">Submissions in this preview are saved in this browser. Instructor review, due dates, and backend submission sync are not connected.</p>
    </div>
  );
}

export function AssignmentDetailPage() {
  const { assignmentId } = useParams();
  const owned = ownedCourses();
  const submissions = readStudentData(ASSIGNMENTS_KEY, []);
  const configured = getConfiguredAssignments(owned).find((item) => item.id === assignmentId);
  const directSubmission = submissions.find((item) =>
    item.id === assignmentId || item.assignmentId === assignmentId
  );
  const courseId = configured?.courseId || directSubmission?.courseId;
  const course = courses.find((item) => item.id === courseId);
  const assignment = configured || (directSubmission && {
    id: String(directSubmission.assignmentId || directSubmission.id),
    courseId: directSubmission.courseId,
    courseTitle: course?.title || "Course",
    title: directSubmission.title,
    instructions: directSubmission.instructions || directSubmission.notes,
    criteria: directSubmission.criteria || [],
    deliverables: directSubmission.deliverables || [],
    lessonId: directSubmission.lessonId,
    status: getAssignmentStatus(directSubmission.status),
    dueDate: null,
  });
  const history = assignment
    ? findSubmissionHistory(submissions, assignment)
    : [];
  const latest = history[0] || directSubmission;
  const themeSheets = getThemeSheets();
  const [url, setUrl] = useState(latest?.url || "");
  const [notes, setNotes] = useState(latest?.notes || "");
  const [themeSheetId, setThemeSheetId] = useState(latest?.themeSheetId || "");
  const [message, setMessage] = useState("");

  if (!assignment || !course || !owned.some((item) => item.course.id === course.id)) {
    return <Navigate to="/app/assignments" replace />;
  }

  const lessons = getAllLessons(course);
  const relatedLessons = assignment.lessonId
    ? lessons.filter((lesson) => lesson.id === assignment.lessonId)
    : assignment.moduleLessons?.length
      ? assignment.moduleLessons
      : [];
  const status = latest ? getAssignmentStatus(latest.status) : "To Do";
  const criteria = Array.isArray(assignment.criteria)
    ? assignment.criteria
    : assignment.evaluationCriteria || [];
  const deliverables = Array.isArray(assignment.deliverables)
    ? assignment.deliverables
    : [];
  const canSubmit = status !== "Completed";

  function saveSubmission(nextStatus) {
    const now = new Date().toISOString();
    const submission = {
      id: createLocalRecordId(),
      assignmentId: assignment.id,
      courseId: course.id,
      lessonId: assignment.lessonId || relatedLessons[0]?.id || "",
      studentEmail: latest?.studentEmail || getCurrentUser()?.email || "",
      title: assignment.title,
      url: url.trim(),
      notes: notes.trim(),
      themeSheetId,
      themeSheetSnapshot: themeSheets.find((sheet) => sheet.id === themeSheetId) || null,
      status: nextStatus,
      revision: history.length + 1,
      previousSubmissionId: latest?.id || "",
      submittedAt: nextStatus === "Draft" ? "" : now,
      updatedAt: now,
      showcaseConsent: latest?.showcaseConsent || false,
      showcasePublished: false,
      feedbackHistory: [],
    };
    saveStudentData(ASSIGNMENTS_KEY, [submission, ...submissions]);
    if (nextStatus !== "Draft") {
      addStudentNotification({
        title: latest ? "Assignment resubmitted" : "Assignment submitted",
        message: `${assignment.title} is saved and awaiting instructor review.`,
        type: "assignment_status",
        href: `/app/assignments/${assignment.id}`,
      });
    }
    setMessage(nextStatus === "Draft"
      ? "Draft saved in this browser preview."
      : "Submission saved in this browser preview. Instructor submission sync is not connected.");
    window.dispatchEvent(new Event("ownTheme:student-data"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!url.trim()) {
      setMessage("Add a video or project link before submitting.");
      return;
    }
    saveSubmission("Submitted");
  }

  return (
    <div className="student-assignment-detail">
      <Link to="/app/assignments" className="student-detail-back">← Back to assignments</Link>
      <header className="student-assignment-detail-heading">
        <div>
          <span className="eyebrow">{course.title}</span>
          <h1>{assignment.title}</h1>
          <p>{assignment.objective || assignment.instructions || "Assignment objective and instructions have not been provided yet."}</p>
        </div>
        <span className={`student-assignment-status status-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>
      </header>

      <div className="student-assignment-detail-grid">
        <main className="student-assignment-detail-main">
          <section className="student-assignment-detail-card">
            <span className="eyebrow">INSTRUCTIONS</span>
            <h2>What to make</h2>
            <p>{assignment.instructions || "Detailed instructions will be added when the assignment brief is configured."}</p>
            {assignment.dueDate && !Number.isNaN(new Date(assignment.dueDate).getTime()) ? (
              <p className="student-assignment-due">Due {new Date(assignment.dueDate).toLocaleDateString()}</p>
            ) : (
              <p className="student-assignment-policy-note">No deadline is configured for this assignment. Deadline policy is pending confirmation.</p>
            )}
          </section>

          <section className="student-assignment-detail-card">
            <span className="eyebrow">EVALUATION</span>
            <h2>Evaluation criteria</h2>
            {criteria.length ? (
              <ul className="student-assignment-criteria">
                {criteria.map((criterion, index) => (
                  <li key={`${typeof criterion === "string" ? criterion : criterion.title}-${index}`}>
                    <strong>{typeof criterion === "string" ? criterion : criterion.title}</strong>
                    {typeof criterion !== "string" && criterion.description && <p>{criterion.description}</p>}
                  </li>
                ))}
              </ul>
            ) : <p>Evaluation criteria have not been added to this assignment yet.</p>}
            <h3>Required deliverables</h3>
            {deliverables.length ? (
              <ul className="student-assignment-criteria">
                {deliverables.map((deliverable, index) => <li key={`${deliverable}-${index}`}>{typeof deliverable === "string" ? deliverable : deliverable.title}</li>)}
              </ul>
            ) : <p>Required deliverables have not been specified. Include your work link and any context your instructor needs.</p>}
          </section>

          <section className="student-assignment-detail-card">
            <span className="eyebrow">RELATED LESSONS</span>
            <h2>Review the course material</h2>
            {relatedLessons.length ? (
              <ul className="student-assignment-related-lessons">
                {relatedLessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link to={`/app/learn/${lesson.id}`}>{lesson.title} <span aria-hidden="true">↗</span></Link>
                  </li>
                ))}
              </ul>
            ) : <p>No lesson is linked to this assignment yet.</p>}
          </section>

          {history.length > 0 && (
            <section className="student-assignment-detail-card">
              <span className="eyebrow">SUBMISSION HISTORY</span>
              <h2>Your attempts</h2>
              <div className="student-submission-history">
                {history.map((item, index) => (
                  <article key={item.id}>
                    <div className="student-submission-history-heading">
                      <strong>{item.status === "Draft" ? "Draft" : `Attempt ${item.revision || history.length - index}`}</strong>
                      <span className={`student-assignment-status status-${getAssignmentStatus(item.status).toLowerCase().replaceAll(" ", "-")}`}>{getAssignmentStatus(item.status)}</span>
                    </div>
                    <small>{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : `Saved ${new Date(item.updatedAt || item.createdAt || 0).toLocaleString()}`}</small>
                    {item.url && <a href={item.url} target="_blank" rel="noreferrer">Open submitted work ↗</a>}
                    {item.notes && <p>{item.notes}</p>}
                    {item.feedback && <div className="student-assignment-feedback"><strong>Instructor feedback</strong><p>{item.feedback}</p></div>}
                    {item.feedbackHistory?.map((feedback, feedbackIndex) => (
                      <div className="student-assignment-feedback" key={`${item.id}-feedback-${feedbackIndex}`}>
                        <strong>{feedback.status || "Instructor feedback"}</strong>
                        <p>{feedback.comment}</p>
                        {feedback.createdAt && <small>{new Date(feedback.createdAt).toLocaleString()}</small>}
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="student-assignment-submit-aside">
          <form className="student-assignment-detail-card student-assignment-detail-form" onSubmit={handleSubmit}>
            <span className="eyebrow">{status === "Revision Requested" ? "RESUBMISSION" : "YOUR WORK"}</span>
            <h2>{status === "Revision Requested" ? "Revise and resubmit" : latest ? "Update your submission" : "Submit your work"}</h2>
            {status === "Revision Requested" && latest?.revisionRequirements && (
              <p className="student-revision-requirements">{latest.revisionRequirements}</p>
            )}
            <label className="field">
              <span>Video or project link</span>
              <input type="url" required={canSubmit} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" />
            </label>
            <p className="student-upload-note">File upload is not available in this preview. Share a link to a permitted hosted video or project.</p>
            <label className="field">
              <span>Optional notes for your instructor</span>
              <textarea rows="4" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What should your instructor focus on?" />
            </label>
            <label className="field">
              <span>Attach a Theme Sheet</span>
              <select value={themeSheetId} onChange={(event) => setThemeSheetId(event.target.value)}>
                <option value="">No Theme Sheet attached</option>
                {themeSheets.map((sheet) => <option value={sheet.id} key={sheet.id}>{sheet.title || "Untitled Theme Sheet"}</option>)}
              </select>
            </label>
            {themeSheetId && (
              <Link to="/app/theme-sheet" className="text-link">Edit attached Theme Sheet <span aria-hidden="true">↗</span></Link>
            )}
            {canSubmit && (
              <div className="student-assignment-detail-actions">
                <button type="button" className="btn btn-outline" onClick={() => saveSubmission("Draft")}>Save draft</button>
                <button type="submit" className="btn btn-primary">{latest ? "Resubmit work" : "Submit assignment"}</button>
              </div>
            )}
            {status === "Completed" && <p className="student-assignment-policy-note">This assignment is marked completed. Contact your instructor if you need to submit another version.</p>}
            {message && <p className="form-success" role="status">{message}</p>}
            <p className="student-demo-callout">Submissions and drafts are stored in this browser preview only.</p>
          </form>
        </aside>
      </div>
    </div>
  );
}

export function ThemeSheetPage() {
  const [sheets, setSheets] = useState(getThemeSheets);
  const [selectedId, setSelectedId] = useState(() => getThemeSheets()[0]?.id || "");
  const [values, setValues] = useState(() => getThemeSheets()[0]?.values || {});
  const [title, setTitle] = useState(() => getThemeSheets()[0]?.title || "");
  const [message, setMessage] = useState("");

  function selectSheet(id) {
    const selected = sheets.find((sheet) => sheet.id === id);
    setSelectedId(id);
    setValues(selected?.values || {});
    setTitle(selected?.title || "");
    setMessage("");
  }

  function createSheet() {
    const sheet = {
      id: createLocalRecordId(),
      title: `Theme Sheet ${sheets.length + 1}`,
      values: {},
      updatedAt: "",
    };
    const updated = [sheet, ...sheets];
    setSheets(updated);
    saveStudentData(THEME_SHEET_KEY, updated);
    setSelectedId(sheet.id);
    setValues(sheet.values);
    setTitle(sheet.title);
    setMessage("");
  }

  function saveSheet(event) {
    event.preventDefault();
    const sheet = {
      id: selectedId || createLocalRecordId(),
      title: title.trim() || "Untitled Theme Sheet",
      values,
      updatedAt: new Date().toISOString(),
    };
    const updated = [sheet, ...sheets.filter((item) => item.id !== sheet.id)];
    setSheets(updated);
    setSelectedId(sheet.id);
    saveStudentData(THEME_SHEET_KEY, updated);
    setMessage("Theme Sheet draft saved in this browser.");
  }

  function downloadSheet() {
    const content = [
      title.trim() || "Own Theme Sheet",
      "",
      ...themeFields.flatMap(([key, label, prompt]) => [
        `${label}`,
        prompt,
        values[key] || "(No notes yet)",
        "",
      ]),
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(title.trim() || "own-theme-sheet").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="student-theme-sheet-page">
      <PageHeading
        title="Your Theme Sheet"
        description="Plan the six creative decisions behind your edit. Save drafts, return to them later, or attach a sheet to an assignment."
        action={<button type="button" className="btn btn-outline" onClick={createSheet}>+ New Theme Sheet</button>}
      />
      {sheets.length > 1 && (
        <label className="student-theme-sheet-picker">
          <span>Open a saved sheet</span>
          <select value={selectedId} onChange={(event) => selectSheet(event.target.value)}>
            {sheets.map((sheet) => <option value={sheet.id} key={sheet.id}>{sheet.title || "Untitled Theme Sheet"}</option>)}
          </select>
        </label>
      )}
      <form className="theme-sheet-form" onSubmit={saveSheet}>
        <label className="student-theme-sheet-title">
          <span>Sheet name</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name this Theme Sheet" />
        </label>
        {themeFields.map(([key, label, prompt], index) => (
          <label className="theme-sheet-field" htmlFor={`theme-${key}`} key={key}>
            <span className="num">{String(index + 1).padStart(2, "0")}</span>
            <span><strong>{label}</strong><small>{prompt}</small></span>
            <textarea id={`theme-${key}`} rows="3" value={values[key] || ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} placeholder="Write your current thinking…" />
          </label>
        ))}
        <div className="theme-sheet-actions">
          <p>Changes stay on this device until you save them.</p>
          <div className="student-theme-sheet-buttons">
            <button type="button" className="btn btn-outline" onClick={downloadSheet}>Download .txt</button>
            <button className="btn btn-primary" type="submit">Save draft</button>
          </div>
        </div>
        {message && <p className="form-success" role="status">{message}</p>}
      </form>
      <p className="student-demo-callout">Theme Sheets are saved in this browser. Attach a saved sheet when submitting an assignment.</p>
    </div>
  );
}

export function FeedbackPage() {
  const { submissionId } = useParams();
  const submissions = readStudentData(ASSIGNMENTS_KEY, []);
  const feedbackSubmissions = submissions.filter((item) =>
    item.feedback
    || item.feedbackHistory?.length
    || getAssignmentStatus(item.status) === "Revision Requested"
  );
  const selectedSubmission = submissionId
    ? submissions.find((item) => item.id === submissionId)
    : null;
  const revisionItems = feedbackSubmissions.filter((item) => getAssignmentStatus(item.status) === "Revision Requested");
  const completedReviews = feedbackSubmissions.filter((item) => getAssignmentStatus(item.status) === "Completed");

  return (
    <div className="student-feedback-page">
      <PageHeading
        title={selectedSubmission ? `Feedback: ${selectedSubmission.title}` : "Instructor feedback"}
        description={selectedSubmission ? "Review the comments attached to this submission and open your work or assignment." : "Review recent comments, revision requests, and completed assignment reviews."}
        action={selectedSubmission && <Link className="btn btn-outline" to="/app/feedback">All feedback</Link>}
      />
      {selectedSubmission ? (
        <FeedbackDetail key={selectedSubmission.id} submission={selectedSubmission} />
      ) : (
        <>
          <div className="student-feedback-overview">
            <article><span className="eyebrow">RECENT FEEDBACK</span><strong>{feedbackSubmissions.length}</strong><small>submission threads with feedback</small></article>
            <article><span className="eyebrow">REVISION REQUESTED</span><strong>{revisionItems.length}</strong><small>need another pass</small></article>
            <article><span className="eyebrow">COMPLETED REVIEWS</span><strong>{completedReviews.length}</strong><small>marked complete</small></article>
          </div>
          {feedbackSubmissions.length ? (
            <div className="student-feedback-list">
              {feedbackSubmissions.map((item) => (
                <article className="student-feedback-item" key={item.id}>
                  <div className="student-feedback-item-heading">
                    <div><span className="eyebrow">{courses.find((course) => course.id === item.courseId)?.title || "Course"}</span><h2>{item.title}</h2></div>
                    <span className={`student-assignment-status status-${getAssignmentStatus(item.status).toLowerCase().replaceAll(" ", "-")}`}>{getAssignmentStatus(item.status)}</span>
                  </div>
                  <p>{item.feedbackHistory?.[item.feedbackHistory.length - 1]?.comment || item.feedback}</p>
                  <div className="student-feedback-item-footer">
                    <small>{item.submittedAt ? `Submitted ${new Date(item.submittedAt).toLocaleDateString()}` : "Submission date unavailable"} · {item.feedbackHistory?.length || (item.feedback ? 1 : 0)} feedback updates</small>
                    <Link to={`/app/feedback/${item.id}`}>Open feedback details ↗</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Your feedback space is ready."
              text="Instructor comments will appear here when feedback is added to a submission."
              to="/app/assignments"
              label="Go to assignments"
            />
          )}
        </>
      )}
      <p className="student-demo-callout">Feedback and review statuses shown here are browser-preview data. Instructor notifications and backend sync are not connected.</p>
    </div>
  );
}

function FeedbackDetail({ submission }) {
  const feedbackHistory = submission.feedbackHistory?.length
    ? submission.feedbackHistory
    : submission.feedback
      ? [{ comment: submission.feedback, status: submission.status, createdAt: submission.feedbackAt || "" }]
      : [];
  const [reviewed, setReviewed] = useState(Boolean(submission.reviewedByStudentAt));
  const [message, setMessage] = useState("");

  function markReviewed() {
    const updated = readStudentData(ASSIGNMENTS_KEY, []).map((item) => item.id === submission.id
      ? { ...item, reviewedByStudentAt: new Date().toISOString() }
      : item);
    saveStudentData(ASSIGNMENTS_KEY, updated);
    setReviewed(true);
    setMessage("Marked as reviewed in this browser.");
  }

  return (
    <div className="student-feedback-detail">
      <section className="student-assignment-detail-card">
        <span className="eyebrow">SUBMITTED WORK</span>
        <h2>{submission.title}</h2>
        <p>{courses.find((course) => course.id === submission.courseId)?.title || "Course"}</p>
        {submission.url && <a href={submission.url} target="_blank" rel="noreferrer">Open submitted work ↗</a>}
        {submission.notes && <p>{submission.notes}</p>}
        {submission.revisionRequirements && <div className="student-revision-requirements"><strong>Revision requested</strong><p>{submission.revisionRequirements}</p></div>}
        <div className="student-feedback-detail-actions">
          <Link className="btn btn-outline" to={`/app/assignments/${submission.assignmentId || submission.id}`}>Open assignment</Link>
          {getAssignmentStatus(submission.status) === "Revision Requested" && (
            <Link className="btn btn-primary" to={`/app/assignments/${submission.assignmentId || submission.id}`}>Revise and resubmit</Link>
          )}
          {!reviewed && <button className="btn btn-outline" type="button" onClick={markReviewed}>Mark as reviewed</button>}
        </div>
        {message && <p className="form-success" role="status">{message}</p>}
      </section>
      <section className="student-assignment-detail-card">
        <span className="eyebrow">FEEDBACK THREAD</span>
        <h2>Instructor comments</h2>
        {feedbackHistory.length ? (
          <div className="student-feedback-thread">
            {feedbackHistory.map((item, index) => (
              <article key={`${submission.id}-feedback-${index}`}>
                <div><strong>{item.status || "Instructor comment"}</strong>{item.createdAt && <small>{new Date(item.createdAt).toLocaleString()}</small>}</div>
                <p>{item.comment}</p>
                {item.criteria?.length > 0 && <ul>{item.criteria.map((criterion, criterionIndex) => <li key={`${criterion}-${criterionIndex}`}>{criterion}</li>)}</ul>}
              </article>
            ))}
          </div>
        ) : <p>No instructor comments have been added to this submission yet.</p>}
      </section>
    </div>
  );
}

export function MyShowcasePage() {
  const currentEmail = getCurrentUser()?.email?.toLowerCase();
  const submissions = readStudentData(ASSIGNMENTS_KEY, []).filter((item) =>
    !item.studentEmail || item.studentEmail.toLowerCase() === currentEmail
  );
  const [projects, setProjects] = useState(getOwnShowcaseProjects);
  const [assignments, setAssignments] = useState(submissions);
  const [editingId, setEditingId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [courseId, setCourseId] = useState(ownedCourses()[0]?.course.id || "");
  const [assignmentId, setAssignmentId] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const owned = ownedCourses();
  const assignmentOptions = getConfiguredAssignments(owned);
  const linkedSubmissions = assignments.filter((item) =>
    item.url && /^https?:\/\//i.test(item.url) && !item.status?.toLowerCase().includes("draft")
  );

  function resetForm(clearMessage = true) {
    setEditingId("");
    setTitle("");
    setDescription("");
    setMediaUrl("");
    setCourseId(owned[0]?.course.id || "");
    setAssignmentId("");
    setVisibility("private");
    setConsent(false);
    if (clearMessage) setMessage("");
  }

  function editProject(project) {
    setEditingId(project.id);
    setTitle(project.title || "");
    setDescription(project.description || "");
    setMediaUrl(project.mediaUrl || "");
    setCourseId(project.courseId || owned[0]?.course.id || "");
    setAssignmentId(project.assignmentId || "");
    setVisibility(project.showcaseConsent ? "public" : "private");
    setConsent(Boolean(project.showcaseConsent));
    setMessage("");
    document.getElementById("showcase-project-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function saveProject(event) {
    event.preventDefault();
    const url = mediaUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setMessage("Enter a valid http or https media link.");
      return;
    }
    if (visibility === "public" && !consent) {
      setMessage("To request public display, confirm your consent. Otherwise, keep this project private.");
      return;
    }
    const selectedAssignment = assignmentOptions.find((item) => item.id === assignmentId);
    const previous = projects.find((item) => item.id === editingId);
    const project = {
      id: editingId || createLocalRecordId(),
      title: title.trim(),
      description: description.trim(),
      mediaUrl: url,
      url,
      courseId: selectedAssignment?.courseId || courseId,
      assignmentId,
      studentEmail: getCurrentUser()?.email || "",
      showcaseConsent: visibility === "public" && consent,
      showcasePublished: Boolean(previous?.showcasePublished && visibility === "public" && consent
        && previous.title === title.trim()
        && previous.description === description.trim()
        && previous.mediaUrl === url
        && previous.courseId === (selectedAssignment?.courseId || courseId)),
      updatedAt: new Date().toISOString(),
    };
    const updated = [project, ...projects.filter((item) => item.id !== project.id)];
    setProjects(updated);
    saveOwnShowcaseProjects(updated);
    const savedMessage = project.showcasePublished
      ? "Project changes saved."
      : project.showcaseConsent
        ? "Project saved as private while it awaits instructor approval."
        : "Project saved privately.";
    resetForm(false);
    setMessage(savedMessage);
    window.dispatchEvent(new Event("ownTheme:student-data"));
  }

  function removeProject(project) {
    if (!window.confirm(`Remove "${project.title}" from your showcase?`)) return;
    const updated = projects.filter((item) => item.id !== project.id);
    setProjects(updated);
    saveOwnShowcaseProjects(updated);
    if (editingId === project.id) resetForm();
  }

  function setSubmissionVisibility(item, isPublic) {
    const updated = assignments.map((record) => record.id === item.id
      ? { ...record, showcaseConsent: isPublic, showcasePublished: false }
      : record);
    const allSubmissions = readStudentData(ASSIGNMENTS_KEY, []);
    saveStudentData(ASSIGNMENTS_KEY, allSubmissions.map((record) => record.id === item.id
      ? { ...record, showcaseConsent: isPublic, showcasePublished: false }
      : record));
    setAssignments(updated);
    setMessage(isPublic
      ? "Consent saved. Instructor approval is still required before public display."
      : "This project is now private and removed from the public showcase.");
    window.dispatchEvent(new Event("ownTheme:student-data"));
  }

  function getVisibilityStatus(item) {
    if (item.showcasePublished && item.showcaseConsent) return "Published";
    return item.showcaseConsent ? "Awaiting instructor approval" : "Private";
  }

  return (
    <div className="student-showcase-manager">
      <PageHeading
        title="My showcase"
        description="Manage the projects you may want to share. Projects stay private unless you give consent, and public display requires instructor approval."
        action={<a className="btn btn-outline" href="#showcase-project-form">+ Add a project</a>}
      />
      {projects.length || linkedSubmissions.length ? (
        <section className="student-showcase-project-list" aria-label="Your projects">
          {[...projects.map((item) => ({ ...item, projectRecord: true })), ...linkedSubmissions.map((item) => ({ ...item, projectRecord: false }))].map((item) => {
            const course = courses.find((entry) => entry.id === item.courseId);
            return (
              <article className="student-showcase-project" key={`${item.projectRecord ? "project" : "submission"}-${item.id}`}>
                <div className="student-showcase-project-heading">
                  <div><span className="eyebrow">{course?.title || "Own Theme project"}{item.assignmentId ? " · Assignment" : ""}</span><h2>{item.title}</h2></div>
                  <span className={`student-showcase-status ${item.showcasePublished && item.showcaseConsent ? "published" : item.showcaseConsent ? "pending" : "private"}`}>{getVisibilityStatus(item)}</span>
                </div>
                <p>{item.projectRecord ? item.description || "No description added." : item.notes || "Assignment submission"}</p>
                <div className="student-showcase-project-links">
                  <a href={item.projectRecord ? item.mediaUrl : item.url} target="_blank" rel="noreferrer">Open media ↗</a>
                  {item.assignmentId && <Link to={`/app/assignments/${item.assignmentId}`}>Related assignment ↗</Link>}
                </div>
                {item.projectRecord ? (
                  <div className="student-showcase-project-actions">
                    <button className="btn btn-outline btn-sm" type="button" onClick={() => editProject(item)}>Edit</button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => removeProject(item)}>Remove</button>
                  </div>
                ) : (
                  <label className="student-showcase-consent">
                    <input type="checkbox" checked={Boolean(item.showcaseConsent)} onChange={(event) => setSubmissionVisibility(item, event.target.checked)} />
                    <span>Give consent to be considered for public display. Instructor approval is required.</span>
                  </label>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <section className="student-empty">
          <span className="student-empty-mark" aria-hidden="true">OT</span>
          <h2>Your projects stay yours.</h2>
          <p>Add a project to organize it here. It remains private unless you explicitly consent to public display.</p>
        </section>
      )}
      <form id="showcase-project-form" className="student-form-panel student-showcase-form" onSubmit={saveProject}>
        <span className="eyebrow">{editingId ? "EDIT PROJECT" : "NEW PROJECT"}</span>
        <h2>{editingId ? "Update your project" : "Add a project"}</h2>
        <div className="field">
          <label htmlFor="showcase-title">Project title</label>
          <input id="showcase-title" required value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="showcase-description">Description</label>
          <textarea id="showcase-description" rows="4" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the creative goal or choices behind your edit." />
        </div>
        <div className="field">
          <label htmlFor="showcase-media-url">Media link</label>
          <input id="showcase-media-url" type="url" required value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https://…" />
        </div>
        <div className="field">
          <label htmlFor="showcase-course">Associated course</label>
          <select id="showcase-course" value={courseId} onChange={(event) => { setCourseId(event.target.value); setAssignmentId(""); }}>
            <option value="">No associated course</option>
            {owned.map(({ course: item }) => <option value={item.id} key={item.id}>{item.title}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="showcase-assignment">Associated assignment (optional)</label>
          <select id="showcase-assignment" value={assignmentId} onChange={(event) => setAssignmentId(event.target.value)}>
            <option value="">No associated assignment</option>
            {assignmentOptions.filter((item) => item.courseId === courseId).map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
            {assignments.filter((item) => item.courseId === courseId && item.assignmentId && !assignmentOptions.some((assignment) => assignment.id === item.assignmentId)).map((item) => <option value={item.assignmentId} key={item.assignmentId}>{item.title}</option>)}
          </select>
        </div>
        <fieldset className="student-showcase-visibility">
          <legend>Visibility</legend>
          <label><input type="radio" name="showcase-visibility" value="private" checked={visibility === "private"} onChange={() => { setVisibility("private"); setConsent(false); }} /><span>Keep private</span></label>
          <label><input type="radio" name="showcase-visibility" value="public" checked={visibility === "public"} onChange={() => setVisibility("public")} /><span>Request public display</span></label>
          {visibility === "public" && <label className="consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I consent to this project being considered for the public showcase. An instructor must approve it first.</span></label>}
        </fieldset>
        <div className="student-showcase-project-actions">
          <button className="btn btn-primary" type="submit">{editingId ? "Save changes" : "Save project"}</button>
          {editingId && <button className="btn btn-outline" type="button" onClick={resetForm}>Cancel edit</button>}
        </div>
        {message && <p className="form-success" role="status">{message}</p>}
        <p className="student-demo-callout">Projects are stored in this browser preview. Public publication is blocked until student consent and instructor approval are both recorded.</p>
      </form>
    </div>
  );
}

export function NotificationsPage() {
  const currentUser = getCurrentUser();
  const preferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...readStudentData(NOTIFICATION_PREFERENCES_KEY, {}),
  };
  const [notifications, setNotifications] = useState(() =>
    readStudentData(NOTIFICATIONS_KEY, []).filter((item) =>
      !item.recipientEmail || item.recipientEmail.toLowerCase() === currentUser?.email?.toLowerCase()
    ).filter((item) => {
      const preference = getNotificationPreferenceKey(item.type);
      return !preference || preferences[preference];
    })
  );

  function markAllRead() {
    const updated = notifications.map((item) => ({ ...item, unread: false }));
    const notificationIds = new Set(updated.map((item) => item.id));
    saveStudentData(NOTIFICATIONS_KEY, readStudentData(NOTIFICATIONS_KEY, []).map((item) =>
      notificationIds.has(item.id) ? { ...item, unread: false } : item
    ));
    setNotifications(updated);
  }

  function markRead(notification) {
    const updated = notifications.map((item) => item.id === notification.id ? { ...item, unread: false } : item);
    const allNotifications = readStudentData(NOTIFICATIONS_KEY, []);
    saveStudentData(NOTIFICATIONS_KEY, allNotifications.map((item) =>
      item.id === notification.id ? { ...item, unread: false } : item
    ));
    setNotifications(updated);
  }

  return (
    <div className="student-notifications-page">
      <PageHeading
        title="Notifications"
        description="Course, lesson, instructor, order, and assignment updates—with links to the next useful step."
        action={notifications.some((item) => item.unread) && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all read</button>
        )}
      />
      {notifications.length ? (
        <div className="student-notification-list">
          {[...notifications].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map((item) => (
            <article className={item.unread ? "notification-card unread" : "notification-card"} key={item.id}>
              <div className="student-notification-copy">
                <span className="eyebrow">{item.unread ? "NEW · " : ""}{item.type?.replaceAll("_", " ") || "UPDATE"}</span>
                <h2>{item.title}</h2>
                <p>{item.message}</p>
                <small>{item.createdAt && !Number.isNaN(new Date(item.createdAt).getTime()) ? new Date(item.createdAt).toLocaleString() : "Date unavailable"}</small>
              </div>
              <div className="student-notification-actions">
                {item.href && item.href.startsWith("/") && <Link to={item.href} onClick={() => item.unread && markRead(item)}>Open update ↗</Link>}
                {item.unread && <button type="button" onClick={() => markRead(item)}>Mark read</button>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="You’re all caught up."
          text="Feedback, revision requests, assignment changes, course announcements, and order updates will appear here when available."
          to="/app/courses"
          label="Back to my courses"
        />
      )}
      <p className="student-demo-callout">Notifications are stored in this browser preview. Instructor, course, and order alerts require a connected backend to arrive automatically.</p>
    </div>
  );
}

export function ProfilePage() {
  const currentUser = getCurrentUser() || {};
  const [name, setName] = useState(currentUser.name || "");
  const [preferences, setPreferences] = useState(() => ({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...readStudentData(NOTIFICATION_PREFERENCES_KEY, {}),
  }));
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const supportEmail = readAdminData(adminStorageKeys.settings, {}).supportEmail?.trim() || "";

  function saveProfile(event) {
    event.preventDefault();
    const updated = { ...currentUser, name: name.trim() };
    setCurrentUser(updated);
    setMessage("Profile name saved in this browser preview.");
    window.dispatchEvent(new Event("ownTheme:profile-updated"));
  }

  function updateNotificationPreference(key, enabled) {
    const updated = { ...preferences, [key]: enabled };
    setPreferences(updated);
    saveStudentData(NOTIFICATION_PREFERENCES_KEY, updated);
    setMessage("Notification preferences saved in this browser preview.");
  }

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  const deletionMailto = supportEmail
    ? `mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent("Account deletion request")}&body=${encodeURIComponent(`Please process an account deletion request for ${currentUser.email || ""}.`)}`
    : "";

  return (
    <div className="student-settings-page">
      <PageHeading title="Profile & settings" description="Manage your local profile and notification preferences. Sensitive account controls require a connected account service." />
      <form className="student-form-panel profile-form student-settings-section" onSubmit={saveProfile}>
        <span className="eyebrow">PROFILE DETAILS</span>
        <h2>Your profile</h2>
        <div className="field">
          <label htmlFor="profile-name">Full name</label>
          <input id="profile-name" required value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="profile-email">Account email</label>
          <input id="profile-email" type="email" value={currentUser.email || ""} readOnly />
          <small>Email changes and verification require the account service, which is not connected.</small>
        </div>
        <button className="btn btn-primary" type="submit">Save profile</button>
        {message && <p className="form-success" role="status">{message}</p>}
        <div className="student-profile-image-note">
          <span className="student-profile-avatar" aria-hidden="true">{name.trim().charAt(0).toUpperCase() || "S"}</span>
          <p>Profile image upload is not supported in this preview.</p>
        </div>
      </form>

      <section className="student-settings-section">
        <span className="eyebrow">NOTIFICATION PREFERENCES</span>
        <h2>Choose which updates to keep</h2>
        <p>These preferences are saved in this browser. Email and push notification delivery are not connected.</p>
        <div className="student-settings-preferences">
          {[
            ["feedback", "Instructor feedback and revision requests"],
            ["assignments", "Assignment status changes"],
            ["courses", "New course and lesson announcements"],
            ["billing", "Order and subscription status changes"],
          ].map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <input type="checkbox" checked={Boolean(preferences[key])} onChange={(event) => updateNotificationPreference(key, event.target.checked)} />
            </label>
          ))}
        </div>
      </section>

      <section className="student-settings-section">
        <span className="eyebrow">PASSWORD & SECURITY</span>
        <h2>Account security</h2>
        <p>Password changes, active-session management, and security verification are unavailable because there is no authentication backend.</p>
        <Link className="btn btn-outline" to="/forgot-password">Password help</Link>
        <p className="student-demo-callout">This is a browser-only demo. Profile values and access checks stored in browser data are not secure account credentials.</p>
      </section>

      <section className="student-settings-section student-settings-danger">
        <span className="eyebrow">ACCOUNT CONTROL</span>
        <h2>Sign out or request account deletion</h2>
        <p>Sign out clears this preview’s current browser session. It does not delete your account or course data.</p>
        <button type="button" className="btn btn-outline" onClick={handleSignOut}>Sign out</button>
        <div className="student-delete-request">
          <strong>Account deletion</strong>
          <p>{supportEmail ? "Your email app will open with a prefilled deletion request. Sending it is your choice; this preview cannot process or confirm deletion." : "An account deletion request cannot be submitted until a support email is configured."}</p>
          {deletionMailto
            ? <a className="btn btn-danger btn-sm" href={deletionMailto}>Prepare deletion request</a>
            : <Link className="btn btn-outline btn-sm" to="/contact">Contact support</Link>}
        </div>
      </section>
    </div>
  );
}

export function OrdersPage() {
  return (
    <div className="student-billing-page">
      <PageHeading
        title="Orders & subscription"
        description="Review purchase and membership information from verified billing records."
      />
      <section className="student-billing-unavailable" id="billing-history">
        <span className="eyebrow">BILLING · NOT CONNECTED</span>
        <h2>Verified purchase history is unavailable</h2>
        <p>This preview has no billing backend, so it cannot confirm individual course purchases, bundle orders, payment status, or subscription details. Browser-stored demo records are not shown as verified purchases.</p>
        <p>No payment card numbers, bank details, or other payment credentials are stored or displayed here.</p>
        <div className="student-billing-grid">
          <article><span className="eyebrow">PURCHASE HISTORY</span><strong>Not verified</strong><p>Individual course and bundle records require a verified order service.</p></article>
          <article><span className="eyebrow">SUBSCRIPTION</span><strong>Not verified</strong><p>Renewal and cancellation terms cannot be shown until a membership record and terms are confirmed.</p></article>
          <article><span className="eyebrow">RECEIPTS & PAYMENT STATUS</span><strong>Unavailable</strong><p>Receipts and payment status require a connected payment provider.</p></article>
        </div>
        <div className="student-billing-actions">
          <Link className="btn btn-outline" to="/support">Contact support</Link>
          <Link className="btn btn-primary" to="/plans">View course options</Link>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ title, text, to, label }) {
  return (
    <section className="student-empty">
      <span className="student-empty-mark" aria-hidden="true">OT</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link to={to} className="btn btn-outline">{label}</Link>
    </section>
  );
}
