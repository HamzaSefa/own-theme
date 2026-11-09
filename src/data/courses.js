export const courses = [
  {
    id: "short-form",
    tag: "COURSE 01",
    title: "Short Form & Social Media",
    modules: [
      {
        title: "Module 0: Getting started",
        lessons: [
          { id: "sf-0-1", title: "0.1 What an edit is", duration: "10 min" },
          { id: "sf-0-2", title: "0.2 Learning to see", duration: "12 min" },
          { id: "sf-0-3", title: "0.3 The Theme Stack and your first Theme Sheet", duration: "11 min" },
          { id: "sf-0-4", title: "0.4 Setup and workflow", duration: "9 min" },
        ],
      },
      {
        title: "Module 1: The first second",
        lessons: [
          { id: "sf-1-1", title: "1.1 How attention works: hook, turn, payoff", duration: "10 min" },
          { id: "sf-1-2", title: "1.2 Setting up 9:16 and safe zones", duration: "8 min" },
          { id: "sf-1-3", title: "1.3 Lab: the same 20 seconds in two tools", duration: "14 min" },
          { id: "sf-1-4", title: "1.4 Constraint and assignment brief", duration: "7 min" },
        ],
      },
      {
        title: "Module 2: Rhythm at speed",
        lessons: [
          { id: "sf-2-1", title: "2.1 Cut density and why speed is a choice", duration: "11 min" },
          { id: "sf-2-2", title: "2.2 Beat-marked cuts in CapCut", duration: "13 min" },
        ],
      },
    ],
  },
  {
    id: "long-form",
    tag: "COURSE 02",
    title: "Long Form & YouTube",
    modules: [
      {
        title: "Module 0: Getting started",
        lessons: [
          { id: "lf-0-1", title: "0.1 What an edit is", duration: "10 min" },
          { id: "lf-0-2", title: "0.2 Learning to see", duration: "12 min" },
          { id: "lf-0-3", title: "0.3 The Theme Stack and your first Theme Sheet", duration: "11 min" },
        ],
      },
      {
        title: "Module 1: Structure and the retention map",
        lessons: [
          { id: "lf-1-1", title: "1.1 Premise, promise and payoff", duration: "12 min" },
          { id: "lf-1-2", title: "1.2 Chapters and the retention map", duration: "13 min" },
        ],
      },
    ],
  },
  {
    id: "film-doc",
    tag: "COURSE 03",
    title: "Film & Documentary",
    modules: [
      {
        title: "Module 0: Getting started",
        lessons: [
          { id: "fd-0-1", title: "0.1 What an edit is", duration: "10 min" },
          { id: "fd-0-2", title: "0.2 Learning to see", duration: "12 min" },
        ],
      },
    ],
  },
];

// Pretend student. localStorage keeps purchases after a page refresh.
const saved = localStorage.getItem("ownTheme_enrolled");

export const student = {
  name: "Abdulhafiz",
  enrolled: saved
    ? JSON.parse(saved)
    : [
        { courseId: "short-form", completed: ["sf-0-1", "sf-0-2", "sf-0-3"] },
        { courseId: "long-form", completed: ["lf-0-1"] },
      ],
};

// Called after a (fake) payment succeeds
export function enroll(courseId) {
  if (!student.enrolled.some((e) => e.courseId === courseId)) {
    student.enrolled.push({ courseId, completed: [] });
    localStorage.setItem("ownTheme_enrolled", JSON.stringify(student.enrolled));
  }
}

// Wipes the demo so you can show the purchase again
export function resetDemo() {
  localStorage.removeItem("ownTheme_enrolled");
  window.location.reload();
}

// Helper 1: turn modules into one flat list of lessons
export function getAllLessons(course) {
  return course.modules.flatMap((m) => m.lessons);
}

// Helper 2: progress percentage (0 to 100)
export function getProgress(course, completed) {
  const total = getAllLessons(course).length;
  return Math.round((completed.length / total) * 100);
}