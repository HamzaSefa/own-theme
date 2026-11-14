import { useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { courses, getCurrentEnrollments, getAllLessons, getProgress, saveProgress } from "../data/courses";
import { getCurrentUser, readStudentData } from "../data/studentPortal";

const VIDEO_PROGRESS_KEY = "ownTheme_video_progress";

function findLesson(courseId, lessonId) {
  const matchingCourse = courses.find((item) => (!courseId || item.id === courseId)
    && getAllLessons(item).some((lesson) => lesson.id === lessonId));
  if (!matchingCourse) return null;

  const lessons = getAllLessons(matchingCourse);
  return {
    course: matchingCourse,
    lessons,
    index: lessons.findIndex((lesson) => lesson.id === lessonId),
    lesson: lessons.find((lesson) => lesson.id === lessonId),
  };
}

function getLessonModule(course, lessonId) {
  return course.modules.find((module) => module.lessons?.some((lesson) => lesson.id === lessonId));
}

function readVideoPositions() {
  const email = getCurrentUser()?.email?.trim().toLowerCase() || "anonymous";
  return readStudentData(`${VIDEO_PROGRESS_KEY}:${encodeURIComponent(email)}`, {});
}

export default function Classroom() {
  const { courseId: routeCourseId, lessonId } = useParams();
  const resolved = findLesson(routeCourseId, lessonId);
  const course = resolved?.course;
  const lesson = resolved?.lesson;
  const enrollment = course && getCurrentEnrollments().find((item) => item.courseId === course.id);

  if (!course || !enrollment || !lesson || !resolved) return <Navigate to="/app" replace />;
  if (lesson.locked === true) return <Navigate to={`/app/courses/${course.id}`} replace />;

  return <LessonPlayer key={`${course.id}-${lesson.id}`} resolved={resolved} enrollment={enrollment} />;
}

function LessonPlayer({ resolved, enrollment }) {
  const { course, lesson, lessons } = resolved;
  const videoRef = useRef(null);
  const lastSavedPosition = useRef(0);
  const [completed, setCompleted] = useState(() => (enrollment.completed || []).filter((id) =>
    lessons.some((item) => item.id === id)
  ));
  const [savedPosition, setSavedPosition] = useState(() => readVideoPositions()[lesson.id] || 0);
  const [mediaError, setMediaError] = useState("");
  const [resumeNotice, setResumeNotice] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);

  const availableLessons = lessons.filter((item) => item.locked !== true);
  const availableIndex = availableLessons.findIndex((item) => item.id === lesson.id);
  const previous = availableLessons[availableIndex - 1];
  const next = availableLessons[availableIndex + 1];
  const isComplete = completed.includes(lesson.id);
  const progress = getProgress(course, completed);
  const module = getLessonModule(course, lesson.id);
  const moduleIndex = course.modules.findIndex((item) => item === module);
  const moduleLessonIndex = (module?.lessons || []).findIndex((item) => item.id === lesson.id);
  const hasNotes = Boolean(lesson.notes || lesson.description || lesson.content);
  const notes = lesson.notes || lesson.description || lesson.content;

  function persistVideoPosition(video, force = false) {
    if (!video || !Number.isFinite(video.currentTime) || video.currentTime < 0) return;
    const position = Math.floor(video.currentTime);
    if (!force && Math.abs(position - lastSavedPosition.current) < 5 && !video.ended) return;
    const positions = readVideoPositions();
    positions[lesson.id] = position;
    const email = getCurrentUser()?.email?.trim().toLowerCase() || "anonymous";
    localStorage.setItem(`${VIDEO_PROGRESS_KEY}:${encodeURIComponent(email)}`, JSON.stringify(positions));
    lastSavedPosition.current = position;
    setSavedPosition(position);
  }

  function resumePlayback() {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || savedPosition < 3 || savedPosition >= video.duration - 3) return;
    video.currentTime = savedPosition;
    setResumeNotice(`Resuming from ${Math.floor(savedPosition / 60)}:${String(Math.floor(savedPosition % 60)).padStart(2, "0")}.`);
  }

  function changePlaybackRate(event) {
    const rate = Number(event.target.value);
    if (!Number.isFinite(rate) || !videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }

  function handleVideoError() {
    const videoError = videoRef.current?.error;
    const message = videoError?.code === 2
      ? "The video connection was interrupted. Check your connection and try loading the lesson again."
      : videoError?.code === 3 || videoError?.code === 4
        ? "This video is unavailable or uses a format this browser cannot play. Please contact support or try again later."
        : "The lesson video could not be loaded. Check your connection and try again.";
    setMediaError(message);
  }

  function toggleComplete() {
    const updated = isComplete
      ? completed.filter((id) => id !== lesson.id)
      : [...completed, lesson.id];
    setCompleted(updated);
    saveProgress(course.id, updated);
  }

  return (
    <div className="lesson-player-page">
      <header className="lesson-player-topbar">
        <Link to={`/app/courses/${course.id}`} className="lesson-player-back">← Course overview</Link>
        <span className="lesson-player-course-title">{course.title}</span>
        <span className="lesson-player-top-progress">
          <span className="lesson-player-progress-track" role="progressbar" aria-label="Course progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </span>
          <span>{progress}% complete</span>
        </span>
      </header>

      <div className="lesson-player-layout">
        <main className="lesson-player-main">
          <div className="lesson-player-location">
            <span>MODULE {String(moduleIndex + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">/</span>
            <span>LESSON {String(moduleLessonIndex + 1).padStart(2, "0")}</span>
          </div>
          <h1 className="lesson-player-title">{lesson.title}</h1>

          <section className="lesson-media-frame" aria-label="Lesson video">
            {lesson.videoUrl ? (
              <>
                <video
                  data-swarm-media="lesson-video"
                  data-swarm-trigger="viewport"
                  className="lesson-video"
                  controls
                  preload="metadata"
                  src={lesson.videoUrl}
                  ref={videoRef}
                  onLoadedMetadata={resumePlayback}
                  onTimeUpdate={(event) => persistVideoPosition(event.currentTarget)}
                  onPause={(event) => persistVideoPosition(event.currentTarget, true)}
                  onEnded={(event) => persistVideoPosition(event.currentTarget, true)}
                  onError={handleVideoError}
                  onStalled={() => setMediaError("Video playback has stalled. Check your connection; playback will continue if the stream recovers.")}
                  onCanPlay={() => setMediaError("")}
                >
                  {lesson.captionUrl && (
                    <track kind="captions" src={lesson.captionUrl} srcLang={lesson.captionLanguage || "en"} label={lesson.captionLabel || "Captions"} default />
                  )}
                  Your browser does not support video playback.
                </video>
                {mediaError && (
                  <div className="lesson-media-error" role="alert">
                    <strong>Video unavailable</strong>
                    <p>{mediaError}</p>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => { setMediaError(""); videoRef.current?.load(); }}>
                      Try again
                    </button>
                  </div>
                )}
                {resumeNotice && <p className="lesson-resume-notice" role="status">{resumeNotice}</p>}
                <label className="lesson-playback-speed">
                  Speed
                  <select aria-label="Playback speed" value={playbackRate} onChange={changePlaybackRate}>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <option value={rate} key={rate}>{rate}×</option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <div className="lesson-video-unavailable" role="status">
                <span className="lesson-video-play" aria-hidden="true">▶</span>
                <strong>Hosted lesson video</strong>
                <p>A video has not been added to this lesson yet.</p>
                <small>Playback, captions, and speed controls are available when supported by the hosted video.</small>
              </div>
            )}
          </section>

          <div className="lesson-player-actions">
            {previous ? (
              <Link to={`/app/learn/${previous.id}`} className="btn btn-outline">← Previous</Link>
            ) : <span />}
            <button type="button" className={isComplete ? "btn btn-done" : "btn btn-primary"} onClick={toggleComplete}>
              {isComplete ? "✓ Lesson completed" : "Complete lesson"}
            </button>
            {next ? (
              <Link to={`/app/learn/${next.id}`} className="btn btn-outline">Next lesson →</Link>
            ) : <span />}
          </div>
          <p className="lesson-save-notice">Lesson completion and playback position are saved in this browser preview. Backend sync is not connected.</p>

          <div className="lesson-learning-content">
            <section className="lesson-content-section">
              <span className="eyebrow">LESSON CONTENT</span>
              <h2>Lesson notes</h2>
              {hasNotes ? (
                <div className="lesson-notes-copy">{notes}</div>
              ) : (
                <p>Written notes, examples, and key concepts for this lesson have not been added yet.</p>
              )}
            </section>

            <section className="lesson-content-section">
              <span className="eyebrow">PROJECT FILES & RESOURCES</span>
              <h2>Lesson resources</h2>
              {lesson.resourceUrl ? (
                <a className="lesson-resource-link" href={lesson.resourceUrl} target="_blank" rel="noreferrer">
                  <span><strong>{lesson.resourceTitle || "Project file or lesson resource"}</strong><small>Opens in a new tab</small></span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <p>No project files or resources have been attached to this lesson yet.</p>
              )}
            </section>

          </div>
        </main>

        <aside className="lesson-curriculum-sidebar">
          <div className="lesson-sidebar-progress">
            <div className="lesson-sidebar-progress-heading"><span>COURSE PROGRESS</span><strong>{progress}%</strong></div>
            <div className="student-progress-track" role="progressbar" aria-label="Course progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="lesson-sidebar-heading">
            <span>COURSE CURRICULUM</span>
            <Link to={`/app/courses/${course.id}`} aria-label="Open course overview">↗</Link>
          </div>
          <div className="lesson-sidebar-modules">
            {course.modules.map((courseModule, index) => (
              <details className="lesson-sidebar-module" key={`${courseModule.title}-${index}`} open={courseModule === module}>
                <summary>
                  <span><small>MODULE {String(index + 1).padStart(2, "0")}</small><strong>{courseModule.title.replace(/^Module \d+:\s*/, "")}</strong></span>
                  <span className="lesson-sidebar-chevron" aria-hidden="true">⌄</span>
                </summary>
                <nav aria-label={courseModule.title}>
                  {(courseModule.lessons || []).map((item) => {
                    const itemDone = completed.includes(item.id);
                    const itemLocked = item.locked === true;
                    return itemLocked ? (
                      <span className="lesson-sidebar-link locked" key={item.id}>
                        <i aria-hidden="true">•</i><span>{item.title}</span>
                      </span>
                    ) : (
                      <Link
                        to={`/app/learn/${item.id}`}
                        className={item.id === lesson.id ? "lesson-sidebar-link active" : `lesson-sidebar-link${itemDone ? " done" : ""}`}
                        key={item.id}
                      >
                        <i aria-hidden="true">{itemDone ? "✓" : item.id === lesson.id ? "▶" : "○"}</i>
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </details>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
