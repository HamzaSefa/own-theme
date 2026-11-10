import { initialStudents, sales } from "./admin";
import { student } from "./courses";

export const adminStorageKeys = {
  assignments: "ownTheme_assignments",
  showcaseProjects: "ownTheme_showcase_projects",
  courses: "ownTheme_managed_courses",
  orders: "ownTheme_orders",
  plans: "ownTheme_plans",
  settings: "ownTheme_site_settings",
  students: "ownTheme_admin_students",
};

export function readAdminData(key, fallback) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

export function writeAdminData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getAdminOrders() {
  return readAdminData(
    adminStorageKeys.orders,
    sales.map((sale) => ({
      id: `demo-${sale.id}`,
      student: sale.student,
      email: "",
      item: sale.courseId,
      amount: sale.amount,
      date: sale.date,
      method: "Demo",
      status: "Demo payment",
    })),
  );
}

export function getAdminStudents() {
  const roster = readAdminData(adminStorageKeys.students, initialStudents);
  const user = localStorage.getItem("ownTheme_session");
  if (!user) return roster;
  const account = JSON.parse(user);
  const existing = roster.find((item) => item.email.toLowerCase() === account.email?.toLowerCase());
  if (existing) return roster;
  return [
    ...roster,
    {
      id: `account-${account.email}`,
      name: account.name,
      email: account.email,
      courses: student.enrolled.map((item) => item.courseId),
      device: "Current browser",
      lastActive: "Now",
    },
  ];
}
