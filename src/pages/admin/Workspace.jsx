import { useState } from "react";
import { courses, student } from "../../data/courses";
import { prices } from "../../data/admin";
import { Link } from "react-router-dom";
import {
  adminStorageKeys,
  getAdminOrders,
  getAdminStudents,
  readAdminData,
  writeAdminData,
} from "../../data/adminWorkspace";

function SavedNotice({ children }) {
  return <p className="admin-saved" role="status">{children}</p>;
}

function addStudentNotification(recipientEmail, notification) {
  if (!recipientEmail) return;
  const preferenceByType = {
    instructor_feedback: "feedback",
    revision_requested: "feedback",
    assignment_status: "assignments",
    course_announcement: "courses",
    lesson_announcement: "courses",
    order_status: "billing",
    subscription_status: "billing",
  };
  const preference = preferenceByType[notification.type];
  const preferences = readAdminData("ownTheme_notification_preferences", {});
  if (preference && preferences[preference] === false) return;
  const notifications = readAdminData("ownTheme_notifications", []);
  writeAdminData("ownTheme_notifications", [
    {
      id: crypto.randomUUID(),
      recipientEmail,
      createdAt: new Date().toISOString(),
      unread: true,
      ...notification,
    },
    ...notifications,
  ]);
}

export function CourseManagement() {
  const [catalog, setCatalog] = useState(() => courses.map((course) => ({
    ...course,
    slug: course.slug || course.id,
    description: course.description || course.desc || "",
    fullDescription: course.fullDescription || "",
    category: course.category || (course.id === "short-form" ? "Short-Form & Social Media" : course.id === "long-form" ? "Long-Form & YouTube" : "Film & Documentary"),
    level: course.level || "",
    estimatedDuration: course.estimatedDuration || "",
    outcomes: course.outcomes || [],
    instructor: course.instructor || "",
    price: course.price ?? prices[course.id] ?? "",
    purchaseOption: course.purchaseOption || "One-time",
    accessTerms: course.accessTerms || "",
    resources: course.resources || [],
    visibility: course.visibility !== false,
    publicationStatus: course.publicationStatus || "Published",
  })));
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [outcomesText, setOutcomesText] = useState("");
  const [resourcesText, setResourcesText] = useState("");
  const [course, setCourse] = useState(null);
  const [validationError, setValidationError] = useState("");

  function editCourse(item) {
    setEditingId(item.id);
    setCourse({ ...item });
    setOutcomesText((item.outcomes || []).join("\n"));
    setResourcesText((item.resources || []).map((resource) => typeof resource === "string" ? resource : resource.title || resource.url).join("\n"));
    setSaved(false);
    setValidationError("");
  }

  function addCourse() {
    setEditingId("");
    setCourse({
      id: "",
      slug: "",
      tag: `COURSE ${String(catalog.length + 1).padStart(2, "0")}`,
      title: "",
      description: "",
      fullDescription: "",
      thumbnail: "",
      heroImage: "",
      category: "Short-Form & Social Media",
      level: "",
      estimatedDuration: "",
      outcomes: [],
      instructor: "",
      price: "",
      purchaseOption: "One-time",
      accessTerms: "",
      resources: [],
      visibility: false,
      publicationStatus: "Draft",
      modules: [],
    });
    setOutcomesText("");
    setResourcesText("");
    setSaved(false);
    setValidationError("");
  }

  function updateCourse(key, value) {
    setCourse((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setValidationError("");
  }

  function save(event) {
    event.preventDefault();
    if (!course?.title.trim() || !course.slug.trim()) {
      setSaved(false);
      setValidationError("Enter both a course title and URL slug.");
      return;
    }
    const slug = course.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    const id = editingId || slug;
    const duplicate = catalog.some((item) => item.id !== editingId && item.slug === slug);
    if (!slug || duplicate || catalog.some((item) => item.id === id && item.id !== editingId)) {
      setSaved(false);
      setValidationError("That URL slug is invalid or already in use.");
      return;
    }
    const nextCourse = {
      ...course,
      id,
      title: course.title.trim(),
      slug,
      price: course.price === "" ? "" : Number(course.price),
      outcomes: outcomesText.split("\n").map((item) => item.trim()).filter(Boolean),
      resources: resourcesText.split("\n").map((item) => item.trim()).filter(Boolean),
    };
    const updated = editingId
      ? catalog.map((item) => item.id === editingId ? nextCourse : item)
      : [...catalog, nextCourse];
    setCatalog(updated);
    writeAdminData(adminStorageKeys.courses, updated);
    courses.splice(0, courses.length, ...updated);
    setEditingId(id);
    setCourse(nextCourse);
    setSaved(true);
    setValidationError("");
    window.dispatchEvent(new Event("ownTheme:catalog-updated"));
  }

  return (
    <div className="admin-course-management">
      <div className="admin-heading-row">
        <div><h1>Course management</h1><p className="muted">Create a course, edit its details, and control whether it is public.</p></div>
        <button className="btn btn-primary" onClick={addCourse}>+ Add course</button>
      </div>
      <div className="admin-course-list">
        {catalog.length ? catalog.map((item) => (
          <article className="admin-course-row" key={item.id}>
            <div><span className="eyebrow">{item.category || "Category not set"}</span><strong>{item.title}</strong><small>/{item.slug || item.id} · {item.publicationStatus || "Published"}{item.visibility === false ? " · Hidden" : ""}</small></div>
            <div className="admin-actions-inline">
              <button className="btn btn-outline btn-sm" type="button" onClick={() => editCourse(item)}>Edit details</button>
              <Link className="btn btn-outline btn-sm" to={`/admin/courses/${item.id}`}>Modules & lessons</Link>
            </div>
          </article>
        )) : <p className="admin-overview-empty">No courses have been created yet. Add a course to start building the catalog.</p>}
      </div>
      {course && (
        <form className="admin-edit-card admin-course-form" onSubmit={save}>
          <div className="admin-heading-row"><div><span className="eyebrow">{editingId ? "EDIT COURSE" : "NEW COURSE"}</span><h2>{editingId ? course.title || "Course details" : "Create course"}</h2></div><button className="btn btn-outline btn-sm" type="button" onClick={() => { setCourse(null); setEditingId(""); }}>Close</button></div>
          <div className="admin-fields-two">
            <label>Course title<input required value={course.title} onChange={(event) => updateCourse("title", event.target.value)} /></label>
            <label>URL slug<input required value={course.slug} onChange={(event) => updateCourse("slug", event.target.value)} placeholder="my-course" /></label>
            <label>Short description<textarea rows="3" value={course.description} onChange={(event) => updateCourse("description", event.target.value)} /></label>
            <label>Full description<textarea rows="3" value={course.fullDescription} onChange={(event) => updateCourse("fullDescription", event.target.value)} /></label>
            <label>Thumbnail image URL<input type="url" value={course.thumbnail} onChange={(event) => updateCourse("thumbnail", event.target.value)} /></label>
            <label>Hero image URL<input type="url" value={course.heroImage} onChange={(event) => updateCourse("heroImage", event.target.value)} /></label>
            <label>Category<select value={course.category} onChange={(event) => updateCourse("category", event.target.value)}><option>Short-Form & Social Media</option><option>Long-Form & YouTube</option><option>Film & Documentary</option><option>Other</option></select></label>
            <label>Skill level<input value={course.level} onChange={(event) => updateCourse("level", event.target.value)} placeholder="Set by course owner" /></label>
            <label>Estimated duration<input value={course.estimatedDuration || ""} onChange={(event) => updateCourse("estimatedDuration", event.target.value)} placeholder="Optional, if confirmed" /></label>
            <label>Instructor information<input value={course.instructor} onChange={(event) => updateCourse("instructor", event.target.value)} placeholder="Name and approved instructor description" /></label>
            <label>Price (USD)<input type="number" min="0" step="0.01" value={course.price} onChange={(event) => updateCourse("price", event.target.value)} /></label>
            <label>Purchase option<select value={course.purchaseOption} onChange={(event) => updateCourse("purchaseOption", event.target.value)}><option>One-time</option><option>Bundle eligible</option><option>Subscription included</option></select></label>
            <label>Access duration and terms<input value={course.accessTerms || ""} onChange={(event) => updateCourse("accessTerms", event.target.value)} placeholder="Enter confirmed access terms" /></label>
            <label>Publication status<select value={course.publicationStatus} onChange={(event) => updateCourse("publicationStatus", event.target.value)}><option>Draft</option><option>Published</option><option>Archived</option></select></label>
            <label className="admin-course-visibility"><input type="checkbox" checked={course.visibility !== false} onChange={(event) => updateCourse("visibility", event.target.checked)} /> Visible in the public course catalog</label>
            <label className="admin-field-wide">Learning outcomes<textarea rows="5" value={outcomesText} onChange={(event) => setOutcomesText(event.target.value)} placeholder="One learning outcome per line" /></label>
            <label className="admin-field-wide">Included resources<textarea rows="4" value={resourcesText} onChange={(event) => setResourcesText(event.target.value)} placeholder="Resource title or URL, one per line" /></label>
          </div>
          <div className="admin-save-row"><button className="btn btn-primary" type="submit">{editingId ? "Save course" : "Create course"}</button>{saved && <SavedNotice>Course saved in this browser preview.</SavedNotice>}{validationError && <p className="admin-form-error" role="alert">{validationError}</p>}</div>
          <p className="admin-disclaimer">Draft and archived courses will not appear in the public catalog. Publishing updates this local demo only and does not create backend permissions or billing behavior.</p>
        </form>
      )}
      {!course && <p className="admin-disclaimer">Course changes are saved in this browser preview. Existing course access and orders are not deleted.</p>}
    </div>
  );
}

export function LessonManagement({ courseId: routeCourseId }) {
  const [catalog, setCatalog] = useState(courses);
  const [selectedCourseId, setSelectedCourseId] = useState(routeCourseId || courses[0]?.id || "");
  const [saved, setSaved] = useState("");
  const courseId = routeCourseId || selectedCourseId;
  const courseIndex = catalog.findIndex((item) => item.id === courseId);
  const course = catalog[courseIndex];

  function updateCatalog(change, status = "") {
    const updated = structuredClone(catalog);
    change(updated[courseIndex]);
    setCatalog(updated);
    setSaved(status);
  }

  function addModule() {
    updateCatalog((item) => item.modules.push({ title: `Module ${item.modules.length + 1}`, description: "", lessons: [], assignments: [] }));
  }

  function updateModule(index, title) {
    updateCatalog((item) => { item.modules[index].title = title; });
  }

  function updateModuleField(index, key, value) {
    updateCatalog((item) => { item.modules[index][key] = value; });
  }

  function removeModule(index) {
    if (window.confirm("Remove this module and all of its lessons?")) {
      updateCatalog((item) => item.modules.splice(index, 1));
    }
  }

  function addLesson(moduleIndex) {
    updateCatalog((item) => item.modules[moduleIndex].lessons.push({
      id: `${item.id}-${crypto.randomUUID()}`,
      title: "",
      duration: "",
      description: "",
      notes: "",
      videoUrl: "",
      resourceUrl: "",
      preview: false,
      accessStatus: "Enrollment-only",
      assignmentTitle: "",
    }));
  }

  function updateLesson(moduleIndex, lessonIndex, key, value) {
    updateCatalog((item) => { item.modules[moduleIndex].lessons[lessonIndex][key] = value; });
  }

  function updateLessonPreview(moduleIndex, lessonIndex, preview) {
    updateCatalog((item) => {
      const lesson = item.modules[moduleIndex].lessons[lessonIndex];
      lesson.preview = preview;
      lesson.accessStatus = preview ? "Preview" : "Enrollment-only";
    });
  }

  function removeLesson(moduleIndex, lessonIndex) {
    updateCatalog((item) => item.modules[moduleIndex].lessons.splice(lessonIndex, 1));
  }

  function moveLesson(moduleIndex, lessonIndex, direction) {
    updateCatalog((item) => {
      const lessons = item.modules[moduleIndex].lessons;
      const target = lessonIndex + direction;
      if (target < 0 || target >= lessons.length) return;
      [lessons[lessonIndex], lessons[target]] = [lessons[target], lessons[lessonIndex]];
    });
  }

  function moveModule(moduleIndex, direction) {
    updateCatalog((item) => {
      const target = moduleIndex + direction;
      if (target < 0 || target >= item.modules.length) return;
      [item.modules[moduleIndex], item.modules[target]] = [item.modules[target], item.modules[moduleIndex]];
    });
  }

  function save(status) {
    if (!course) return;
    const updated = catalog.map((item) => item.id === course.id
      ? {
          ...item,
          curriculumStatus: status,
          modules: item.modules.map((module) => ({
            ...module,
            lessons: module.lessons.map((lesson) => ({
              ...lesson,
              accessStatus: lesson.preview === true ? "Preview" : "Enrollment-only",
            })),
          })),
        }
      : item);
    setCatalog(updated);
    writeAdminData(adminStorageKeys.courses, updated);
    courses.splice(0, courses.length, ...updated);
    setSaved(status === "Published" ? "Curriculum published in this browser preview." : "Curriculum draft saved in this browser preview.");
    window.dispatchEvent(new Event("ownTheme:catalog-updated"));
  }

  return (
    <div className="admin-curriculum-management">
      <div className="admin-heading-row">
        <div><h1>Module & lesson management</h1><p className="muted">Edit and order the curriculum, lesson content, access, and assignment links.</p></div>
        <button className="btn btn-primary" onClick={addModule} disabled={!course}>+ Add module</button>
      </div>
      {!routeCourseId && <select className="select" value={selectedCourseId} onChange={(event) => { setSelectedCourseId(event.target.value); setSaved(""); }} aria-label="Select course">
        {catalog.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
      </select>}
      {course && <div className="admin-curriculum-course-heading"><span className="eyebrow">{course.title}</span><Link to="/admin/courses">Course details & publication →</Link><span>Curriculum: {course.curriculumStatus || "Published"}</span></div>}
      {course?.modules.map((module, moduleIndex) => (
        <section className="cms-module admin-module" key={`${module.title}-${moduleIndex}`}>
          <div className="cms-row">
            <input aria-label="Module title" className="cms-module-name" value={module.title} onChange={(e) => updateModule(moduleIndex, e.target.value)} />
            <div className="admin-actions-inline">
              <button className="btn btn-outline btn-sm" type="button" aria-label="Move module up" disabled={moduleIndex === 0} onClick={() => moveModule(moduleIndex, -1)}>↑</button>
              <button className="btn btn-outline btn-sm" type="button" aria-label="Move module down" disabled={moduleIndex === course.modules.length - 1} onClick={() => moveModule(moduleIndex, 1)}>↓</button>
            <button className="btn btn-danger btn-sm" onClick={() => removeModule(moduleIndex)}>Delete module</button>
            </div>
          </div>
          <label className="admin-curriculum-description">Module description<textarea rows="2" value={module.description || ""} onChange={(event) => updateModuleField(moduleIndex, "description", event.target.value)} /></label>
          {module.lessons.map((lesson, lessonIndex) => (
            <div className="admin-lesson-editor" key={lesson.id}>
              <div className="cms-row">
                <input aria-label="Lesson title" placeholder="Lesson title" value={lesson.title} onChange={(e) => updateLesson(moduleIndex, lessonIndex, "title", e.target.value)} />
                <input aria-label="Lesson duration" className="admin-duration" value={lesson.duration || ""} onChange={(e) => updateLesson(moduleIndex, lessonIndex, "duration", e.target.value)} placeholder="Duration" />
                <div className="admin-actions-inline">
                  <button className="btn btn-outline btn-sm" type="button" aria-label="Move lesson up" disabled={lessonIndex === 0} onClick={() => moveLesson(moduleIndex, lessonIndex, -1)}>↑</button>
                  <button className="btn btn-outline btn-sm" type="button" aria-label="Move lesson down" disabled={lessonIndex === module.lessons.length - 1} onClick={() => moveLesson(moduleIndex, lessonIndex, 1)}>↓</button>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => removeLesson(moduleIndex, lessonIndex)}>Remove</button>
                </div>
              </div>
              <div className="admin-fields-two">
                <label>Hosted video URL<input type="url" value={lesson.videoUrl || ""} onChange={(e) => updateLesson(moduleIndex, lessonIndex, "videoUrl", e.target.value)} placeholder="https://video-host/lesson" /></label>
                <label>Resource URL<input type="url" value={lesson.resourceUrl || ""} onChange={(e) => updateLesson(moduleIndex, lessonIndex, "resourceUrl", e.target.value)} placeholder="https://files/worksheet.pdf" /></label>
                <label>Lesson description<textarea rows="3" value={lesson.description || ""} onChange={(e) => updateLesson(moduleIndex, lessonIndex, "description", e.target.value)} /></label>
                <label>Lesson notes<textarea rows="3" value={lesson.notes || ""} onChange={(e) => updateLesson(moduleIndex, lessonIndex, "notes", e.target.value)} /></label>
                <label>Resource title<input value={lesson.resourceTitle || ""} onChange={(e) => updateLesson(moduleIndex, lessonIndex, "resourceTitle", e.target.value)} placeholder="Optional display name" /></label>
                <label>Connected assignment<input value={lesson.assignmentTitle || ""} onChange={(e) => updateLesson(moduleIndex, lessonIndex, "assignmentTitle", e.target.value)} placeholder="Assignment title or leave blank" /></label>
              </div>
              <label className="admin-course-visibility"><input type="checkbox" checked={lesson.preview === true} onChange={(event) => updateLessonPreview(moduleIndex, lessonIndex, event.target.checked)} /> Public preview lesson (otherwise enrollment-only)</label>
            </div>
          ))}
          <button className="btn btn-outline btn-sm" type="button" onClick={() => addLesson(moduleIndex)}>+ Add lesson</button>
        </section>
      ))}
      {course && !course.modules.length && <p className="admin-overview-empty">This course has no modules yet. Add a module to begin its curriculum.</p>}
      <div className="admin-save-row"><button className="btn btn-outline" type="button" onClick={() => save("Draft")} disabled={!course}>Save draft</button><button className="btn btn-primary" type="button" onClick={() => save("Published")} disabled={!course}>Publish curriculum</button>{saved && <SavedNotice>{saved}</SavedNotice>}</div>
      <p className="admin-disclaimer">Preview lessons are marked for public preview; other lessons are enrollment-only in the student player. Video hosting, file access control, and publishing permissions still require backend enforcement.</p>
    </div>
  );
}

export function MediaManagement() {
  const [catalog, setCatalog] = useState(courses);
  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [moduleIndex, setModuleIndex] = useState("0");
  const [lessonId, setLessonId] = useState("");
  const [saved, setSaved] = useState(false);
  const course = catalog.find((item) => item.id === courseId);
  const module = course?.modules[Number(moduleIndex)];
  const lesson = module?.lessons.find((item) => item.id === lessonId) || module?.lessons[0];

  function save() {
    writeAdminData(adminStorageKeys.courses, catalog);
    courses.splice(0, courses.length, ...catalog);
    setSaved(true);
  }

  function updateLesson(key, value) {
    const updated = structuredClone(catalog);
    const selectedCourse = updated.find((item) => item.id === courseId);
    const selectedModule = selectedCourse?.modules[Number(moduleIndex)];
    const selectedLesson = selectedModule?.lessons.find((item) => item.id === lessonId) || selectedModule?.lessons[0];
    if (!selectedLesson) return;
    selectedLesson[key] = value;
    setCatalog(updated);
    setSaved(false);
  }

  return (
    <>
      <h1>Video & resource management</h1>
      <p className="muted admin-description">Attach a hosted video URL and lesson resource to the curriculum.</p>
      <section className="admin-edit-card admin-plan-form">
        <label>Course<select value={courseId} onChange={(e) => { setCourseId(e.target.value); setModuleIndex("0"); setLessonId(""); setSaved(false); }}>{catalog.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
        <label>Module<select value={moduleIndex} onChange={(e) => { setModuleIndex(e.target.value); setLessonId(""); setSaved(false); }}>{course?.modules.map((item, index) => <option value={index} key={`${item.title}-${index}`}>{item.title}</option>)}</select></label>
        <label>Lesson<select value={lesson?.id || ""} onChange={(e) => { setLessonId(e.target.value); setSaved(false); }}>{module?.lessons.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
        {lesson ? (
          <>
            <label>Hosted video URL<input type="url" value={lesson.videoUrl || ""} onChange={(e) => updateLesson("videoUrl", e.target.value)} placeholder="Direct MP4 or compatible hosted video URL" /></label>
            <label>Resource URL<input type="url" value={lesson.resourceUrl || ""} onChange={(e) => updateLesson("resourceUrl", e.target.value)} placeholder="https://files/worksheet.pdf" /></label>
            <button className="btn btn-primary" onClick={save}>Save lesson media</button>
            {saved && <SavedNotice>Video and resource links saved in this browser.</SavedNotice>}
          </>
        ) : <p className="muted">Add a module and lesson before attaching media.</p>}
      </section>
      <p className="admin-disclaimer">Use URLs from a trusted host. Private video authorization and secure file storage are not provided by this demo.</p>
    </>
  );
}

export function StudentManagement() {
  const [students, setStudents] = useState(getAdminStudents);
  const [query, setQuery] = useState("");

  function updateStudent(id, change) {
    const updated = students.map((student) => student.id === id ? change(student) : student);
    setStudents(updated);
    writeAdminData(adminStorageKeys.students, updated);
  }

  function toggleCourse(studentRecord, courseId) {
    const enrolled = studentRecord.courses.includes(courseId);
    const updatedCourses = enrolled
      ? studentRecord.courses.filter((id) => id !== courseId)
      : [...studentRecord.courses, courseId];
    updateStudent(studentRecord.id, (item) => ({
      ...item,
      courses: updatedCourses,
    }));
    const currentUser = localStorage.getItem("ownTheme_session");
    if (currentUser && JSON.parse(currentUser).email.toLowerCase() === studentRecord.email.toLowerCase()) {
      const savedEnrollment = localStorage.getItem("ownTheme_enrolled");
      const currentEnrollment = savedEnrollment ? JSON.parse(savedEnrollment) : student.enrolled;
      const updatedEnrollment = courses.flatMap((course) => {
        const existing = currentEnrollment.find((item) => item.courseId === course.id);
        if (!updatedCourses.includes(course.id)) return [];
        return [existing || { courseId: course.id, completed: [] }];
      });
      student.enrolled.splice(0, student.enrolled.length, ...updatedEnrollment);
      localStorage.setItem("ownTheme_enrolled", JSON.stringify(updatedEnrollment));
    }
  }

  const shown = students.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <h1>Student management</h1>
      <p className="muted admin-description">Search the demo roster and review course access.</p>
      <input className="search" aria-label="Search students" placeholder="Search by name or email..." value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Student</th><th>Course access</th><th>Device session</th></tr></thead>
          <tbody>
            {shown.map((item) => (
              <tr key={item.id}>
                <td>{item.name}<small>{item.email}</small></td>
                <td><div className="chips">{courses.map((course) => (
                  <button
                    className={item.courses.includes(course.id) ? "chip on" : "chip"}
                    key={course.id}
                    onClick={() => toggleCourse(item, course.id)}
                    aria-pressed={item.courses.includes(course.id)}
                  >{course.title}</button>
                ))}</div></td>
                <td>{item.device || <span className="muted">No active session</span>}
                  {item.device && <button className="btn btn-danger btn-sm admin-reset" onClick={() => updateStudent(item.id, (record) => ({ ...record, device: null }))}>Reset demo session</button>}
                </td>
              </tr>
            ))}
            {!shown.length && <tr><td className="muted" colSpan="3">No students found.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="admin-disclaimer">Access changes update the demo roster only; production permissions must be enforced by an authenticated server.</p>
    </>
  );
}

export function OrdersReview() {
  const [orders, setOrders] = useState(getAdminOrders);

  function updateOrder(id, status) {
    const order = orders.find((item) => item.id === id);
    const updated = orders.map((order) => order.id === id ? { ...order, status } : order);
    setOrders(updated);
    writeAdminData(adminStorageKeys.orders, updated);
    if (order && order.status !== status) {
      addStudentNotification(order.email, {
        title: "Order status updated",
        message: `Order ${order.id} is now marked “${status}”.`,
        type: "order_status",
        href: `/app/billing#billing-history`,
      });
    }
  }

  return (
    <>
      <h1>Orders & payment review</h1>
      <p className="muted admin-description">Review demo checkouts and update their review status.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Item</th><th>Amount</th><th>Method / date</th><th>Status</th><th>Review</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><small>{order.id}</small></td>
                <td>{order.student}<small>{order.email || "Demo record"}</small></td>
                <td>{order.item === "bundle" ? "Complete Bundle" : courses.find((course) => course.id === order.item)?.title || order.item}</td>
                <td>${order.amount}</td>
                <td>{order.method}<small>{order.date}</small></td>
                <td><span className="status-pill">{order.status}</span></td>
                <td><div className="admin-actions-inline">
                  <button className="btn btn-outline btn-sm" onClick={() => updateOrder(order.id, "Reviewed locally")}>Mark reviewed</button>
                  <button className="btn btn-danger btn-sm" onClick={() => updateOrder(order.id, "Follow-up needed")}>Flag</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="admin-disclaimer">No payment provider is connected. Review actions only annotate locally stored demo orders; do not treat these as verified payments.</p>
    </>
  );
}

export function AssignmentReview() {
  const [assignments, setAssignments] = useState(() => readAdminData(adminStorageKeys.assignments, []));
  const [drafts, setDrafts] = useState({});
  const [statuses, setStatuses] = useState({});

  function updateAssignment(id, patch) {
    const updated = assignments.map((item) => item.id === id ? { ...item, ...patch } : item);
    setAssignments(updated);
    writeAdminData(adminStorageKeys.assignments, updated);
  }

  function saveFeedback(item) {
    const feedback = (drafts[item.id] ?? item.feedback ?? "").trim();
    const status = statuses[item.id] || (["Feedback sent", "Submitted"].includes(item.status) ? "Under Review" : item.status) || "Under Review";
    const previousFeedback = item.feedbackHistory?.at(-1)?.comment || item.feedback || "";
    const feedbackHistory = feedback && feedback !== previousFeedback
      ? [...(item.feedbackHistory || []), { comment: feedback, status, createdAt: new Date().toISOString() }]
      : item.feedbackHistory || [];
    updateAssignment(item.id, {
      feedback,
      feedbackHistory,
      status,
      revisionRequirements: status === "Revision Requested" ? feedback : "",
    });
    if (feedback !== previousFeedback || status !== item.status) {
      addStudentNotification(item.studentEmail, {
        title: status === "Revision Requested" ? "Revision requested" : status === "Completed" ? "Assignment review complete" : "Instructor feedback received",
        message: feedback || `${item.title} status changed to ${status}.`,
        type: status === "Revision Requested" ? "revision_requested" : "instructor_feedback",
        href: `/app/feedback/${item.id}`,
      });
    }
    setDrafts((value) => ({ ...value, [item.id]: feedback }));
  }

  return (
    <>
      <h1>Assignment review queue</h1>
      <p className="muted admin-description">Read project notes and save instructor feedback for students.</p>
      {assignments.length ? (
        <div className="admin-review-list">
          {assignments.map((item) => (
            <article className="admin-review-card" key={item.id}>
              <div className="admin-heading-row">
                <div><span className="eyebrow">{courses.find((c) => c.id === item.courseId)?.title || item.courseId}</span><h2>{item.title}</h2><p>{item.notes || "No student note provided."}</p></div>
                <span className="status-pill">{item.status || "Submitted"}</span>
              </div>
              <a href={item.url} target="_blank" rel="noreferrer">Open submitted project ↗</a>
              <label className="admin-feedback-label">Instructor feedback<textarea rows="4" value={drafts[item.id] ?? item.feedback ?? ""} onChange={(e) => setDrafts({ ...drafts, [item.id]: e.target.value })} placeholder="Share specific, constructive feedback…" /></label>
              <label className="admin-feedback-label">Submission status<select value={statuses[item.id] || (["Feedback sent", "Submitted"].includes(item.status) ? "Under Review" : item.status) || "Under Review"} onChange={(e) => setStatuses({ ...statuses, [item.id]: e.target.value })}><option>Submitted</option><option>Under Review</option><option>Revision Requested</option><option>Completed</option></select></label>
              <button className="btn btn-primary btn-sm" onClick={() => saveFeedback(item)}>Save feedback</button>
            </article>
          ))}
        </div>
      ) : <div className="student-empty"><h2>No submissions to review.</h2><p>Student assignments will appear in this queue when submitted.</p></div>}
    </>
  );
}

export function InstructorFeedbackTools() {
  const [assignments, setAssignments] = useState(() => readAdminData(adminStorageKeys.assignments, []).filter((item) => item.feedback || item.feedbackHistory?.length));
  const [drafts, setDrafts] = useState({});
  const [statuses, setStatuses] = useState({});

  function saveFeedback(item) {
    const fullList = readAdminData(adminStorageKeys.assignments, []);
    const feedback = (drafts[item.id] ?? item.feedback ?? "").trim();
    const status = statuses[item.id] || (["Feedback sent", "Submitted"].includes(item.status) ? "Under Review" : item.status) || "Under Review";
    const previousFeedback = item.feedbackHistory?.at(-1)?.comment || item.feedback || "";
    const feedbackHistory = feedback && feedback !== previousFeedback
      ? [...(item.feedbackHistory || []), { comment: feedback, status, createdAt: new Date().toISOString() }]
      : item.feedbackHistory || [];
    const updated = fullList.map((record) => record.id === item.id ? {
      ...record,
      feedback,
      feedbackHistory,
      status,
      revisionRequirements: status === "Revision Requested" ? feedback : "",
    } : record);
    writeAdminData(adminStorageKeys.assignments, updated);
    setAssignments(updated.filter((record) => record.feedback || record.feedbackHistory?.length));
    if (feedback !== previousFeedback || status !== item.status) {
      addStudentNotification(item.studentEmail, {
        title: status === "Revision Requested" ? "Revision requested" : status === "Completed" ? "Assignment review complete" : "Instructor feedback received",
        message: feedback || `${item.title} status changed to ${status}.`,
        type: status === "Revision Requested" ? "revision_requested" : "instructor_feedback",
        href: `/app/feedback/${item.id}`,
      });
    }
  }

  return (
    <>
      <h1>Instructor feedback tools</h1>
      <p className="muted admin-description">Review and refine feedback already sent to students.</p>
      {assignments.length ? (
        <div className="admin-review-list">
          {assignments.map((item) => (
            <article className="admin-review-card" key={item.id}>
              <span className="eyebrow">{courses.find((c) => c.id === item.courseId)?.title || item.courseId}</span>
              <h2>{item.title}</h2>
              <p>{item.notes || "No student note provided."}</p>
              <label className="admin-feedback-label">Feedback<textarea rows="4" value={drafts[item.id] ?? item.feedback ?? ""} onChange={(e) => setDrafts({ ...drafts, [item.id]: e.target.value })} /></label>
              <label className="admin-feedback-label">Submission status<select value={statuses[item.id] || (["Feedback sent", "Submitted"].includes(item.status) ? "Under Review" : item.status) || "Under Review"} onChange={(e) => setStatuses({ ...statuses, [item.id]: e.target.value })}><option>Submitted</option><option>Under Review</option><option>Revision Requested</option><option>Completed</option></select></label>
              <button className="btn btn-primary btn-sm" onClick={() => saveFeedback(item)}>Update feedback</button>
            </article>
          ))}
        </div>
      ) : <div className="student-empty"><h2>No feedback sent yet.</h2><p>Send feedback from the assignment review queue. It will be available to the student here.</p></div>}
    </>
  );
}

export function PlanManagement() {
  const initial = readAdminData(adminStorageKeys.plans, {
    bundlePrice: 180,
    coursePrices: { "short-form": 50, "long-form": 80, "film-doc": 100 },
    membershipStatus: "Coming soon",
    membershipPrice: "",
    membershipBillingCycle: "",
    membershipAccess: "",
    membershipRenewalTerms: "",
  });
  const [plans, setPlans] = useState(initial);
  const [saved, setSaved] = useState(false);

  function save() {
    writeAdminData(adminStorageKeys.plans, {
      ...plans,
      bundlePrice: Number(plans.bundlePrice),
      coursePrices: Object.fromEntries(Object.entries(plans.coursePrices || {}).map(([id, price]) => [id, Number(price)])),
    });
    setSaved(true);
  }

  return (
    <>
      <h1>Bundles & subscription plans</h1>
      <p className="muted admin-description">Configure course and bundle demo prices. Membership terms appear publicly only when every recurring payment and access term is supplied.</p>
      <section className="admin-edit-card admin-plan-form">
        <label>Complete bundle price (USD)<input type="number" min="0" step="1" value={plans.bundlePrice} onChange={(e) => { setPlans({ ...plans, bundlePrice: e.target.value }); setSaved(false); }} /></label>
        {courses.map((course) => (
          <label key={course.id}>{course.title} price (USD)<input type="number" min="0" step="1" value={plans.coursePrices?.[course.id] ?? 0} onChange={(e) => { setPlans({ ...plans, coursePrices: { ...plans.coursePrices, [course.id]: e.target.value } }); setSaved(false); }} /></label>
        ))}
        <label>Membership status<select value={plans.membershipStatus} onChange={(e) => { setPlans({ ...plans, membershipStatus: e.target.value }); setSaved(false); }}><option>Coming soon</option><option>Available</option><option>Paused</option></select></label>
        <label>Membership recurring price<input value={plans.membershipPrice} onChange={(e) => { setPlans({ ...plans, membershipPrice: e.target.value }); setSaved(false); }} placeholder="For example, $X USD" /></label>
        <label>Membership billing frequency<input value={plans.membershipBillingCycle || ""} onChange={(e) => { setPlans({ ...plans, membershipBillingCycle: e.target.value }); setSaved(false); }} placeholder="For example, billed monthly" /></label>
        <label>Membership access included<textarea rows="3" value={plans.membershipAccess || ""} onChange={(e) => { setPlans({ ...plans, membershipAccess: e.target.value }); setSaved(false); }} placeholder="Specify exactly what members can access" /></label>
        <label>Membership renewal and cancellation terms<textarea rows="3" value={plans.membershipRenewalTerms || ""} onChange={(e) => { setPlans({ ...plans, membershipRenewalTerms: e.target.value }); setSaved(false); }} placeholder="Explain renewal and cancellation terms" /></label>
        <button className="btn btn-primary" onClick={save}>Save plans</button>
        {saved && <SavedNotice>Plan settings saved. Public pricing refreshes after reload.</SavedNotice>}
      </section>
      <p className="admin-disclaimer">Membership is not connected to billing. A plan set to “Available” is an editorial flag only, not a purchasable subscription. All recurring price, billing frequency, included access, and renewal/cancellation details must be confirmed before the plan is displayed as defined.</p>
    </>
  );
}

export function ShowcaseModeration() {
  const [assignments, setAssignments] = useState(() => readAdminData(adminStorageKeys.assignments, []));
  const [projects, setProjects] = useState(() => readAdminData(adminStorageKeys.showcaseProjects, []));

  function moderate(item, published) {
    if (!item.showcaseConsent) return;
    if (item.isShowcaseProject) {
      const updated = projects.map((record) => record.id === item.id ? { ...record, showcasePublished: published } : record);
      setProjects(updated);
      writeAdminData(adminStorageKeys.showcaseProjects, updated);
      return;
    }
    const updated = assignments.map((record) => record.id === item.id ? { ...record, showcasePublished: published } : record);
    setAssignments(updated);
    writeAdminData(adminStorageKeys.assignments, updated);
  }

  const submissions = assignments.map((item) => ({ ...item, isShowcaseProject: false }));
  const studentProjects = projects.map((item) => ({
    ...item,
    url: item.mediaUrl || item.url,
    notes: item.description || "",
    isShowcaseProject: true,
  }));
  const reviewItems = [...submissions, ...studentProjects];

  return (
    <>
      <h1>Showcase moderation</h1>
      <p className="muted admin-description">Only feature student work when the student has opted in.</p>
      {reviewItems.length ? (
        <div className="admin-review-list">
          {reviewItems.map((item) => (
            <article className="admin-review-card" key={item.id}>
              <div className="admin-heading-row">
                <div><span className="eyebrow">{courses.find((c) => c.id === item.courseId)?.title || item.courseId}</span><h2>{item.title}</h2>{/^https?:\/\//i.test(item.url || "") && <a href={item.url} target="_blank" rel="noreferrer">Open project ↗</a>}</div>
                <span className="status-pill">{item.showcasePublished ? "Published" : "Private"}</span>
              </div>
              <p>{item.notes || "No student note provided."}</p>
              <p className={item.showcaseConsent ? "admin-consent granted" : "admin-consent"}>
                {item.showcaseConsent ? "Student opted in to public showcase." : "No showcase permission recorded."}
              </p>
              <div className="admin-actions-inline">
                <button className="btn btn-primary btn-sm" disabled={!item.showcaseConsent || !/^https?:\/\//i.test(item.url || "")} onClick={() => moderate(item, true)}>Publish</button>
                {item.showcasePublished && <button className="btn btn-outline btn-sm" onClick={() => moderate(item, false)}>Unpublish</button>}
              </div>
            </article>
          ))}
        </div>
      ) : <div className="student-empty"><h2>No projects submitted.</h2><p>Submitted student projects will be listed here for moderation.</p></div>}
    </>
  );
}

export function SiteSettings() {
  const initial = readAdminData(adminStorageKeys.settings, {
    homeHeadline: "You don't have to follow a theme. Build one.",
    homeDescription: "Three video editing courses that teach you to design your own style, not copy a template.",
    supportEmail: "",
  });
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(false);

  function save() {
    writeAdminData(adminStorageKeys.settings, settings);
    setSaved(true);
    window.dispatchEvent(new Event("ownTheme:site-settings-updated"));
  }

  return (
    <>
      <h1>Site content & settings</h1>
      <p className="muted admin-description">Edit public-facing homepage text and support contact details.</p>
      <section className="admin-edit-card admin-plan-form">
        <label>Homepage headline<input value={settings.homeHeadline} onChange={(e) => { setSettings({ ...settings, homeHeadline: e.target.value }); setSaved(false); }} /></label>
        <label>Homepage description<textarea rows="3" value={settings.homeDescription} onChange={(e) => { setSettings({ ...settings, homeDescription: e.target.value }); setSaved(false); }} /></label>
        <label>Support email<input type="email" value={settings.supportEmail} onChange={(e) => { setSettings({ ...settings, supportEmail: e.target.value }); setSaved(false); }} placeholder="Not published until configured" /></label>
        <button className="btn btn-primary" onClick={save}>Save site settings</button>
        {saved && <SavedNotice>Site settings saved in this browser.</SavedNotice>}
      </section>
      <p className="admin-disclaimer">Homepage text changes appear after reload. Add a verified support address before publishing contact details.</p>
    </>
  );
}
