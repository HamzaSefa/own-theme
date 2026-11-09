import { useState } from "react";
import { courses as initialCourses } from "../../data/courses";

export default function Content() {
  const [data, setData] = useState(initialCourses);
  const [courseId, setCourseId] = useState(initialCourses[0].id);

  // Editing trick: copy everything, change the copy, save the copy.
  // React needs a fresh copy to notice that something changed.
  function update(change) {
    const copy = structuredClone(data);
    const course = copy.find((c) => c.id === courseId);
    change(course);
    setData(copy);
  }

  const course = data.find((c) => c.id === courseId);

  function addModule() {
    update((c) => c.modules.push({ title: `Module ${c.modules.length}: New module`, lessons: [] }));
  }
  function renameModule(mi, title) {
    update((c) => { c.modules[mi].title = title; });
  }
  function addLesson(mi) {
    update((c) => c.modules[mi].lessons.push({ id: "new-" + Date.now(), title: "New lesson", duration: "10 min" }));
  }
  function renameLesson(mi, li, title) {
    update((c) => { c.modules[mi].lessons[li].title = title; });
  }
  function deleteLesson(mi, li) {
    update((c) => c.modules[mi].lessons.splice(li, 1));
  }
  function deleteModule(mi) {
    if (confirm("Delete this whole module?")) update((c) => c.modules.splice(mi, 1));
  }

  return (
    <>
      <h1>Course content</h1>

      <select className="select" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
        {data.map((c) => (
          <option key={c.id} value={c.id}>{c.title}</option>
        ))}
      </select>

      {course.modules.map((m, mi) => (
        <div className="cms-module" key={mi}>
          <div className="cms-row">
            <input className="cms-module-name" value={m.title} onChange={(e) => renameModule(mi, e.target.value)} />
            <button className="btn btn-danger btn-sm" onClick={() => deleteModule(mi)}>Delete</button>
          </div>

          {m.lessons.map((l, li) => (
            <div className="cms-row" key={l.id}>
              <input value={l.title} onChange={(e) => renameLesson(mi, li, e.target.value)} />
              <button className="btn btn-outline btn-sm" onClick={() => deleteLesson(mi, li)}>✕</button>
            </div>
          ))}

          <button className="btn btn-outline btn-sm" onClick={() => addLesson(mi)}>+ Add lesson</button>
        </div>
      ))}

      <button className="btn btn-primary" onClick={addModule}>+ Add module</button>
      <p className="muted" style={{ marginTop: 16, fontSize: 14 }}>
        Changes live only in this browser for now. In Phase 2 they save to the database.
      </p>
    </>
  );
}