const AUTH_KEY = "ownTheme_session";
const FREE_COURSE_ENROLLMENTS_KEY = "ownTheme_free_course_enrollments";

export function getCurrentUser() {
  const saved = localStorage.getItem(AUTH_KEY);
  return saved ? JSON.parse(saved) : null;
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
