import { useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { adminStorageKeys, readAdminData } from "../data/adminWorkspace";
import { courses, isPublicCourse } from "../data/courses";
import { details } from "../data/details";

const themeStack = [
  { n: "01", name: "STORY", q: "Understand your idea and decide what you want your audience to feel." },
  { n: "02", name: "TIMING", q: "Learn when to cut, how to build rhythm, and how to keep viewers engaged." },
  { n: "03", name: "COLOR", q: "Use color and contrast to create the right mood." },
  { n: "04", name: "SOUND", q: "Combine music, sound effects, and silence to make every moment count." },
  { n: "05", name: "TEXT & EFFECTS", q: "Add titles, graphics, and motion that bring your video to life." },
  { n: "06", name: "YOUR SIGNATURE", q: "Develop a recognizable editing style that makes your work stand out." },
];

export default function Home() {
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const siteSettings = readAdminData(adminStorageKeys.settings, {});
  const previewCourse = courses.find((course) => course.id === "short-form" && isPublicCourse(course));
  const previewLessons = previewCourse?.modules.flatMap((module) => module.lessons).slice(0, 3) || [];
  const selectedLesson = previewLessons.find((lesson) => lesson.id === selectedLessonId) || previewLessons[0];
  const courseInfo = previewCourse ? details[previewCourse.id] : null;
  const headline = siteSettings.homeHeadline || "Edit And Create Your Own Style.";
  const highlightedPhrase = "Create Your Own Style.";
  const highlightIndex = headline.indexOf(highlightedPhrase);
  const styleIndex = highlightIndex + highlightedPhrase.indexOf("Style");

  return (
    <>
      <div className="hero-wrap">
        <div className="container">
          <section className="hero">
            <div className="hero-copy">
              <span className="badge"><span className="badge-dot" />VIDEO EDITING COURSES</span>
              <h1>{highlightIndex >= 0
                ? <>{headline.slice(0, highlightIndex)}<span>{headline.slice(highlightIndex, styleIndex)}<em className="hero-style-word">{headline.slice(styleIndex, styleIndex + "Style".length)}</em>{headline.slice(styleIndex + "Style".length, highlightIndex + highlightedPhrase.length)}</span>{headline.slice(highlightIndex + highlightedPhrase.length)}</>
                : headline}</h1>
              <p>{siteSettings.homeDescription || "Learn video editing, master visual storytelling, and turn your ideas into videos that stand out."}</p>
              <div className="hero-btns">
                <Link to="/courses" className="btn btn-primary">Explore Courses <span aria-hidden="true">↗</span></Link>
                <Link to="/about" className="btn btn-outline">Our approach <span aria-hidden="true">↗</span></Link>
              </div>
              <div className="hero-proof">
                <span>CRAFT OVER COPY</span><i /><span>YOUR STYLE, BUILT BY YOU</span>
              </div>
            </div>

            <div className="hero-visual">
              <img data-swarm-media="hero" data-swarm-trigger="viewport" data-swarm-replay src="/editor-studio.svg" alt="Cinematic video editing studio with a film viewer and editing timeline" />
              <button className="swarm-replay-control" type="button" data-swarm-replay-control aria-label="Replay the hero visual rebuild">Replay</button>
              <div className="visual-label visual-label-top"><span className="visual-live" /> THE EDITING ROOM</div>
              <div className="visual-card">
                <span className="visual-card-mark">OT / 01</span>
                <span>Every cut<br />says something.</span>
              </div>
              <div className="visual-caption">
                <span>01 — FIND YOUR POINT OF VIEW</span>
                <span className="visual-caption-line" />
                <span>OWN THE FRAME</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section id="showreel" className="container section brand-section home-course-preview-section">
        <Reveal>
          <div className="home-course-preview-grid">
            <div className="home-course-preview-copy">
              <span className="eyebrow">01 / A LOOK INSIDE</span>
              <h2>{previewCourse?.title || "Explore the Own Theme courses."}</h2>
              <p>{previewCourse?.description || courseInfo?.promise || "Learn the decisions behind a distinctive edit."}</p>
              <dl className="home-course-preview-meta">
                <div>
                  <dt>Instructor</dt>
                  <dd>{previewCourse?.instructor || "Details coming soon"}</dd>
                </div>
                <div>
                  <dt>Course length</dt>
                  <dd>{previewCourse?.estimatedDuration || courseInfo?.hours || "Details coming soon"}</dd>
                </div>
              </dl>
              <Link to={previewCourse ? `/courses/${previewCourse.slug || previewCourse.id}` : "/courses"} className="btn btn-primary">
                Explore the course <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="home-course-preview-media">
              <div className="home-course-preview-screen">
                <img
                  src={previewCourse?.thumbnail || "/editor-studio.svg"}
                  alt={previewCourse?.thumbnail ? `${previewCourse.title} course artwork` : "Illustration of a video editing studio and timeline"}
                  loading="lazy"
                />
                <span className="home-course-preview-status">Lesson video coming soon</span>
              </div>
              <div className="home-course-preview-caption">
                <span>{selectedLesson?.title || "Lesson details coming soon"}</span>
                <span>{selectedLesson?.duration || ""}</span>
              </div>
            </div>
          </div>
          {previewLessons.length > 0 && (
            <div className="home-course-lesson-list" role="group" aria-label="Preview course lessons">
              {previewLessons.map((lesson, index) => (
                <button
                  className={selectedLesson?.id === lesson.id ? "home-course-lesson active" : "home-course-lesson"}
                  type="button"
                  aria-pressed={selectedLesson?.id === lesson.id}
                  key={lesson.id}
                  onClick={() => setSelectedLessonId(lesson.id)}
                >
                  <span className="home-course-lesson-number">LESSON 0{index + 1}</span>
                  <strong>{lesson.title}</strong>
                  {lesson.duration && <span className="home-course-lesson-duration">{lesson.duration}</span>}
                </button>
              ))}
            </div>
          )}
        </Reveal>
      </section>

      <section className="container section method-section">
        <Reveal>
          <div className="section-heading">
            <span className="eyebrow">02 / HOW YOU'LL LEARN</span>
            <h2 className="section-title">Learn the Details. Build Your Style.</h2>
            <p className="section-sub">Great editing comes from making the right choices. Our six-step method helps you understand the key elements of video editing and use them to create your own style.</p>
          </div>
          <div className="stack-grid">
            {themeStack.map((item) => (
              <div className="stack-item" key={item.n}>
                <div className="num">{item.n}</div>
                <h4>{item.name}</h4>
                <p>{item.q}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="container section final-home-section">
        <Reveal>
          <div className="final-home-cta">
            <span className="eyebrow">03 / START YOUR CREATIVE JOURNEY</span>
            <h2>Your Ideas. Your Style. Your Next Edit.</h2>
            <p>Learn video editing, improve your skills, and create videos you're proud to share. Start learning for free or find the course that fits your goals.</p>
            <div className="hero-btns">
              <Link to="/courses" className="btn btn-primary">Explore Courses <span aria-hidden="true">↗</span></Link>
              <Link to="/free-course" className="btn btn-outline">Start Learning for Free</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
