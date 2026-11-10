const AUTH_KEY = "ownTheme_session";
const FREE_COURSE_ENROLLMENTS_KEY = "ownTheme_free_course_enrollments";
const USER_ENROLLMENTS_KEY = "ownTheme_user_enrollments";
const DEMO_STUDENT_EMAIL = "student@owntheme.demo";

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

export function getUserSubmissions() {
  const email = getCurrentUser()?.email?.trim().toLowerCase();
  if (!email) return [];
  return readStudentData("ownTheme_assignments", []).filter(
    (submission) => submission.studentEmail?.trim().toLowerCase() === email,
  );
}

export function saveUserSubmissions(submissions) {
  const email = getCurrentUser()?.email?.trim().toLowerCase();
  if (!email) return;
  const allSubmissions = readStudentData("ownTheme_assignments", []);
  const otherSubmissions = allSubmissions.filter(
    (submission) => submission.studentEmail?.trim().toLowerCase() !== email,
  );
  saveStudentData("ownTheme_assignments", [...submissions, ...otherSubmissions]);
}
