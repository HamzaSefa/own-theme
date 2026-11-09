const courses = [
  { id: 1, tag: "COURSE 01", title: "Short Form & Social Media", desc: "Master Reels, TikToks and Shorts that hook viewers fast." },
  { id: 2, tag: "COURSE 02", title: "Long Form & YouTube", desc: "Script, shoot and edit videos people actually finish watching." },
  { id: 3, tag: "COURSE 03", title: "Film & Documentary", desc: "Tell cinematic stories from first idea to final cut." },
];

function App() {
  return (
    <>
      <header className="navbar">
        <div className="container nav-inner">
          <div className="logo">Own<span>Theme</span></div>
          <nav className="nav-links">
            <a href="#courses">Courses</a>
            <a href="#">Login</a>
            <a href="#" className="btn btn-primary">Sign up</a>
          </nav>
        </div>
      </header>

      <section className="hero container">
        <h1>Learn to create <span>cinematic</span> content.</h1>
        <p>Three focused courses to take you from beginner to professional creator.</p>
        <a href="#courses" className="btn btn-primary">Explore courses</a>
      </section>

      <section id="courses" className="container">
        <h2 className="section-title">Choose your course</h2>
        <div className="course-grid">
          {courses.map((course) => (
            <div className="card" key={course.id}>
              <div className="tag">{course.tag}</div>
              <h3>{course.title}</h3>
              <p>{course.desc}</p>
              <a href="#" className="btn btn-primary">Learn more</a>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="container">© 2026 Own Theme. All rights reserved.</div>
      </footer>
    </>
  );
}

export default App;