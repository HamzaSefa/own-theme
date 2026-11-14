import { useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { courses, getAllLessons, getProgress, getCurrentEnrollments } from "../data/courses";
import { adminStorageKeys, readAdminData } from "../data/adminWorkspace";
import { details } from "../data/details";
import { SuccessMessage, ValidationError } from "../components/States";
import {
  getCurrentUser,
  getUserStorageKey,
  readStudentData,
  saveStudentData,
  setCurrentUser,
  signOut,
} from "../data/studentPortal";

const THEME_SHEET_KEY = "ownTheme_themeSheet";
const NOTIFICATIONS_KEY = "ownTheme_notifications";
const NOTIFICATION_PREFERENCES_KEY = "ownTheme_notification_preferences";
const DEFAULT_NOTIFICATION_PREFERENCES = {
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
  { to: "/app/settings", label: "Settings", icon: "03" },
];

const studentToolLinks = [
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

  if (user.role && user.role !== "student") {
    return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  }

  if (classroom) return children;

  return <StudentLayout key={location.pathname}>{children}</StudentLayout>;
}

function StudentLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function closeOnEscape(event) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuToggleRef.current?.focus();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <div className="student-platform">
      <StudentHeader menuOpen={menuOpen} menuToggleRef={menuToggleRef} onToggleMenu={() => setMenuOpen((open) => !open)} />
      <div className="student-shell">
        {menuOpen && (
          <button
            type="button"
            className="student-nav-backdrop"
            aria-label="Close learning space navigation"
            tabIndex="-1"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <StudentSidebar menuOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />
        <main className="student-main">{children}</main>
      </div>
      <p className="student-demo-note">
        Student preview · Data is stored in this browser. Client-side access checks are not security; avoid real or sensitive data.
      </p>
    </div>
  );
}

function StudentHeader({ menuOpen, menuToggleRef, onToggleMenu }) {
  const navigate = useNavigate();
  const user = useStudentUser();
  const initials = (user?.name || "Student").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="student-header">
      <div className="student-header-brand">
        <button
          ref={menuToggleRef}
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
        <span className="student-header-avatar" aria-hidden="true">{initials || "S"}</span>
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
  return getCurrentEnrollments()
    .map((enrollment) => ({
      enrollment,
      course: courses.find((course) => course.id === enrollment.courseId),
    }))
    .filter((item) => item.course);
}

function getThemeSheets() {
  const saved = readStudentData(getUserStorageKey(THEME_SHEET_KEY), []);
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

function createLocalRecordId() {
  return globalThis.crypto.randomUUID();
}

function getNotificationPreferenceKey(type) {
  if (type === "course_announcement" || type === "lesson_announcement") return "courses";
  if (type === "order_status" || type === "subscription_status") return "billing";
  return "";
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
                      const courseArtwork = course.thumbnail || course.heroImage;
                      const destination = status === "completed"
                        ? `/app/courses/${course.id}`
                        : `/app/learn/${next.id}`;
                      return (
                        <article className="student-owned-course-card" key={course.id}>
                          <div className={`student-owned-course-art student-owned-course-art-${course.id}`}>
                            {courseArtwork && <img src={courseArtwork} alt="" loading="lazy" decoding="async" />}
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
  const enrollment = getCurrentEnrollments().find((item) => item.courseId === courseId);

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
  const moduleResources = course.modules.flatMap((module) =>
    module.lessons
      .filter((lesson) => lesson.resourceUrl && lesson.locked !== true)
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
        </article>
      </section>
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
    saveStudentData(getUserStorageKey(THEME_SHEET_KEY), updated);
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
    saveStudentData(getUserStorageKey(THEME_SHEET_KEY), updated);
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
        description="Plan the six creative decisions behind your edit. Save drafts and return to them later."
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
        <SuccessMessage>{message}</SuccessMessage>
      </form>
      <p className="student-demo-callout">Theme Sheets are saved in this browser preview.</p>
    </div>
  );
}

export function MyShowcasePage() {
  const [projects, setProjects] = useState(getOwnShowcaseProjects);
  const [editingId, setEditingId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [courseId, setCourseId] = useState(ownedCourses()[0]?.course.id || "");
  const [visibility, setVisibility] = useState("private");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const owned = ownedCourses();

  function resetForm(clearMessage = true) {
    setEditingId("");
    setTitle("");
    setDescription("");
    setMediaUrl("");
    setThumbnailUrl("");
    setCourseId(owned[0]?.course.id || "");
    setVisibility("private");
    setConsent(false);
    if (clearMessage) {
      setMessage("");
      setMessageIsError(false);
    }
  }

  function editProject(project) {
    setEditingId(project.id);
    setTitle(project.title || "");
    setDescription(project.description || "");
    setMediaUrl(project.mediaUrl || "");
    setThumbnailUrl(project.thumbnailUrl || "");
    setCourseId(project.courseId || owned[0]?.course.id || "");
    setVisibility(project.showcaseConsent ? "public" : "private");
    setConsent(Boolean(project.showcaseConsent));
    setMessage("");
    setMessageIsError(false);
    document.getElementById("showcase-project-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function saveProject(event) {
    event.preventDefault();
    const url = mediaUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setMessage("Enter a valid http or https media link.");
      setMessageIsError(true);
      return;
    }
    const thumbnail = thumbnailUrl.trim();
    if (thumbnail && !/^https?:\/\//i.test(thumbnail)) {
      setMessage("Enter a valid http or https thumbnail image URL, or leave it blank.");
      setMessageIsError(true);
      return;
    }
    if (visibility === "public" && !consent) {
      setMessage("To request public display, confirm your consent. Otherwise, keep this project private.");
      setMessageIsError(true);
      return;
    }
    const previous = projects.find((item) => item.id === editingId);
    const project = {
      id: editingId || createLocalRecordId(),
      title: title.trim(),
      description: description.trim(),
      mediaUrl: url,
      thumbnailUrl: thumbnail,
      url,
      courseId,
      studentEmail: getCurrentUser()?.email || "",
      showcaseConsent: visibility === "public" && consent,
      showcasePublished: Boolean(previous?.showcasePublished && visibility === "public" && consent
        && previous.title === title.trim()
        && previous.description === description.trim()
        && previous.mediaUrl === url
        && previous.thumbnailUrl === thumbnail
        && previous.courseId === courseId),
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
    setMessageIsError(false);
    window.dispatchEvent(new Event("ownTheme:student-data"));
  }

  function removeProject(project) {
    if (!window.confirm(`Remove "${project.title}" from your showcase?`)) return;
    const updated = projects.filter((item) => item.id !== project.id);
    setProjects(updated);
    saveOwnShowcaseProjects(updated);
    if (editingId === project.id) resetForm();
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
      {projects.length ? (
        <section className="student-showcase-project-list" aria-label="Your projects">
          {projects.map((item) => {
            const course = courses.find((entry) => entry.id === item.courseId);
            return (
              <article className="student-showcase-project" key={item.id}>
                <div className="student-showcase-project-heading">
                  <div><span className="eyebrow">{course?.title || "Own Theme project"}</span><h2>{item.title}</h2></div>
                  <span className={`student-showcase-status ${item.showcasePublished && item.showcaseConsent ? "published" : item.showcaseConsent ? "pending" : "private"}`}>{getVisibilityStatus(item)}</span>
                </div>
                <p>{item.description || "No description added."}</p>
                <div className="student-showcase-project-links">
                  <a href={item.mediaUrl || item.url} target="_blank" rel="noreferrer">Open media ↗</a>
                </div>
                <div className="student-showcase-project-actions">
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => editProject(item)}>Edit</button>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => removeProject(item)}>Remove</button>
                </div>
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
          <small>Direct MP4, WebM, or Ogg videos and YouTube or Vimeo links can play on the project page. Other links open on their original platform.</small>
        </div>
        <div className="field">
          <label htmlFor="showcase-thumbnail-url">Thumbnail image URL (optional)</label>
          <input id="showcase-thumbnail-url" type="url" value={thumbnailUrl} onChange={(event) => setThumbnailUrl(event.target.value)} placeholder="https://…" />
          <small>Use an image you have permission to share. Without one, supported video links use their available preview.</small>
        </div>
        <div className="field">
          <label htmlFor="showcase-course">Associated course</label>
          <select id="showcase-course" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            <option value="">No associated course</option>
            {owned.map(({ course: item }) => <option value={item.id} key={item.id}>{item.title}</option>)}
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
        {messageIsError
          ? <ValidationError>{message}</ValidationError>
          : <SuccessMessage>{message}</SuccessMessage>}
        <p className="student-demo-callout">Projects are stored in this browser preview. Public publication is blocked until student consent and instructor approval are both recorded.</p>
      </form>
    </div>
  );
}

export function NotificationsPage() {
  const currentUser = getCurrentUser();
  const preferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...readStudentData(getUserStorageKey(NOTIFICATION_PREFERENCES_KEY), {}),
  };
  const [notifications, setNotifications] = useState(() =>
    readStudentData(NOTIFICATIONS_KEY, []).filter((item) =>
      item.recipientEmail?.toLowerCase() === currentUser?.email?.toLowerCase()
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
        description="Course, lesson, and order updates—with links to the next useful step."
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
          text="Course announcements and order updates will appear here when available."
          to="/app/courses"
          label="Back to my courses"
        />
      )}
      <p className="student-demo-callout">Notifications are stored in this browser preview. Course and order alerts require a connected backend to arrive automatically.</p>
    </div>
  );
}

export function ProfilePage() {
  const currentUser = getCurrentUser() || {};
  const [name, setName] = useState(currentUser.name || "");
  const [preferences, setPreferences] = useState(() => ({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...readStudentData(getUserStorageKey(NOTIFICATION_PREFERENCES_KEY), {}),
  }));
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const navigate = useNavigate();
  const supportEmail = readAdminData(adminStorageKeys.settings, {}).supportEmail?.trim() || "";

  function saveProfile(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setMessage("Enter your full name.");
      setMessageIsError(true);
      return;
    }
    const updated = { ...currentUser, name: trimmedName };
    setCurrentUser(updated);
    setMessage("Profile name saved in this browser preview.");
    setMessageIsError(false);
    window.dispatchEvent(new Event("ownTheme:profile-updated"));
  }

  function updateNotificationPreference(key, enabled) {
    const updated = { ...preferences, [key]: enabled };
    setPreferences(updated);
    saveStudentData(getUserStorageKey(NOTIFICATION_PREFERENCES_KEY), updated);
    setMessage("Notification preferences saved in this browser preview.");
    setMessageIsError(false);
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
          <input id="profile-name" required value={name} onChange={(event) => { setName(event.target.value); setMessage(""); setMessageIsError(false); }} />
        </div>
        <div className="field">
          <label htmlFor="profile-email">Account email</label>
          <input id="profile-email" type="email" value={currentUser.email || ""} readOnly />
          <small>Email changes and verification require the account service, which is not connected.</small>
        </div>
        <button className="btn btn-primary" type="submit">Save profile</button>
        {messageIsError ? <ValidationError>{message}</ValidationError> : <SuccessMessage>{message}</SuccessMessage>}
        <div className="student-profile-image-note">
          <span className="student-profile-avatar" aria-hidden="true">{name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S"}</span>
          <p><strong>{name || "Student"}</strong><span>Profile image upload is not supported in this preview.</span></p>
        </div>
      </form>

      <section className="student-settings-section">
        <span className="eyebrow">NOTIFICATION PREFERENCES</span>
        <h2>Choose which updates to keep</h2>
        <p>These preferences are saved in this browser. Email and push notification delivery are not connected.</p>
        <div className="student-settings-preferences">
          {[
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
