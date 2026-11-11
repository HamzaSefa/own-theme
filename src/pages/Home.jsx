import { Link } from "react-router-dom";

const focusAreas = [
  {
    number: "01",
    title: "For students",
    items: "A personal dashboard, distraction-free lessons, and automatic progress tracking.",
  },
  {
    number: "02",
    title: "For the course owner",
    items: "Manage courses, student access, device sessions, orders, and recorded sales.",
  },
  {
    number: "03",
    title: "Security foundation",
    items: "Protected data, signed media links, and session revocation belong on the server.",
  },
];

export default function Home() {
  return (
    <main>
      <div className="hero-wrap">
        <div className="container">
          <section className="hero">
            <div className="hero-copy">
              <span className="badge"><span className="badge-dot" />A focused learning platform</span>
              <h1>Learn to edit with <span>your own point of view.</span></h1>
              <p>
                Own Theme brings your courses, lessons, and learning progress
                together in one simple place.
              </p>
              <div className="hero-btns">
                <Link to="/signup" className="btn btn-primary">Create your account <span aria-hidden="true">↗</span></Link>
                <Link to="/login" className="btn btn-outline">Student sign in</Link>
              </div>
              <div className="hero-proof">
                <span>COURSES & LESSONS</span><i /><span>YOUR PROGRESS, IN ONE PLACE</span>
              </div>
            </div>
            <div className="hero-visual">
              <img src="/editor-studio.svg" alt="Video editing studio with a film viewer and editing timeline" />
              <div className="visual-label visual-label-top"><span className="visual-live" /> THE LEARNING SPACE</div>
              <div className="visual-card">
                <span className="visual-card-mark">OT / 01</span>
                <span>Every cut<br />says something.</span>
              </div>
              <div className="visual-caption">
                <span>COURSES · LESSONS · PROGRESS</span>
                <span className="visual-caption-line" />
                <span>OWN THE FRAME</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="container section scope-section">
        <header className="section-heading">
          <span className="eyebrow">ONE PLATFORM, THREE RESPONSIBILITIES</span>
          <h2 className="section-title">Everything has a clear place.</h2>
          <p className="section-sub">
            A straightforward learning experience for students and a practical
            workspace for the course owner.
          </p>
        </header>
        <div className="scope-grid">
          {focusAreas.map((area) => (
            <article className="scope-card" key={area.number}>
              <span className="eyebrow">{area.number}</span>
              <h3>{area.title}</h3>
              <p>{area.items}</p>
            </article>
          ))}
        </div>
        <p className="scope-notice">
          This is a local preview. Secure video delivery, in-app document viewing,
          payment processing, protected database access, signed storage links,
          and server-side session revocation are not connected yet. Do not enter
          real or sensitive information.
        </p>
      </section>
    </main>
  );
}
