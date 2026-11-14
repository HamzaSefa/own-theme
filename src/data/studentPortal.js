const AUTH_KEY = "ownTheme_session";
const FREE_COURSE_ENROLLMENTS_KEY = "ownTheme_free_course_enrollments";
const USER_ENROLLMENTS_KEY = "ownTheme_user_enrollments";
const DEMO_STUDENT_EMAIL = "student@owntheme.demo";

function removeLegacyAssignmentData() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem("ownTheme_assignments");

  const notificationsKey = "ownTheme_notifications";
  const savedNotifications = localStorage.getItem(notificationsKey);
  if (savedNotifications !== null) {
    const notifications = JSON.parse(savedNotifications);
    const remaining = notifications.filter((item) =>
      !/assignment|instructor_feedback|revision_requested/i.test(item.type || "")
    );
    if (remaining.length !== notifications.length) {
      localStorage.setItem(notificationsKey, JSON.stringify(remaining));
    }
  }

  const preferenceKeys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("ownTheme_notification_preferences")) preferenceKeys.push(key);
  }
  preferenceKeys.forEach((key) => {
    const preferences = JSON.parse(localStorage.getItem(key));
    if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) return;
    const changed = Object.hasOwn(preferences, "feedback") || Object.hasOwn(preferences, "assignments");
    if (!changed) return;
    delete preferences.feedback;
    delete preferences.assignments;
    localStorage.setItem(key, JSON.stringify(preferences));
  });

  const settingsKey = "ownTheme_site_settings";
  const savedSettings = localStorage.getItem(settingsKey);
  if (savedSettings !== null) {
    const settings = JSON.parse(savedSettings);
    if (settings?.emailNotifications && typeof settings.emailNotifications === "object") {
      const notifications = settings.emailNotifications;
      const changed = Object.hasOwn(notifications, "feedback") || Object.hasOwn(notifications, "assignments");
      if (changed) {
        delete notifications.feedback;
        delete notifications.assignments;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
      }
    }
  }

  const projectsKey = "ownTheme_showcase_projects";
  const savedProjects = localStorage.getItem(projectsKey);
  if (savedProjects !== null) {
    const projects = JSON.parse(savedProjects);
    let changed = false;
    projects.forEach((project) => {
      if (!project || typeof project !== "object") return;
      if (Object.hasOwn(project, "assignmentId")) {
        delete project.assignmentId;
        changed = true;
      }
      if (Object.hasOwn(project, "moderationNote")) {
        delete project.moderationNote;
        changed = true;
      }
      if (project.moderationStatus === "Changes Requested") {
        project.moderationStatus = "Pending review";
        changed = true;
      }
    });
    if (changed) localStorage.setItem(projectsKey, JSON.stringify(projects));
  }

  const coursesKey = "ownTheme_managed_courses";
  const savedCourses = localStorage.getItem(coursesKey);
  if (savedCourses !== null) {
    const catalog = JSON.parse(savedCourses);
    let changed = false;
    catalog.forEach((course) => {
      course.modules?.forEach((module) => {
        ["assignments", "assignment", "assignmentTitle", "assignmentDescription"].forEach((key) => {
          if (!Object.hasOwn(module, key)) return;
          delete module[key];
          changed = true;
        });
        module.lessons?.forEach((lesson) => {
          ["assignmentTitle", "assignmentDescription", "assignmentId"].forEach((key) => {
            if (!Object.hasOwn(lesson, key)) return;
            delete lesson[key];
            changed = true;
          });
        });
      });
    });
    if (changed) localStorage.setItem(coursesKey, JSON.stringify(catalog));
  }

  const auditKey = "ownTheme_admin_audit_log";
  const savedAudit = localStorage.getItem(auditKey);
  if (savedAudit !== null) {
    const entries = JSON.parse(savedAudit);
    const remaining = entries.filter((entry) =>
      !/assignment|instructor_feedback|revision_requested/i.test(`${entry.type || ""} ${entry.summary || ""}`)
    );
    if (remaining.length !== entries.length) {
      localStorage.setItem(auditKey, JSON.stringify(remaining));
    }
  }
}

removeLegacyAssignmentData();

export function getCurrentUser() {
  const saved = localStorage.getItem(AUTH_KEY);
  return saved ? JSON.parse(saved) : null;
}

export function getInternalReturnPath(path, fallback = "/app") {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
    ? path
    : fallback;
}

export function setCurrentUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function signOut() {
  localStorage.removeItem(AUTH_KEY);
}

export function enrollInFreeCourse(email) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;
  const enrollments = readStudentData(FREE_COURSE_ENROLLMENTS_KEY, []);
  if (!enrollments.includes(normalizedEmail)) {
    saveStudentData(FREE_COURSE_ENROLLMENTS_KEY, [...enrollments, normalizedEmail]);
  }
}

export function hasFreeCourseAccess(email) {
  const normalizedEmail = email?.trim().toLowerCase();
  return Boolean(normalizedEmail)
    && readStudentData(FREE_COURSE_ENROLLMENTS_KEY, []).includes(normalizedEmail);
}

export function readStudentData(key, fallback) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

export function saveStudentData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getUserStorageKey(key, accountEmail = getCurrentUser()?.email) {
  const email = accountEmail?.trim().toLowerCase();
  return email ? `${key}:${encodeURIComponent(email)}` : key;
}

export function getUserEnrollments(defaultEnrollments = [], accountEmail = getCurrentUser()?.email) {
  const email = accountEmail?.trim().toLowerCase();
  if (!email) return [];

  const saved = localStorage.getItem(getUserStorageKey(USER_ENROLLMENTS_KEY, email));
  if (saved !== null) return JSON.parse(saved);
  return email === DEMO_STUDENT_EMAIL ? defaultEnrollments : [];
}

export function saveUserEnrollments(enrollments, email = getCurrentUser()?.email) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return;
  localStorage.setItem(
    getUserStorageKey(USER_ENROLLMENTS_KEY, normalizedEmail),
    JSON.stringify(enrollments),
  );
}
