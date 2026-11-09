import { useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { prices, bundlePrice } from "../data/admin";

const courses = [
  {
    id: 1, slug: "short-form", tag: "COURSE 01", title: "Short Form & Social Media",
    desc: "Build a format of your own instead of renting a trend.",
    meta: "28 lessons · CapCut + Premiere Pro",
  },
  {
    id: 2, slug: "long-form", tag: "COURSE 02", title: "Long Form & YouTube",
    desc: "Hold attention for ten minutes with a channel look you designed.",
    meta: "32 lessons · Premiere Pro",
  },
  {
    id: 3, slug: "film-doc", tag: "COURSE 03", title: "Film & Documentary",
    desc: "Edit with a point of view and an ethic.",
    meta: "32 lessons · DaVinci Resolve",
  },
];

const themeStack = [
  { n: "01", name: "Premise", q: "What is this about, and what should the viewer feel at the end?" },
  { n: "02", name: "Rhythm", q: "How long do you hold shots, and when do you break your own pattern?" },
  { n: "03", name: "Color", q: "What temperature and contrast match the premise?" },
  { n: "04", name: "Sound", q: "What do we hear, and where is it silent?" },
  { n: "05", name: "Type & Motion", q: "How do words and graphics arrive and leave?" },
  { n: "06", name: "Signature", q: "What one move do you repeat so people recognize your work?" },
];

// SAMPLE content. Replace with real student work (with permission) after the pilot.
const showcase = [
  { layer: "PREMISE", who: "Sample · Short Form student", before: "Make it look cool.", after: "Pressure. I want them tense, then relieved." },
  { layer: "SOUND", who: "Sample · Long Form student", before: "Add whatever music is trending.", after: "Room tone and breathing. No music until the last ten seconds." },
  { layer: "SIGNATURE", who: "Sample · Film student", before: "Use the transition everyone uses.", after: "I always cut away one beat before they expect it." },
];

export default function Home() {
  const [reelOn, setReelOn] = useState(false);

  // Bundle maths: add up the three prices, then subtract the bundle price
  const total = Object.values(prices).reduce((sum, p) => sum + p, 0);
  const saving = total - bundlePrice;

  return (
    <>
      {/* ===== Hero ===== */}
      <div className="hero-wrap">
        <div className="container">
          <section className="hero">
            <span className="badge">3 courses · 1 free mini-course</span>
            <h1>You don't have to follow a theme. <span>Build one.</span></h1>
            <p>Three video editing courses that teach you to design your own style, not copy a template.</p>
            <div className="hero-btns">
              <a href="#courses" className="btn btn-primary">Explore courses</a>
              <a href="#showreel" className="btn btn-outline">Watch showreel</a>
            </div>
          </section>
        </div>
      </div>

      {/* ===== Showreel ===== */}
      <section id="showreel" className="container section">
        <Reveal>
          <h2 className="section-title">See what's possible</h2>
          <div className="reel">
            <div className="reel-inner">
              <button className="play" onClick={() => setReelOn(!reelOn)}>▶</button>
              <strong>{reelOn ? "Your showreel plays here" : "Own Theme showreel"}</strong>
              <span>
                {reelOn
                  ? "The real video will be embedded from a private video host."
                  : "Tap play to preview"}
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ===== Theme Stack ===== */}
      <section className="container section">
        <Reveal>
          <h2 className="section-title">The Theme Stack</h2>
          <p className="section-sub">Six questions you answer, and revise, in every course. By the end, you hold a style sheet you wrote yourself.</p>
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

      {/* ===== Courses ===== */}
      <section id="courses" className="container">
        <Reveal>
          <h2 className="section-title">Choose your course</h2>
          <div className="course-grid">
            {courses.map((course) => (
              <div className="card" key={course.id}>
                <div className="tag">{course.tag}</div>
                <h3>{course.title}</h3>
                <p>{course.desc}</p>
                <div className="meta">{course.meta}</div>
                <Link to={`/courses/${course.slug}`} className="btn btn-primary">Learn more</Link>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ===== Student showcase ===== */}
      <section className="container section">
        <Reveal>
          <h2 className="section-title">From copying to deciding</h2>
          <p className="section-sub">Sample Theme Sheet entries, before and after. This is the shift every student makes.</p>
          <div className="show-grid">
            {showcase.map((s) => (
              <div className="show-card" key={s.layer}>
                <div className="eyebrow">{s.layer}</div>
                <div className="who">{s.who}</div>
                <div className="ba before"><small>BEFORE</small>{s.before}</div>
                <div className="ba after"><small>AFTER</small>{s.after}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ===== Pricing & bundle ===== */}
      <section id="pricing" className="container section">
        <Reveal>
          <h2 className="section-title">Simple pricing</h2>
          <p className="section-sub">One payment. Lifetime access. Pick one course or save with the bundle.</p>

          <div className="price-grid">
            {courses.map((course) => (
              <div className="card" key={course.id}>
                <div className="tag">{course.tag}</div>
                <h3>{course.title}</h3>
                <div className="price">${prices[course.slug]} <small>one-time</small></div>
                <ul className="check-list">
                  <li>{course.meta}</li>
                  <li>Certificate of completion</li>
                  <li>Lifetime access</li>
                </ul>
                <Link to={`/courses/${course.slug}`} className="btn btn-outline">View course</Link>
              </div>
            ))}
          </div>

          <div className="bundle-card">
            <div>
              <div className="eyebrow">BEST VALUE</div>
              <h3>The complete bundle</h3>
              <p>All three courses, one payment. Go from short form to YouTube to film.</p>
            </div>
            <div>
              <div className="price">
                ${bundlePrice}
                <span className="was">${total}</span>
                <span className="save">Save ${saving}</span>
              </div>
              <Link to="/checkout/bundle" className="btn btn-primary" style={{ marginTop: 12 }}>
                Get the bundle
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ===== Teacher ===== */}
      <section className="container section">
        <Reveal>
          <div className="teacher">
            <div className="avatar">A</div>
            <div>
              <div className="eyebrow">YOUR TEACHER</div>
              <h2>Abdulhafiz Zekeriya</h2>
              <p>
                Video editor and course creator. Own Theme exists because too many editors copy presets
                instead of making their own decisions. Every lesson teaches the decision first and the
                buttons second. (Replace this with the real bio and a photo.)
              </p>
              <div className="pills">
                <span className="pill">Premiere Pro</span>
                <span className="pill">After Effects</span>
                <span className="pill">DaVinci Resolve</span>
                <span className="pill">CapCut</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ===== Free Voice banner ===== */}
      <section className="container">
        <Reveal>
          <div className="banner">
            <h2>Start free with Voice</h2>
            <p>An 8-lesson mini-course that shows the method and helps you draft your first Theme Sheet.</p>
            <Link to="/signup" className="btn btn-primary">Join for free</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}