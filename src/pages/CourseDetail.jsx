import { Link, useParams, Navigate } from "react-router-dom";
import { courses, student } from "../data/courses";
import { details, faq } from "../data/details";
import { prices } from "../data/admin";

export default function CourseDetail() {
  const { courseId } = useParams();
  const course = courses.find((c) => c.id === courseId);
  const info = details[courseId];

  if (!course || !info) return <Navigate to="/" />;

  const owned = student.enrolled.some((e) => e.courseId === courseId);

  const button = owned ? (
    <Link to="/dashboard" className="btn btn-primary">Go to my course</Link>
  ) : (
    <Link to={`/checkout/${course.id}`} className="btn btn-primary">Buy now</Link>
  );

  return (
    <div className="container">
      <section className="detail-hero">
        <div className="tag">{course.tag}</div>
        <h1>{course.title}</h1>
        <p className="lead">{info.promise}</p>
        <div className="pills">
          <span className="pill">{info.lessons} lessons</span>
          <span className="pill">{info.hours} of video</span>
          <span className="pill">Certificate of completion</span>
          <span className="pill">Lifetime access</span>
        </div>
        <div className="buy-row">
          <div className="price">${prices[course.id]} <small>one-time</small></div>
          {button}
        </div>
      </section>

      <section className="detail-section">
        <h2>Who this is for</h2>
        <ul className="check-list">
          {info.forWho.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="detail-section">
        <h2>Curriculum</h2>
        {info.modules.map((m) => (
          <details className="acc" key={m.title}>
            <summary>{m.title}</summary>
            <p>{m.outcome}</p>
          </details>
        ))}
      </section>

      <section className="detail-section">
        <h2>What you'll finish with</h2>
        <div className="card" style={{ transform: "none" }}>
          <div className="tag">CAPSTONE</div>
          <h3>{info.capstone}</h3>
          <p style={{ marginBottom: 0 }}>You also keep your own Theme Sheet: a style guide you wrote yourself.</p>
        </div>
      </section>

      <section className="detail-section">
        <h2>Software you need</h2>
        <p className="muted">{info.software}</p>
      </section>

      <section className="detail-section">
        <h2>Questions</h2>
        {faq.map((f) => (
          <details className="acc" key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      <section className="final-cta">
        <h2>Ready to build your own theme?</h2>
        {button}
      </section>
    </div>
  );
}