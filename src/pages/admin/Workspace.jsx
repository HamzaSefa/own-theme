import { useState } from "react";
import { courses, getProgress, student } from "../../data/courses";
import { prices } from "../../data/admin";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState, SuccessMessage, ValidationError } from "../../components/States";
import {
  getUserEnrollments,
  getUserStorageKey,
  saveUserEnrollments,
} from "../../data/studentPortal";
import {
  adminStorageKeys,
  getAdminOrders,
  getAdminPlans,
  getAdminStudents,
  logAdminAction,
  readAdminData,
  writeAdminData,
} from "../../data/adminWorkspace";

function SavedNotice({ children }) {
  return <SuccessMessage>{children}</SuccessMessage>;
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
  const preferences = readAdminData(getUserStorageKey("ownTheme_notification_preferences", recipientEmail), {});
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
  const savedCategories = readAdminData(adminStorageKeys.settings, {}).categories;
  const courseCategories = Array.isArray(savedCategories) && savedCategories.length
    ? [...new Set([...savedCategories, "Other"])]
    : ["Short-Form & Social Media", "Long-Form & YouTube", "Film & Documentary", "Other"];
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
      category: courseCategories[0],
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
            <label>Category<select value={course.category} onChange={(event) => updateCourse("category", event.target.value)}>{!courseCategories.includes(course.category) && <option>{course.category}</option>}{courseCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
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
          <div className="admin-save-row"><button className="btn btn-primary" type="submit">{editingId ? "Save course" : "Create course"}</button>{saved && <SavedNotice>Course saved in this browser preview.</SavedNotice>}<ValidationError>{validationError}</ValidationError></div>
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
            lessons: module.lessons.map((lesson) => {
              const savedLesson = { ...lesson };
              delete savedLesson.videoUrl;
              delete savedLesson.resourceUrl;
              return {
                ...savedLesson,
                accessStatus: savedLesson.preview === true ? "Preview" : "Enrollment-only",
              };
            }),
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
                <label>Hosted video asset ID<input value={lesson.videoAssetId || ""} onChange={(e) => updateLesson(moduleIndex, lessonIndex, "videoAssetId", e.target.value)} placeholder="Provider asset ID (no private URL)" /></label>
                <label>Resource asset ID<input value={lesson.resourceAssetId || ""} onChange={(e) => updateLesson(moduleIndex, lessonIndex, "resourceAssetId", e.target.value)} placeholder="Secure file asset ID" /></label>
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
  const [mediaRecords, setMediaRecords] = useState(() => readAdminData(adminStorageKeys.media, {}));
  const course = catalog.find((item) => item.id === courseId);
  const module = course?.modules[Number(moduleIndex)];
  const lesson = module?.lessons.find((item) => item.id === lessonId) || module?.lessons[0];
  const media = (lesson && mediaRecords[lesson.id]) || {};

  function save() {
    const updated = structuredClone(catalog);
    const selectedLesson = updated.find((item) => item.id === courseId)
      ?.modules[Number(moduleIndex)]?.lessons.find((item) => item.id === lesson?.id);
    if (selectedLesson) {
      delete selectedLesson.videoUrl;
      delete selectedLesson.resourceUrl;
      Object.assign(selectedLesson, {
        videoAssetId: media.videoAssetId || "",
        resourceAssetId: media.resourceAssetId || "",
        resourceTitle: media.resourceTitle || "",
      });
    }
    setCatalog(updated);
    courses.splice(0, courses.length, ...updated);
    writeAdminData(adminStorageKeys.courses, updated);
    writeAdminData(adminStorageKeys.media, mediaRecords);
    setSaved(true);
    window.dispatchEvent(new Event("ownTheme:catalog-updated"));
  }

  function updateMedia(key, value) {
    if (!lesson) return;
    setMediaRecords((current) => ({
      ...current,
      [lesson.id]: { ...(current[lesson.id] || {}), [key]: value },
    }));
    if (key === "videoAccess") {
      const updated = structuredClone(catalog);
      const selectedLesson = updated.find((item) => item.id === courseId)
        ?.modules[Number(moduleIndex)]?.lessons.find((item) => item.id === lesson.id);
      if (selectedLesson) {
        selectedLesson.preview = value === "Public preview";
        selectedLesson.accessStatus = selectedLesson.preview ? "Preview" : "Enrollment-only";
        setCatalog(updated);
      }
    }
    setSaved(false);
  }

  function removeMedia() {
    if (!lesson || !window.confirm("Remove video and resource references and metadata for this lesson?")) return;
    const updatedMedia = { ...mediaRecords };
    delete updatedMedia[lesson.id];
    const updated = structuredClone(catalog);
    const selectedLesson = updated.find((item) => item.id === courseId)
      ?.modules[Number(moduleIndex)]?.lessons.find((item) => item.id === lesson.id);
    if (selectedLesson) {
      delete selectedLesson.videoUrl;
      delete selectedLesson.resourceUrl;
      delete selectedLesson.videoAssetId;
      delete selectedLesson.resourceAssetId;
      selectedLesson.preview = false;
      selectedLesson.accessStatus = "Enrollment-only";
    }
    setMediaRecords(updatedMedia);
    setCatalog(updated);
    courses.splice(0, courses.length, ...updated);
    writeAdminData(adminStorageKeys.courses, updated);
    writeAdminData(adminStorageKeys.media, updatedMedia);
    setSaved(true);
    window.dispatchEvent(new Event("ownTheme:catalog-updated"));
  }

  return (
    <div className="admin-media-management">
      <h1>Video & resource management</h1>
      <p className="muted admin-description">Manage lesson media metadata and provider asset references without placing private playback URLs or provider secrets in public course data.</p>
      <section className="admin-edit-card admin-plan-form">
        <label>Course<select value={courseId} onChange={(e) => { setCourseId(e.target.value); setModuleIndex("0"); setLessonId(""); setSaved(false); }}>{catalog.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
        <label>Module<select value={course?.modules[Number(moduleIndex)] ? moduleIndex : ""} onChange={(e) => { setModuleIndex(e.target.value); setLessonId(""); setSaved(false); }}><option value="" disabled>Select a module</option>{course?.modules.map((item, index) => <option value={index} key={`${item.title}-${index}`}>{item.title}</option>)}</select></label>
        <label>Lesson<select value={lesson?.id || ""} onChange={(e) => { setLessonId(e.target.value); setSaved(false); }}><option value="">Select a lesson</option>{module?.lessons.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
        {lesson ? (
          <>
            <div className="admin-media-group">
              <span className="eyebrow">VIDEO ASSET</span>
              <label>Video title<input value={media.videoTitle || lesson.title || ""} onChange={(e) => updateMedia("videoTitle", e.target.value)} /></label>
              <label>Video description<textarea rows="3" value={media.videoDescription || ""} onChange={(e) => updateMedia("videoDescription", e.target.value)} /></label>
              <label>Set or replace hosted provider asset ID<input value={media.videoAssetId || lesson.videoAssetId || ""} onChange={(e) => updateMedia("videoAssetId", e.target.value)} placeholder="Asset ID from your video provider" /></label>
              <div className="admin-fields-two">
                <label>Processing status<select value={media.processingStatus || "Not uploaded"} onChange={(e) => updateMedia("processingStatus", e.target.value)}><option>Not uploaded</option><option>Queued</option><option>Processing</option><option>Ready</option><option>Failed</option></select></label>
                <label>Playback status<select value={media.playbackStatus || "Unavailable"} onChange={(e) => updateMedia("playbackStatus", e.target.value)}><option>Unavailable</option><option>Playable</option><option>Restricted</option></select></label>
              </div>
              <label>Visibility and access<select value={media.videoAccess || (lesson.preview ? "Public preview" : "Enrolled students")} onChange={(e) => updateMedia("videoAccess", e.target.value)}><option>Public preview</option><option>Enrolled students</option><option>Private / staff only</option></select></label>
            </div>
            <div className="admin-media-group">
              <span className="eyebrow">RESOURCE FILE</span>
              <label>File title<input value={media.resourceTitle || lesson.resourceTitle || ""} onChange={(e) => updateMedia("resourceTitle", e.target.value)} /></label>
              <label>Set or replace resource asset identifier<input value={media.resourceAssetId || lesson.resourceAssetId || ""} onChange={(e) => updateMedia("resourceAssetId", e.target.value)} placeholder="Stored file ID from your asset service" /></label>
              <div className="admin-fields-two">
                <label>File type<input value={media.resourceType || ""} onChange={(e) => updateMedia("resourceType", e.target.value)} placeholder="PDF, ZIP, MP4…" /></label>
                <label>File size<input value={media.resourceSize || ""} onChange={(e) => updateMedia("resourceSize", e.target.value)} placeholder="e.g. 12 MB" /></label>
              </div>
              <label>Resource access<select value={media.resourceAccess || "Enrolled students"} onChange={(e) => updateMedia("resourceAccess", e.target.value)}><option>Public</option><option>Enrolled students</option><option>Private / staff only</option></select></label>
            </div>
            <div className="admin-actions-inline">
              <button type="button" className="btn btn-primary" onClick={save}>Save media metadata</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={removeMedia}>Remove media</button>
              {saved && <SavedNotice>Media metadata saved in this browser preview.</SavedNotice>}
            </div>
          </>
        ) : <p className="muted">Add a module and lesson before attaching media.</p>}
      </section>
      <p className="admin-disclaimer">This browser-only preview stores asset IDs and metadata, not secure provider credentials or playback URLs. Playback authorization, file delivery, and access rules must be enforced by a backend before launch.</p>
    </div>
  );
}

export function StudentManagement() {
  const [students, setStudents] = useState(getAdminStudents);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  function updateStudent(id, change, audit = null) {
    const previous = students.find((item) => item.id === id);
    const updated = students.map((student) => student.id === id ? change(student) : student);
    setStudents(updated);
    writeAdminData(adminStorageKeys.students, updated);
    if (audit && previous) {
      logAdminAction({
        ...audit,
        targetEmail: previous.email,
        targetName: previous.name,
      });
    }
  }

  function toggleCourse(studentRecord, courseId) {
    const enrolled = studentRecord.courses.includes(courseId);
    const updatedCourses = enrolled
      ? studentRecord.courses.filter((id) => id !== courseId)
      : [...studentRecord.courses, courseId];
    updateStudent(studentRecord.id, (item) => ({
      ...item,
      courses: updatedCourses,
    }), {
      type: "enrollment_access_changed",
      summary: `${enrolled ? "Removed" : "Granted"} ${courses.find((item) => item.id === courseId)?.title || courseId} enrollment`,
      courseId,
    });
    const currentEnrollment = getUserEnrollments(student.enrolled, studentRecord.email);
    const updatedEnrollment = courses.flatMap((course) => {
      const existing = currentEnrollment.find((item) => item.courseId === course.id);
      if (!updatedCourses.includes(course.id)) return [];
      return [existing || { courseId: course.id, completed: [] }];
    });
    saveUserEnrollments(updatedEnrollment, studentRecord.email);
  }

  const shown = students.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selectedStudent = students.find((item) => item.id === selectedId);
  const selectedEmail = selectedStudent?.email.toLowerCase();
  const orders = readAdminData(adminStorageKeys.orders, []).filter((item) => item.email?.toLowerCase() === selectedEmail);
  const assignments = readAdminData(adminStorageKeys.assignments, []).filter((item) => item.studentEmail?.toLowerCase() === selectedEmail);
  const auditHistory = readAdminData(adminStorageKeys.auditLog, []).filter((item) => item.targetEmail?.toLowerCase() === selectedEmail).slice(0, 8);
  const currentEnrollments = selectedEmail
    ? getUserEnrollments(student.enrolled, selectedEmail)
    : [];

  return (
    <div className="admin-student-management">
      <h1>Student management</h1>
      <p className="muted admin-description">Search student records, review their learning history, and update demo course access.</p>
      <input className="search" aria-label="Search students" placeholder="Search by name or email..." value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Student</th><th>Account status</th><th>Course access</th><th>Details</th></tr></thead>
          <tbody>
            {shown.map((item) => (
              <tr key={item.id}>
                <td>{item.name}<small>{item.email}</small></td>
                <td>
                  <span className={`status-pill ${item.accountStatus === "Suspended" ? "admin-status-suspended" : ""}`}>{item.accountStatus || "Active"}</span>
                  <button
                    className={`btn btn-sm ${item.accountStatus === "Suspended" ? "btn-outline" : "btn-danger"} admin-reset`}
                    onClick={() => {
                      const nextStatus = item.accountStatus === "Suspended" ? "Active" : "Suspended";
                      updateStudent(item.id, (record) => ({ ...record, accountStatus: nextStatus }), {
                        type: "account_status_changed",
                        summary: `Account status changed to ${nextStatus}`,
                      });
                    }}
                  >{item.accountStatus === "Suspended" ? "Reactivate (demo)" : "Suspend (demo)"}</button>
                </td>
                <td><div className="chips">{courses.map((course) => (
                  <button
                    className={item.courses.includes(course.id) ? "chip on" : "chip"}
                    key={course.id}
                    onClick={() => toggleCourse(item, course.id)}
                    aria-pressed={item.courses.includes(course.id)}
                  >{course.title}</button>
                ))}</div></td>
                <td><button className="btn btn-outline btn-sm" onClick={() => setSelectedId(selectedId === item.id ? "" : item.id)}>{selectedId === item.id ? "Hide details" : "View details"}</button></td>
              </tr>
            ))}
            {!shown.length && <tr><td className="muted" colSpan="4">No students found.</td></tr>}
          </tbody>
        </table>
      </div>
      {selectedStudent && (
        <section className="admin-student-detail admin-edit-card">
          <div className="admin-heading-row">
            <div><span className="eyebrow">STUDENT RECORD</span><h2>{selectedStudent.name}</h2><p className="muted">{selectedStudent.email}</p></div>
            <span className="status-pill">{selectedStudent.accountStatus || "Active"}</span>
          </div>
          <div className="admin-student-detail-grid">
            <section><h3>Enrollment history</h3>
              {selectedStudent.courses.length ? <ul>{selectedStudent.courses.map((id) => {
                const course = courses.find((item) => item.id === id);
                const enrollment = currentEnrollments.find((item) => item.courseId === id);
                const progress = course && enrollment ? getProgress(course, enrollment.completed || []) : null;
                return <li key={id}>{course?.title || id}{progress != null ? ` · ${progress}% complete` : " · progress unavailable"}</li>;
              })}</ul> : <p className="muted">No course enrollments are recorded.</p>}
            </section>
            <section><h3>Purchase history</h3>
              {orders.length ? <ul>{orders.map((order) => <li key={order.id}>{order.item === "bundle" ? "Complete Bundle" : courses.find((course) => course.id === order.item)?.title || order.item} · {order.status || "Status unavailable"}{order.amount != null ? ` · $${order.amount}` : ""}</li>)}</ul> : <p className="muted">No purchase records found for this account.</p>}
            </section>
            <section><h3>Assignment history</h3>
              {assignments.length ? <ul>{assignments.map((item) => <li key={item.id}>{item.title || "Assignment"} · {item.status || "Status unavailable"}</li>)}</ul> : <p className="muted">No assignment history found for this account.</p>}
            </section>
            <section><h3>Device session</h3>
              {selectedStudent.device ? <><p>{selectedStudent.device}<small> Active {selectedStudent.lastActive || "time unavailable"}</small></p><button className="btn btn-danger btn-sm" onClick={() => updateStudent(selectedStudent.id, (record) => ({ ...record, device: null }), { type: "demo_session_reset", summary: "Demo device session reset" })}>Reset demo session</button></> : <p className="muted">No active session recorded.</p>}
            </section>
          </div>
          <section className="admin-student-audit">
            <h3>Recent access-change audit</h3>
            {auditHistory.length ? <ul>{auditHistory.map((entry) => <li key={entry.id}><span>{entry.summary}</span><small>{entry.actor} · {new Date(entry.createdAt).toLocaleString()}</small></li>)}</ul> : <p className="muted">No access-change actions recorded.</p>}
          </section>
          <p className="admin-security-warning">Admin role changes are not available in this browser preview. Granting or removing administrative privileges requires authenticated server-side authorization and an immutable audit log.</p>
        </section>
      )}
      <p className="admin-disclaimer">Access changes and audit entries are browser-local demo records, not effective account controls. Production account enforcement and auditable actions require a trusted server.</p>
    </div>
  );
}

export function OrdersReview() {
  const [orders, setOrders] = useState(getAdminOrders);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [filter, setFilter] = useState("All orders");
  const [savedNotice, setSavedNotice] = useState("");
  const [providerReferenceDrafts, setProviderReferenceDrafts] = useState({});
  const manualPayment = (order) => /manual|bank|transfer|cash/i.test(`${order.method || ""} ${order.provider || ""}`);
  const pendingManualOrders = orders.filter((order) => manualPayment(order) && /pending/i.test(order.status || ""));
  const filteredOrders = filter === "Pending manual payment"
    ? pendingManualOrders
    : filter === "Refunded or cancelled"
      ? orders.filter((order) => /refund|cancel/i.test(`${order.status || ""} ${order.refundStatus || ""}`))
      : orders;
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);

  function updateOrder(id, patch) {
    const order = orders.find((item) => item.id === id);
    if (!order) return;
    const status = patch.status ?? order.status;
    const statusChanged = status !== order.status;
    const refundChanged = patch.refundStatus !== undefined && patch.refundStatus !== order.refundStatus;
    const cancellationChanged = patch.cancellationStatus !== undefined && patch.cancellationStatus !== order.cancellationStatus;
    const referenceChanged = patch.providerReference !== undefined && patch.providerReference !== order.providerReference;
    if (!statusChanged && !refundChanged && !cancellationChanged && !referenceChanged) {
      setSavedNotice("No order changes to save.");
      return;
    }
    const now = new Date().toISOString();
    const eventLabel = refundChanged
      ? `Refund status: ${patch.refundStatus}`
      : cancellationChanged
        ? `Cancellation status: ${patch.cancellationStatus}`
        : statusChanged
          ? `Payment status: ${status}`
          : "Provider reference updated";
    const history = [
      ...(order.history || []),
      { id: crypto.randomUUID(), event: eventLabel, status, createdAt: now, reference: patch.providerReference ?? order.providerReference ?? "" },
    ];
    const updated = orders.map((item) => item.id === id ? { ...item, ...patch, history, updatedAt: now } : item);
    setOrders(updated);
    writeAdminData(adminStorageKeys.orders, updated);
    setSavedNotice(`Order update saved in this browser preview. No payment provider was contacted.`);
    if (statusChanged || refundChanged || cancellationChanged || referenceChanged) {
      logAdminAction({
        type: referenceChanged && !statusChanged && !refundChanged && !cancellationChanged
          ? "financial_record_reference_updated"
          : "financial_record_status_changed",
        targetEmail: order.email || "",
        targetName: order.student || "",
        orderId: order.id,
        summary: `${order.id}: ${eventLabel}`,
      });
    }
    if (statusChanged || refundChanged || cancellationChanged) {
      addStudentNotification(order.email, {
        title: "Order information updated",
        message: `Order ${order.id}: ${eventLabel}.`,
        type: "order_status",
        href: `/app/billing#billing-history`,
      });
    }
  }

  return (
    <div className="admin-orders-review">
      <h1>Orders & payment review</h1>
      <p className="muted admin-description">Review order records, payment references, and any supported refund or cancellation updates.</p>
      <section className="admin-manual-payment-queue">
        <div><span className="eyebrow">MANUAL PAYMENT REVIEW</span><strong>{pendingManualOrders.length} pending</strong><p>Only orders explicitly marked as manual payment and pending appear here. Online payment status must come from verified provider notifications, which are not connected in this preview.</p></div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setFilter(filter === "Pending manual payment" ? "All orders" : "Pending manual payment")}>{filter === "Pending manual payment" ? "Show all orders" : "Open pending queue"}</button>
      </section>
      <label className="admin-order-filter">Filter orders
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option>All orders</option><option>Pending manual payment</option><option>Refunded or cancelled</option>
        </select>
      </label>
      {savedNotice && <SavedNotice>{savedNotice}</SavedNotice>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Order reference</th><th>Student</th><th>Purchased item</th><th>Amount</th><th>Provider / method</th><th>Payment status</th><th>Details</th></tr></thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.reference || order.id}<small>{order.date || order.createdAt || "Date unavailable"}</small></td>
                <td>{order.student || order.name || "Student unavailable"}<small>{order.email || "Email unavailable"}</small></td>
                <td>{order.item === "bundle" ? "Complete Bundle" : order.item === "subscription" ? "Subscription" : courses.find((course) => course.id === order.item)?.title || order.item || "Item unavailable"}</td>
                <td>{order.currency || "USD"} {order.amount ?? "Not recorded"}</td>
                <td>{order.provider || order.method || "Not recorded"}<small>{order.providerReference || "No provider reference"}</small></td>
                <td><span className="status-pill">{order.status || "Status unavailable"}</span></td>
                <td><button className="btn btn-outline btn-sm" type="button" onClick={() => setSelectedOrderId(selectedOrderId === order.id ? "" : order.id)}>{selectedOrderId === order.id ? "Hide details" : "Review order"}</button></td>
              </tr>
            ))}
            {!filteredOrders.length && <tr><td className="muted" colSpan="7">{filter === "Pending manual payment" ? "No pending manual payments." : "No orders match this filter."}</td></tr>}
          </tbody>
        </table>
      </div>
      {selectedOrder && <section className="admin-order-detail admin-edit-card">
        <div className="admin-heading-row"><div><span className="eyebrow">ORDER DETAILS</span><h2>{selectedOrder.reference || selectedOrder.id}</h2><p className="muted">{selectedOrder.student || selectedOrder.name || "Student unavailable"} · {selectedOrder.email || "Email unavailable"}</p></div><span className="status-pill">{selectedOrder.status || "Status unavailable"}</span></div>
        <div className="admin-order-fields">
          <label>Payment status<select disabled={!manualPayment(selectedOrder)} value={selectedOrder.status || "Pending"} onChange={(event) => updateOrder(selectedOrder.id, { status: event.target.value })}>
            {manualPayment(selectedOrder)
              ? ["Pending", "Received (manual review)", "Rejected (manual review)", "Cancelled"].map((status) => <option key={status}>{status}</option>)
              : <option>{selectedOrder.status || "Status unavailable"}</option>}
          </select></label>
          <label>Provider reference<input value={providerReferenceDrafts[selectedOrder.id] ?? selectedOrder.providerReference ?? ""} onChange={(event) => setProviderReferenceDrafts((current) => ({ ...current, [selectedOrder.id]: event.target.value }))} placeholder="Reference supplied by payment provider" /></label>
          <label>Refund status<select value={selectedOrder.refundStatus || "Not requested"} onChange={(event) => updateOrder(selectedOrder.id, { refundStatus: event.target.value })}><option>Not requested</option><option>Requested</option><option>Pending</option><option>Refunded</option><option>Declined</option><option>Not supported</option></select></label>
          <label>Cancellation status<select value={selectedOrder.cancellationStatus || "Not requested"} onChange={(event) => updateOrder(selectedOrder.id, { cancellationStatus: event.target.value })}><option>Not requested</option><option>Requested</option><option>Cancelled</option><option>Declined</option><option>Not applicable</option></select></label>
        </div>
        {!manualPayment(selectedOrder) && <p className="admin-disclaimer">Payment status is read-only here. Online payment status can only be updated by verified provider notifications on the backend.</p>}
        <button type="button" className="btn btn-primary btn-sm" onClick={() => {
          const providerReference = providerReferenceDrafts[selectedOrder.id] ?? selectedOrder.providerReference ?? "";
          updateOrder(selectedOrder.id, { providerReference });
          setProviderReferenceDrafts((current) => {
            const updated = { ...current };
            delete updated[selectedOrder.id];
            return updated;
          });
        }}>Save order reference</button>
        <section className="admin-order-history"><h3>Transaction history</h3>{selectedOrder.history?.length ? <ul>{[...selectedOrder.history].reverse().map((entry) => <li key={entry.id}><span>{entry.event || entry.status || "Order event"}</span><small>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Date unavailable"}{entry.reference ? ` · ${entry.reference}` : ""}</small></li>)}</ul> : <p className="muted">No transaction history is recorded for this order.</p>}</section>
      </section>}
      <p className="admin-disclaimer">Local edits only. Do not mark an online payment paid based on browser data: payment status must be updated by verified provider notifications. No refunds or cancellations are processed here.</p>
    </div>
  );
}

export function AssignmentReview({ submissionId = "" }) {
  const [assignments, setAssignments] = useState(() => readAdminData(adminStorageKeys.assignments, []));
  const [drafts, setDrafts] = useState({});
  const [statuses, setStatuses] = useState({});
  const [criterionDrafts, setCriterionDrafts] = useState({});
  const [savedNotice, setSavedNotice] = useState("");
  const navigate = useNavigate();
  const statusesToReview = ["Submitted", "Under Review", "Revision Requested", "Completed"];
  const submissions = assignments.filter((item) => item.status !== "Draft" && (item.submittedAt || statusesToReview.includes(item.status)));
  const selectedSubmission = submissionId ? submissions.find((item) => item.id === submissionId) : null;

  function updateAssignment(id, patch) {
    const updated = assignments.map((item) => item.id === id ? { ...item, ...patch } : item);
    setAssignments(updated);
    writeAdminData(adminStorageKeys.assignments, updated);
    return updated.find((item) => item.id === id);
  }

  function saveFeedback(item, requestedStatus) {
    const feedback = (drafts[item.id] ?? item.feedback ?? "").trim();
    const status = requestedStatus || statuses[item.id] || item.status || "Under Review";
    const previousFeedback = item.feedbackHistory?.at(-1)?.comment || item.feedback || "";
    const criteriaValues = criterionDrafts[item.id] || item.criterionFeedback || {};
    const now = new Date().toISOString();
    const criteria = Object.entries(criteriaValues)
      .filter(([, comment]) => comment?.trim())
      .map(([criterion, comment]) => `${criterion}: ${comment.trim()}`);
    const changed = feedback !== previousFeedback || status !== item.status || JSON.stringify(criteriaValues) !== JSON.stringify(item.criterionFeedback || {});
    if (!changed) {
      setSavedNotice("No review changes to save.");
      return;
    }
    const feedbackHistory = [
      ...(item.feedbackHistory || []),
      { comment: feedback, status, criteria, createdAt: now },
    ];
    const reviewHistory = [
      ...(item.reviewHistory || []),
      { status, comment: feedback, criteria, createdAt: now },
    ];
    updateAssignment(item.id, {
      feedback,
      feedbackHistory,
      criterionFeedback: criteriaValues,
      reviewHistory,
      status,
      revisionRequirements: status === "Revision Requested" ? feedback : "",
      reviewedAt: now,
    });
    if (item.studentEmail) {
      addStudentNotification(item.studentEmail, {
        title: status === "Revision Requested" ? "Revision requested" : status === "Completed" ? "Assignment review complete" : "Instructor feedback received",
        message: feedback || `${item.title} status changed to ${status}.`,
        type: status === "Revision Requested" ? "revision_requested" : "instructor_feedback",
        href: `/app/feedback/${item.id}`,
      });
    }
    setSavedNotice("Review saved in this browser preview. No backend has confirmed this update.");
  }

  const getStudentName = (email) => getAdminStudents().find((record) => record.email?.toLowerCase() === email?.toLowerCase())?.name || email || "Student unavailable";
  const previousSubmissions = selectedSubmission
    ? submissions.filter((item) => item.id !== selectedSubmission.id
      && item.assignmentId === selectedSubmission.assignmentId
      && item.studentEmail?.toLowerCase() === selectedSubmission.studentEmail?.toLowerCase())
      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
    : [];
  const criteria = Array.isArray(selectedSubmission?.criteria)
    ? selectedSubmission.criteria
    : selectedSubmission?.evaluationCriteria || [];
  const selectedCourse = courses.find((course) => course.id === selectedSubmission?.courseId);
  const configuredAssignment = selectedCourse?.modules.flatMap((module, moduleIndex) => {
    const moduleAssignments = Array.isArray(module.assignments)
      ? module.assignments
      : module.assignment
        ? [module.assignment]
        : module.assignmentTitle
          ? [{ title: module.assignmentTitle, description: module.assignmentDescription, criteria: module.criteria }]
          : [];
    return moduleAssignments.map((assignment, assignmentIndex) => ({
      ...(typeof assignment === "string" ? { title: assignment } : assignment),
      id: String(assignment.id || `${selectedCourse.id}-${moduleIndex}-${assignmentIndex}`),
    }));
  }).find((assignment) => assignment.id === selectedSubmission?.assignmentId || assignment.title === selectedSubmission?.title);
  const assignmentBrief = selectedSubmission?.instructions || selectedSubmission?.objective || configuredAssignment?.instructions || configuredAssignment?.description;
  const reviewCriteria = criteria.length ? criteria : configuredAssignment?.criteria || configuredAssignment?.evaluationCriteria || [];
  const themeSheet = selectedSubmission?.themeSheetSnapshot;

  return (
    <div className="admin-assignment-review">
      <h1>Assignment review queue</h1>
      <p className="muted admin-description">Prioritize submitted work, review each submission and its history, then save structured feedback.</p>
      {submissionId ? (
        selectedSubmission ? (
          <section className="admin-assignment-detail admin-edit-card">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate("/admin/assignments")}>← Back to queue</button>
            <div className="admin-heading-row">
              <div><span className="eyebrow">{courses.find((course) => course.id === selectedSubmission.courseId)?.title || "Course unavailable"}</span><h2>{selectedSubmission.title || "Assignment submission"}</h2><p>{getStudentName(selectedSubmission.studentEmail)} · {selectedSubmission.studentEmail || "Email unavailable"}</p></div>
              <span className="status-pill">{selectedSubmission.status || "Submitted"}</span>
            </div>
            <section className="admin-assignment-brief"><h3>Assignment brief & evaluation criteria</h3><p>{assignmentBrief || "Assignment brief was not copied into this submission."}</p>
              {reviewCriteria.length ? <ul>{reviewCriteria.map((criterion, index) => <li key={`${index}-${typeof criterion === "string" ? criterion : criterion.title}`}>{typeof criterion === "string" ? criterion : criterion.title}{typeof criterion !== "string" && criterion.description ? ` — ${criterion.description}` : ""}</li>)}</ul> : <p className="muted">No evaluation criteria were recorded.</p>}
            </section>
            <section className="admin-assignment-brief"><h3>Student submission</h3><p>Submitted {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : "date unavailable"}</p>
              {selectedSubmission.url && /^https?:\/\//i.test(selectedSubmission.url) ? <a href={selectedSubmission.url} target="_blank" rel="noreferrer">Open submitted work ↗</a> : <p className="muted">No valid work link is attached.</p>}
              <p>{selectedSubmission.notes || "No student note attached."}</p>
            </section>
            {themeSheet && <section className="admin-assignment-brief"><h3>Attached Theme Sheet · {themeSheet.title || "Untitled"}</h3>
              {themeSheet.values && Object.entries(themeSheet.values).map(([element, value]) => value && <p key={element}><strong>{element}:</strong> {value}</p>)}
            </section>}
            {previousSubmissions.length > 0 && <section className="admin-assignment-brief"><h3>Previous submissions</h3><ul>{previousSubmissions.map((previous) => <li key={previous.id}><Link to={`/admin/assignments/${previous.id}`}>Revision {previous.revision || "—"} · {previous.status || "Status unavailable"} · {previous.submittedAt ? new Date(previous.submittedAt).toLocaleString() : "Date unavailable"}</Link>{previous.url && <a href={previous.url} target="_blank" rel="noreferrer"> · Open work ↗</a>}</li>)}</ul></section>}
            <section className="admin-assignment-brief"><h3>Instructor review</h3>
              <label className="admin-feedback-label">Instructor comments<textarea rows="5" value={drafts[selectedSubmission.id] ?? selectedSubmission.feedback ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [selectedSubmission.id]: event.target.value }))} placeholder="Share specific, constructive feedback…" /></label>
              {reviewCriteria.length > 0 && <div className="admin-criterion-feedback"><h4>Feedback by criterion</h4>{reviewCriteria.map((criterion, index) => {
                const title = typeof criterion === "string" ? criterion : criterion.title || `Criterion ${index + 1}`;
                const current = criterionDrafts[selectedSubmission.id] || selectedSubmission.criterionFeedback || {};
                return <label className="admin-feedback-label" key={`${index}-${title}`}>{title}<textarea rows="2" value={current[title] || ""} onChange={(event) => setCriterionDrafts((all) => ({ ...all, [selectedSubmission.id]: { ...(all[selectedSubmission.id] || selectedSubmission.criterionFeedback || {}), [title]: event.target.value } }))} placeholder="Optional notes for this criterion" /></label>;
              })}</div>}
              <label className="admin-feedback-label">Review status<select value={statuses[selectedSubmission.id] || selectedSubmission.status || "Submitted"} onChange={(event) => setStatuses((current) => ({ ...current, [selectedSubmission.id]: event.target.value }))}>{statusesToReview.map((status) => <option key={status}>{status}</option>)}</select></label>
              <div className="admin-actions-inline">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => saveFeedback(selectedSubmission, "Under Review")}>Save review</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => saveFeedback(selectedSubmission, "Revision Requested")}>Request revision</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => saveFeedback(selectedSubmission, "Completed")}>Mark completed</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => saveFeedback(selectedSubmission)}>Send feedback</button>
              </div>
              {savedNotice && <SavedNotice>{savedNotice}</SavedNotice>}
            </section>
            <section className="admin-assignment-brief"><h3>Review history</h3>{selectedSubmission.reviewHistory?.length ? <ul>{[...selectedSubmission.reviewHistory].reverse().map((entry, index) => <li key={`${entry.createdAt}-${index}`}>{entry.status} · {new Date(entry.createdAt).toLocaleString()}{entry.comment ? ` — ${entry.comment}` : ""}</li>)}</ul> : <p className="muted">No instructor review history.</p>}</section>
            <p className="admin-security-warning">This preview saves locally and may create a local notification; it cannot confirm a backend update. Production feedback and notifications must run only after the backend successfully saves the review.</p>
          </section>
        ) : <EmptyState title="Submission not found." description="This submission may have been removed or may still be a draft." actionLabel="Return to review queue" onAction={() => navigate("/admin/assignments")} icon="!" />
      ) : submissions.length ? (
        <>
          <div className="admin-assignment-filters">{statusesToReview.map((status) => {
            const count = submissions.filter((item) => item.status === status || (!item.status && status === "Submitted")).length;
            return <a key={status} href={`#assignment-status-${status.replaceAll(" ", "-")}`}><span>{status}</span><strong>{count}</strong></a>;
          })}</div>
          {statusesToReview.map((status) => {
            const records = submissions.filter((item) => item.status === status || (!item.status && status === "Submitted"));
            if (!records.length) return null;
            return <section className="admin-assignment-status-group" id={`assignment-status-${status.replaceAll(" ", "-")}`} key={status}>
              <h2>{status}<span>{records.length}</span></h2>
              <div className="admin-review-list">{records.map((item) => <article className="admin-review-card" key={item.id}>
                <div className="admin-heading-row"><div><span className="eyebrow">{courses.find((course) => course.id === item.courseId)?.title || "Course unavailable"}</span><h3>{item.title || "Assignment submission"}</h3><p>{getStudentName(item.studentEmail)} · {item.studentEmail || "Email unavailable"}</p></div><span className="status-pill">{status}</span></div>
                <p>{item.submittedAt ? `Submitted ${new Date(item.submittedAt).toLocaleString()}` : "Submission date unavailable"}</p>
                <Link className="btn btn-primary btn-sm" to={`/admin/assignments/${item.id}`}>Review submission</Link>
              </article>)}</div>
            </section>;
          })}
        </>
      ) : <EmptyState title="No submissions to review." description="Submitted assignments will appear in the queue when students send their work." icon="OT" />}
      <p className="admin-disclaimer">Submission records, statuses, and local notifications are browser-preview data. Instructor review does not sync to a backend.</p>
    </div>
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
  const [plans, setPlans] = useState(getAdminPlans);
  const [saved, setSaved] = useState(false);

  function updateBundle(id, patch) {
    setPlans((current) => ({
      ...current,
      bundles: current.bundles.map((bundle) => bundle.id === id ? { ...bundle, ...patch } : bundle),
    }));
    setSaved(false);
  }

  function addBundle() {
    setPlans((current) => ({
      ...current,
      bundles: [...current.bundles, {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        includedCourses: [],
        price: "",
        currency: "USD",
        accessDuration: "",
        publicationStatus: "Draft",
        availabilityStatus: "Available",
      }],
    }));
    setSaved(false);
  }

  function updatePlanField(field, value) {
    setPlans((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function save() {
    const bundles = plans.bundles.map((bundle) => ({
      ...bundle,
      price: bundle.price === "" ? "" : Number(bundle.price),
      includedCourses: [...new Set(bundle.includedCourses || [])],
    }));
    const firstAvailablePrice = bundles.find((bundle) => bundle.availabilityStatus === "Available")?.price;
    writeAdminData(adminStorageKeys.plans, {
      ...plans,
      bundles,
      bundlePrice: firstAvailablePrice === "" || firstAvailablePrice == null
        ? Number(plans.bundlePrice ?? 180)
        : Number(firstAvailablePrice),
      coursePrices: Object.fromEntries(Object.entries(plans.coursePrices || {}).map(([id, price]) => [id, Number(price)])),
    });
    logAdminAction({
      type: "plan_configuration_updated",
      summary: `Saved ${bundles.length} bundle plan(s) and subscription configuration.`,
    });
    setSaved(true);
  }

  return (
    <>
      <h1>Bundles & subscription plans</h1>
      <p className="muted admin-description">Manage one-time bundles separately from recurring membership. Publishing a plan does not connect checkout or process payments.</p>
      <section className="admin-plan-section">
        <div className="admin-heading-row"><div><h2>One-time bundles</h2><p className="muted">Each bundle has its own included courses, pricing, access terms, and publication state.</p></div><button className="btn btn-outline btn-sm" type="button" onClick={addBundle}>Add bundle</button></div>
        <div className="admin-edit-list">
          {plans.bundles.map((bundle) => (
            <fieldset className="admin-edit-card admin-plan-form admin-bundle-editor" key={bundle.id}>
              <legend>{bundle.title || "New bundle"}</legend>
              <label>Bundle name<input required value={bundle.title} onChange={(event) => updateBundle(bundle.id, { title: event.target.value })} /></label>
              <label>Description<textarea rows="2" value={bundle.description || ""} onChange={(event) => updateBundle(bundle.id, { description: event.target.value })} /></label>
              <div className="admin-fields-two">
                <label>Price<input type="number" min="0" step="0.01" value={bundle.price} onChange={(event) => updateBundle(bundle.id, { price: event.target.value })} /></label>
                <label>Currency<input maxLength="3" value={bundle.currency || "USD"} onChange={(event) => updateBundle(bundle.id, { currency: event.target.value.toUpperCase() })} /></label>
              </div>
              <span className="admin-field-label">Included courses</span>
              <div className="admin-course-checkboxes">
                {courses.map((course) => (
                  <label key={course.id}><input type="checkbox" checked={(bundle.includedCourses || []).includes(course.id)} onChange={(event) => updateBundle(bundle.id, {
                    includedCourses: event.target.checked
                      ? [...(bundle.includedCourses || []), course.id]
                      : (bundle.includedCourses || []).filter((id) => id !== course.id),
                  })} />{course.title}</label>
                ))}
              </div>
              <label>Access duration and rules<textarea rows="2" value={bundle.accessDuration || ""} onChange={(event) => updateBundle(bundle.id, { accessDuration: event.target.value })} placeholder="Describe access term, renewal, or limits" /></label>
              <div className="admin-fields-two">
                <label>Publication status<select value={bundle.publicationStatus || "Draft"} onChange={(event) => updateBundle(bundle.id, { publicationStatus: event.target.value })}><option>Draft</option><option>Published</option><option>Archived</option></select></label>
                <label>Availability<select value={bundle.availabilityStatus || "Available"} onChange={(event) => updateBundle(bundle.id, { availabilityStatus: event.target.value })}><option>Available</option><option>Paused</option><option>Sold out</option></select></label>
              </div>
              <button className="btn btn-danger btn-sm" type="button" onClick={() => {
                setPlans((current) => ({ ...current, bundles: current.bundles.filter((item) => item.id !== bundle.id) }));
                setSaved(false);
              }}>Remove bundle</button>
            </fieldset>
          ))}
          {!plans.bundles.length && <EmptyState title="No bundles configured." description="Add a bundle to define a one-time offer." actionLabel="Add bundle" onAction={addBundle} />}
        </div>
      </section>
      <section className="admin-edit-card admin-plan-form">
        <h2>Individual course prices</h2>
        {courses.map((course) => (
          <label key={course.id}>{course.title} price (USD)<input type="number" min="0" step="0.01" value={plans.coursePrices?.[course.id] ?? 0} onChange={(event) => {
            setPlans((current) => ({ ...current, coursePrices: { ...current.coursePrices, [course.id]: event.target.value } }));
            setSaved(false);
          }} /></label>
        ))}
      </section>
      <section className="admin-edit-card admin-plan-form">
        <h2>Subscription membership</h2>
        <p className="muted">A subscription is recurring and separate from any one-time bundle. Keep it unpublished until billing and access terms are reviewed.</p>
        <div className="admin-fields-two">
          <label>Publication status<select value={plans.membershipPublicationStatus || "Draft"} onChange={(event) => updatePlanField("membershipPublicationStatus", event.target.value)}><option>Draft</option><option>Published</option><option>Archived</option></select></label>
          <label>Availability<select value={plans.membershipStatus || "Coming soon"} onChange={(event) => updatePlanField("membershipStatus", event.target.value)}><option>Coming soon</option><option>Available</option><option>Paused</option></select></label>
        </div>
        <div className="admin-fields-two">
          <label>Recurring price<input type="number" min="0" step="0.01" value={plans.membershipPrice || ""} onChange={(event) => updatePlanField("membershipPrice", event.target.value)} /></label>
          <label>Currency<input maxLength="3" value={plans.membershipCurrency || "USD"} onChange={(event) => updatePlanField("membershipCurrency", event.target.value.toUpperCase())} /></label>
        </div>
        <label>Billing interval<input value={plans.membershipBillingCycle || ""} onChange={(event) => updatePlanField("membershipBillingCycle", event.target.value)} placeholder="For example, billed monthly" /></label>
        <label>Included access and rules<textarea rows="3" value={plans.membershipAccess || ""} onChange={(event) => updatePlanField("membershipAccess", event.target.value)} placeholder="Specify exactly what members can access" /></label>
        <label>Renewal and cancellation terms<textarea rows="3" value={plans.membershipRenewalTerms || ""} onChange={(event) => updatePlanField("membershipRenewalTerms", event.target.value)} placeholder="Explain renewals, cancellation timing, and access after cancellation" /></label>
      </section>
      <div className="admin-save-row"><button className="btn btn-primary" type="button" onClick={save}>Save plans</button>{saved && <SavedNotice>Plan settings saved in this browser preview.</SavedNotice>}</div>
      <p className="admin-disclaimer">Publication and availability are editorial controls only. Checkout, recurring billing, and payment verification are not connected in this preview.</p>
    </>
  );
}

export function ShowcaseModeration() {
  const [assignments, setAssignments] = useState(() => readAdminData(adminStorageKeys.assignments, []));
  const [projects, setProjects] = useState(() => readAdminData(adminStorageKeys.showcaseProjects, []));
  const [notes, setNotes] = useState({});
  const [filter, setFilter] = useState("All public requests");

  function moderate(item, action) {
    if (!item.showcaseConsent) return;
    const moderationNote = notes[item.id]?.trim() || (action === "Changes Requested"
      ? "Please update this project and resubmit it for review."
      : action === "Rejected"
        ? "This project was not approved for the public showcase."
        : "");
    const patch = {
      showcasePublished: action === "Published",
      moderationStatus: action,
      moderationNote,
      moderatedAt: new Date().toISOString(),
    };
    if (item.isShowcaseProject) {
      const updated = projects.map((record) => record.id === item.id ? { ...record, ...patch } : record);
      setProjects(updated);
      writeAdminData(adminStorageKeys.showcaseProjects, updated);
    } else {
      const updated = assignments.map((record) => record.id === item.id ? { ...record, ...patch } : record);
      setAssignments(updated);
      writeAdminData(adminStorageKeys.assignments, updated);
    }
    logAdminAction({
      type: "showcase_moderation",
      targetEmail: item.studentEmail || "",
      targetName: item.studentEmail || "",
      summary: `${item.title}: ${action}`,
    });
    if (item.studentEmail) {
      addStudentNotification(item.studentEmail, {
        title: action === "Published" ? "Showcase project approved" : action === "Changes Requested" ? "Showcase changes requested" : action === "Removed" ? "Showcase project removed" : "Showcase project not approved",
        message: moderationNote || `Your project “${item.title}” is now ${action.toLowerCase()}.`,
        type: "showcase_moderation",
        href: "/app/showcase",
      });
    }
    setNotes((current) => ({ ...current, [item.id]: "" }));
  }

  const submissions = assignments.map((item) => ({ ...item, isShowcaseProject: false }));
  const studentProjects = projects.map((item) => ({
    ...item,
    url: item.mediaUrl || item.url,
    notes: item.description || "",
    isShowcaseProject: true,
  }));
  const reviewItems = [...submissions, ...studentProjects]
    .filter((item) => item.showcaseConsent || item.showcasePublished)
    .map((item) => ({
      ...item,
      moderationStatus: item.moderationStatus || (item.showcasePublished ? "Published" : "Pending review"),
    }));
  const visibleItems = filter === "All public requests"
    ? reviewItems
    : reviewItems.filter((item) => item.moderationStatus === filter);
  const statusCounts = ["Pending review", "Changes Requested", "Published", "Rejected", "Removed"]
    .map((status) => ({ status, count: reviewItems.filter((item) => item.moderationStatus === status).length }));

  return (
    <>
      <h1>Showcase moderation</h1>
      <p className="muted admin-description">Review projects only when the creator has explicitly requested public display. Consent is required before publication.</p>
      <div className="admin-moderation-summary">
        {statusCounts.map(({ status, count }) => <button type="button" className={filter === status ? "active" : ""} key={status} onClick={() => setFilter(filter === status ? "All public requests" : status)}><span>{status}</span><strong>{count}</strong></button>)}
      </div>
      <label className="admin-filter-label">Filter projects<select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All public requests</option>{statusCounts.map(({ status }) => <option key={status}>{status}</option>)}</select></label>
      {visibleItems.length ? (
        <div className="admin-review-list">
          {visibleItems.map((item) => (
            <article className="admin-review-card" key={item.id}>
              <div className="admin-heading-row">
                <div><span className="eyebrow">{courses.find((c) => c.id === item.courseId)?.title || item.courseId || "Own Theme project"}</span><h2>{item.title || "Untitled project"}</h2><p>{item.studentEmail || "Creator unavailable"}{item.assignmentId ? ` · Assignment ${item.assignmentId}` : ""}</p>{/^https?:\/\//i.test(item.url || "") && <a href={item.url} target="_blank" rel="noreferrer">Open project ↗</a>}</div>
                <span className="status-pill">{item.moderationStatus}</span>
              </div>
              <p>{item.notes || "No student note provided."}</p>
              <p className="admin-consent granted">Creator requested public display · consent recorded.</p>
              <label className="admin-feedback-label">Moderation note<textarea rows="2" value={notes[item.id] ?? item.moderationNote ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Optional feedback for the creator" /></label>
              <div className="admin-actions-inline">
                <button className="btn btn-primary btn-sm" disabled={!/^https?:\/\//i.test(item.url || "")} onClick={() => moderate(item, "Published")}>Approve & publish</button>
                <button className="btn btn-outline btn-sm" onClick={() => moderate(item, "Changes Requested")}>Request changes</button>
                <button className="btn btn-outline btn-sm" onClick={() => moderate(item, "Rejected")}>Reject</button>
                {item.showcasePublished && <button className="btn btn-danger btn-sm" onClick={() => moderate(item, "Removed")}>Remove published project</button>}
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyState title={filter === "All public requests" ? "No public projects to review." : `No ${filter.toLowerCase()} projects.`} description="Projects appear here only after a student requests public display and records consent." icon="OT" />}
      <p className="admin-disclaimer">Moderation decisions and notifications are saved in this browser preview. A production workflow must persist them on the server and verify administrator permissions.</p>
    </>
  );
}

export function SiteSettings() {
  const initial = readAdminData(adminStorageKeys.settings, {
    homeHeadline: "Don't Just Edit Videos. Create Your Style.",
    homeDescription: "Learn video editing, master visual storytelling, and turn your ideas into videos that stand out.",
    supportEmail: "",
    supportPhone: "",
    brandLogoUrl: "",
    socialLinks: { instagram: "", youtube: "" },
    categories: ["Short-Form & Social Media", "Long-Form & YouTube", "Film & Documentary"],
    featuredCourseIds: ["short-form", "long-form", "film-doc"],
    legalContent: { terms: "", privacy: "", refund: "" },
    emailNotifications: { feedback: true, assignments: true, courses: true, billing: true },
  });
  const [settings, setSettings] = useState({
    supportPhone: "",
    brandLogoUrl: "",
    socialLinks: { instagram: "", youtube: "" },
    categories: ["Short-Form & Social Media", "Long-Form & YouTube", "Film & Documentary"],
    featuredCourseIds: ["short-form", "long-form", "film-doc"],
    legalContent: { terms: "", privacy: "", refund: "" },
    emailNotifications: { feedback: true, assignments: true, courses: true, billing: true },
    ...initial,
  });
  const [saved, setSaved] = useState(false);

  function updateSettings(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function save() {
    writeAdminData(adminStorageKeys.settings, {
      ...settings,
      categories: [...new Set(settings.categories.map((category) => category.trim()).filter(Boolean))],
    });
    logAdminAction({
      type: "site_settings_updated",
      summary: "Updated site content and settings.",
    });
    setSaved(true);
    window.dispatchEvent(new Event("ownTheme:site-settings-updated"));
  }

  return (
    <>
      <h1>Site content & settings</h1>
      <p className="muted admin-description">Configure public content, brand links, support contact, and notification preferences. These settings are browser-local in this preview.</p>
      <section className="admin-edit-card admin-plan-form">
        <h2>Homepage copy & featured courses</h2>
        <label>Homepage headline<input value={settings.homeHeadline} onChange={(event) => updateSettings("homeHeadline", event.target.value)} /></label>
        <label>Homepage description<textarea rows="3" value={settings.homeDescription} onChange={(event) => updateSettings("homeDescription", event.target.value)} /></label>
        <fieldset className="admin-course-checkboxes"><legend>Featured course order</legend>{courses.map((course) => <label key={course.id}><input type="checkbox" checked={(settings.featuredCourseIds || []).includes(course.id)} onChange={(event) => updateSettings("featuredCourseIds", event.target.checked ? [...(settings.featuredCourseIds || []), course.id] : (settings.featuredCourseIds || []).filter((id) => id !== course.id))} />{course.title}</label>)}</fieldset>
        <h2>Course categories</h2>
        <label>One category per line<textarea rows="4" value={(settings.categories || []).join("\n")} onChange={(event) => updateSettings("categories", event.target.value.split("\n"))} /></label>
        <p className="muted">Use the same labels as the categories assigned to courses.</p>
        <h2>Brand assets & social links</h2>
        <label>Logo image URL<input type="url" value={settings.brandLogoUrl || ""} onChange={(event) => updateSettings("brandLogoUrl", event.target.value)} placeholder="https://…" /></label>
        <div className="admin-fields-two">
          <label>Instagram URL<input type="url" value={settings.socialLinks?.instagram || ""} onChange={(event) => updateSettings("socialLinks", { ...settings.socialLinks, instagram: event.target.value })} /></label>
          <label>YouTube URL<input type="url" value={settings.socialLinks?.youtube || ""} onChange={(event) => updateSettings("socialLinks", { ...settings.socialLinks, youtube: event.target.value })} /></label>
        </div>
        <h2>Support contact details</h2>
        <label>Support email<input type="email" value={settings.supportEmail || ""} onChange={(event) => updateSettings("supportEmail", event.target.value)} placeholder="Not published until configured" /></label>
        <label>Support phone<input type="tel" value={settings.supportPhone || ""} onChange={(event) => updateSettings("supportPhone", event.target.value)} /></label>
        <h2>Legal page content</h2>
        <label>Terms of service<textarea rows="5" value={settings.legalContent?.terms || ""} onChange={(event) => updateSettings("legalContent", { ...settings.legalContent, terms: event.target.value })} placeholder="Reviewed terms of service" /></label>
        <label>Privacy policy<textarea rows="5" value={settings.legalContent?.privacy || ""} onChange={(event) => updateSettings("legalContent", { ...settings.legalContent, privacy: event.target.value })} placeholder="Reviewed privacy policy" /></label>
        <label>Refund & cancellation policy<textarea rows="5" value={settings.legalContent?.refund || ""} onChange={(event) => updateSettings("legalContent", { ...settings.legalContent, refund: event.target.value })} placeholder="Reviewed refund and cancellation terms" /></label>
        <h2>Email notification settings</h2>
        <fieldset className="admin-course-checkboxes">{Object.entries({ feedback: "Instructor feedback", assignments: "Assignment updates", courses: "Course announcements", billing: "Orders and billing" }).map(([key, label]) => <label key={key}><input type="checkbox" checked={settings.emailNotifications?.[key] !== false} onChange={(event) => updateSettings("emailNotifications", { ...settings.emailNotifications, [key]: event.target.checked })} />{label}</label>)}</fieldset>
        <p className="muted">These are configuration preferences only. No email delivery service is connected.</p>
        <h2>Integration status</h2>
        <div className="admin-integration-status"><p><strong>Hosted video:</strong> Not connected in this preview</p><p><strong>Payment provider:</strong> Not connected in this preview</p><p>Do not enter provider secrets here. Integrations require server-side credentials and verified callbacks.</p></div>
        <button className="btn btn-primary" type="button" onClick={save}>Save site settings</button>
        {saved && <SavedNotice>Site settings saved in this browser.</SavedNotice>}
      </section>
      <p className="admin-disclaimer">This admin preview does not authenticate or authorize users. Production access to settings and every protected action must be enforced by the backend.</p>
    </>
  );
}
