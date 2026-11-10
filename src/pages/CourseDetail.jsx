import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { courses, isPublicCourse, student } from "../data/courses";
import { details, faq } from "../data/details";
import { prices } from "../data/admin";

export default function CourseDetail() {
  const [previewError, setPreviewError] = useState(false);
  const { courseId } = useParams();
  const course = courses.find((item) => item.id === courseId || (item.slug || item.id) === courseId);
  const info = course ? details[course.id] : null;

  if (!course || !isPublicCourse(course)) return <Navigate to="/courses" replace />;

  const owned = student.enrolled.some((enrollment) => enrollment.courseId === course.id);
  const modules = course.modules.map((module) => {
    const moduleInfo = info?.modules?.find((item) => item.title === module.title);
    return {
      ...moduleInfo,
      ...module,
      outcome: module.outcome || moduleInfo?.outcome || "",
    };
  });
  const allLessons = course.modules.flatMap((module) => module.lessons);
  const exampleLesson = allLessons.find((lesson) => lesson.preview === true) || allLessons[0];
  const lessonCount = course.modules.reduce((total, module) => total + module.lessons.length, 0);
  const price = course.price !== "" && course.price != null ? course.price : prices[course.id];
  const subscriptionOnly = course.purchaseOption === "Subscription included";
  const outcomes = [
    ...(course.outcomes || []),
    ...modules.map((module) => module.outcome).filter(Boolean),
  ];
  const enrollmentAction = owned ? (
    <Link to={`/app/courses/${course.id}`} className="btn btn-primary">Go to my course</Link>
  ) : subscriptionOnly ? (
    <Link to="/plans" className="btn btn-primary">View membership options</Link>
  ) : price != null && price !== "" ? (
    <Link to={`/checkout/${course.id}`} className="btn btn-primary">Enroll in this course</Link>
  ) : (
    <button type="button" className="btn btn-primary" disabled>Enrollment unavailable</button>
  );

  return (
    <main className="container course-detail-page">
      <section className={`course-detail-hero course-detail-${course.id}`} style={course.heroImage ? { backgroundImage: `linear-gradient(90deg,rgba(8,12,11,.96),rgba(8,12,11,.7)),url("${course.heroImage}")` } : undefined}>
        <div className="course-detail-hero-copy">
          <Link to="/courses" className="course-back-link">← All courses</Link>
          <span className="tag">{course.tag}</span>
          <h1>{course.title}</h1>
          <p className="lead">{course.fullDescription || course.description || info?.promise || "Course details will be added soon."}</p>
          <div className="pills">
            {course.level && <span className="pill">{course.level}</span>}
            {lessonCount > 0 && <span className="pill">{lessonCount} lessons</span>}
            {course.estimatedDuration && <span className="pill">{course.estimatedDuration}</span>}
            {course.accessTerms && <span className="pill">{course.accessTerms}</span>}
          </div>
          {enrollmentAction}
        </div>
        <div className="course-trailer" aria-label={`${course.title} trailer preview`}>
          <div className="course-trailer-art"><span>OWN THE FRAME / {course.tag}</span><i /></div>
          <div className="course-trailer-message">
            <span className="course-trailer-mark">▶</span>
            <div><strong>Course trailer</strong><span>Preview video coming soon</span></div>
          </div>
        </div>
      </section>

      <section className="course-detail-content">
        <div className="course-detail-main">
          <section className="detail-section" id="summary">
            <span className="eyebrow">01 / COURSE SUMMARY</span>
            <h2>Who this course is for</h2>
            {info?.forWho?.length ? (
              <ul className="check-list">
                {info.forWho.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : <p className="muted">Audience and experience level have not been specified yet.</p>}
            {course.level && <p className="course-level-note">Skill level: {course.level}.</p>}
          </section>

          <section className="detail-section" id="learning-outcomes">
            <span className="eyebrow">02 / WHAT YOU'LL LEARN</span>
            <h2>Skills and learning outcomes</h2>
            {outcomes.length ? <ul className="check-list">{outcomes.map((outcome, index) => <li key={`${index}-${outcome}`}>{outcome}</li>)}</ul> : <p className="muted">Learning outcomes have not been specified yet.</p>}
          </section>

          <section className="detail-section" id="curriculum">
            <span className="eyebrow">03 / CURRICULUM</span>
            <h2>Course modules</h2>
            {modules.map((module, index) => {
              return (
                <details className="acc course-module-accordion" key={`${module.title}-${index}`} open={index === 0}>
                  <summary>{module.title}</summary>
                  {module.outcome && <p className="module-outcome">{module.outcome}</p>}
                  {module.lessons?.length ? (
                    <ul className="course-module-lessons">
                      {module.lessons.map((lesson) => (
                        <li key={lesson.id}><span>{lesson.title}{lesson.preview === true && <small className="course-preview-label"> · Preview</small>}</span>{lesson.duration && <small>{lesson.duration}</small>}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="module-preview-note">Detailed lesson list will be added as this module is prepared.</p>
                  )}
                </details>
              );
            })}
          </section>

          <section className="detail-section" id="lesson-preview">
            <span className="eyebrow">04 / EXAMPLE LESSON</span>
            <h2>A first look inside</h2>
            {exampleLesson ? (
              <article className="example-lesson-card">
                {exampleLesson.preview === true && /^https?:\/\//i.test(exampleLesson.videoUrl || "") && !previewError ? (
                  <video className="course-public-preview" controls preload="metadata" src={exampleLesson.videoUrl} onError={() => setPreviewError(true)}>
                    Your browser does not support video playback.
                  </video>
                ) : <span className="example-lesson-play" aria-hidden="true">▶</span>}
                <div><strong>{exampleLesson.title}</strong><span>{exampleLesson.preview === true && exampleLesson.videoUrl ? previewError ? "Preview video is unavailable. Please try again later." : "Public lesson preview" : "Preview video coming soon"}{exampleLesson.duration ? ` · ${exampleLesson.duration}` : ""}</span></div>
              </article>
            ) : <p className="muted">A sample lesson will be added when a preview is available.</p>}
          </section>

          <section className="detail-section" id="assignments-resources">
            <span className="eyebrow">05 / PROJECTS & RESOURCES</span>
            <h2>Practice what you learn</h2>
            <div className="course-resource-grid">
              <article className="course-resource-card">
                <span className="resource-index">PROJECT</span>
                <h3>Course capstone</h3>
                <p>{info?.capstone || "Course project details have not been specified yet."}</p>
              </article>
              <article className="course-resource-card">
                <span className="resource-index">WORKSHEET</span>
                <h3>Your Theme Sheet</h3>
                <p>Keep a Theme Sheet as a working style guide for your own creative choices.</p>
              </article>
            </div>
            {course.resources?.length > 0 && (
              <ul className="course-resource-list">
                {course.resources.map((resource, index) => (
                  <li key={`${index}-${resource}`}>
                    {/^https?:\/\//i.test(resource)
                      ? <a href={resource} target="_blank" rel="noreferrer">{resource}</a>
                      : resource}
                  </li>
                ))}
              </ul>
            )}
            <p className="course-resource-note">Assignment review terms and additional access conditions have not been listed yet.</p>
          </section>

          <section className="detail-section" id="instructor">
            <span className="eyebrow">06 / INSTRUCTOR</span>
            <h2>Meet your instructor</h2>
            <div className="instructor-placeholder">
              <span className="instructor-placeholder-mark" aria-hidden="true">OT</span>
              <p>{course.instructor || "Instructor information has not been provided yet."}</p>
            </div>
          </section>

          <section className="detail-section" id="course-faq">
            <span className="eyebrow">07 / FAQ</span>
            <h2>Course questions</h2>
            {faq.map((item) => (
              <details className="acc" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </section>
        </div>

        <aside className="course-enrollment-card">
          <span className="eyebrow">INDIVIDUAL COURSE</span>
          <h2>{subscriptionOnly ? "Included with membership" : "Individual course"}</h2>
          {subscriptionOnly
            ? <p>Available through a separate subscription offer. Review membership access and renewal terms before enrolling.</p>
            : <p className="course-enrollment-price">{price != null && price !== "" ? `$${price}` : "Price not set"}<small>{price != null && price !== "" ? " USD · one time" : ""}</small></p>}
          <p>{course.accessTerms || "Access duration and terms have not been specified."}</p>
          {enrollmentAction}
          <p className="course-enrollment-note">{subscriptionOnly ? "Subscription billing and access are separate from one-time course purchases. Membership checkout is not connected in this preview." : "This is an individual course option, separate from a bundle or subscription. Checkout is a demo and does not process a real payment."}</p>
          <div className="course-enrollment-divider" />
          <p>Want all three courses?</p>
          <Link to="/plans" className="text-link">Compare bundles & membership <span aria-hidden="true">↗</span></Link>
        </aside>
      </section>

      <section className="final-cta course-final-cta">
        <h2>Ready to make your next edit your own?</h2>
        {enrollmentAction}
      </section>
    </main>
  );
}
