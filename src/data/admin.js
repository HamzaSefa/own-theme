// Course prices (placeholders from your proposal)
export const bundlePrice = 180;
export const prices = {
  "short-form": 50,
  "long-form": 80,
  "film-doc": 100,
};

export const initialStudents = [
  { id: 1, name: "Abdulhafiz Z.", email: "abdulhafiz@email.com", courses: ["short-form", "long-form"], device: "Chrome · Windows", lastActive: "2 hours ago" },
  { id: 2, name: "Selam Tesfaye", email: "selam@email.com", courses: ["short-form"], device: "Safari · iPhone", lastActive: "Yesterday" },
  { id: 3, name: "Dawit Alemu", email: "dawit@email.com", courses: ["film-doc"], device: "Chrome · Android", lastActive: "3 days ago" },
  { id: 4, name: "Hana Bekele", email: "hana@email.com", courses: ["short-form", "long-form", "film-doc"], device: null, lastActive: "Last week" },
  { id: 5, name: "Yonas Girma", email: "yonas@email.com", courses: [], device: null, lastActive: "Never" },
];

export const sales = [
  { id: 1, student: "Hana Bekele", courseId: "film-doc", amount: 100, date: "Nov 7, 2026" },
  { id: 2, student: "Selam Tesfaye", courseId: "short-form", amount: 50, date: "Nov 5, 2026" },
  { id: 3, student: "Dawit Alemu", courseId: "film-doc", amount: 100, date: "Nov 2, 2026" },
  { id: 4, student: "Abdulhafiz Z.", courseId: "long-form", amount: 80, date: "Oct 28, 2026" },
  { id: 5, student: "Hana Bekele", courseId: "short-form", amount: 50, date: "Oct 20, 2026" },
];

export const monthly = [
  { month: "Jun", revenue: 150 },
  { month: "Jul", revenue: 320 },
  { month: "Aug", revenue: 280 },
  { month: "Sep", revenue: 540 },
  { month: "Oct", revenue: 410 },
  { month: "Nov", revenue: 250 },
];