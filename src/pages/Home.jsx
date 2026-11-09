import { Link } from "react-router-dom";

const courses = [
  {
    id: 1, tag: "COURSE 01", title: "Short Form & Social Media",
    desc: "Build a format of your own instead of renting a trend.",
    meta: "28 lessons · CapCut + Premiere Pro",
  },
  {
    id: 2, tag: "COURSE 02", title: "Long Form & YouTube",
    desc: "Hold attention for ten minutes with a channel look you designed.",
    meta: "32 lessons · Premiere Pro",
  },
  {
    id: 3, tag: "COURSE 03", title: "Film & Documentary",
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

export default function Home() {
  return (
    <>
      <section className="hero container">
        <h1>You don't have to follow a theme. <span>Build one.</span></h1>
        <p>Three video editing courses that teach you to design your own style, not copy a template.</p>
        <a href="#courses" className="btn btn-primary">Explore courses</a>
      </section>

      <section className="container section">
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
      </section>

      <section id="courses" className="container">
        <h2 className="section-title">Choose your course</h2>
        <div className="course-grid">
          {courses.map((course) => (
            <div className="card" key={course.id}>
              <div className="tag">{course.tag}</div>
              <h3>{course.title}</h3>
              <p>{course.desc}</p>
              <div className="meta">{course.meta}</div>
              <a href="#" className="btn btn-primary">Learn more</a>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="banner">
          <h2>Start free with Voice</h2>
          <p>An 8-lesson mini-course that shows the method and helps you draft your first Theme Sheet.</p>
          <Link to="/signup" className="btn btn-primary">Join for free</Link>
        </div>
      </section>
    </>
  );
}