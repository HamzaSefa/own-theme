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
  media: "ownTheme_media_assets",
  auditLog: "ownTheme_admin_audit_log",
};

export function readAdminData(key, fallback) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

export function writeAdminData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function logAdminAction(action) {
  const actor = readAdminData("ownTheme_session", null);
  const entry = {
    id: crypto.randomUUID(),
    actor: actor?.email || "Admin preview",
    createdAt: new Date().toISOString(),
    ...action,
  };
  writeAdminData(adminStorageKeys.auditLog, [
    entry,
    ...readAdminData(adminStorageKeys.auditLog, []),
  ]);
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

export function getAdminPlans() {
  const saved = readAdminData(adminStorageKeys.plans, {});
  const defaultBundles = [{
    id: "complete-bundle",
    title: "Complete bundle",
    description: "All three Own Theme courses in one one-time purchase.",
    includedCourses: ["short-form", "long-form", "film-doc"],
    price: saved.bundlePrice ?? 180,
    currency: "USD",
    accessDuration: "Access terms to be confirmed",
    publicationStatus: "Published",
    availabilityStatus: "Available",
  }];
  return {
    ...saved,
    bundlePrice: saved.bundlePrice ?? 180,
    coursePrices: { "short-form": 50, "long-form": 80, "film-doc": 100, ...(saved.coursePrices || {}) },
    membershipStatus: saved.membershipStatus || "Coming soon",
    membershipPrice: String(saved.membershipPrice ?? ""),
    membershipBillingCycle: String(saved.membershipBillingCycle ?? ""),
    membershipAccess: String(saved.membershipAccess ?? ""),
    membershipRenewalTerms: String(saved.membershipRenewalTerms ?? ""),
    membershipCurrency: String(saved.membershipCurrency || "USD"),
    membershipPublicationStatus: saved.membershipPublicationStatus || "Draft",
    bundles: Array.isArray(saved.bundles) ? saved.bundles : defaultBundles,
  };
}

export function isAvailableBundle(bundle, publicCourseIds) {
  const includedCourses = bundle.includedCourses || [];
  const price = String(bundle.price ?? "").trim();
  return bundle.publicationStatus === "Published"
    && bundle.availabilityStatus === "Available"
    && Boolean(bundle.title?.trim())
    && Boolean(bundle.currency?.trim())
    && Boolean(price)
    && Number.isFinite(Number(price))
    && Number(price) >= 0
    && Boolean(bundle.accessDuration?.trim())
    && includedCourses.length > 0
    && includedCourses.every((id) => publicCourseIds.includes(id));
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
