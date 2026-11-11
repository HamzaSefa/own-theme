import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { courses as courseCatalog, getPublicCourseData, isPublicCourse } from "../data/courses";
import { adminStorageKeys, getAdminPlans, isAvailableBundle, readAdminData } from "../data/adminWorkspace";
import { faq } from "../data/details";

const courseArtwork = {
  "short-form": "CUT / 9:16",
  "long-form": "FRAME / 16:9",
  "film-doc": "SCENE / 24FPS",
};

const themeStack = [
  { n: "01", name: "Premise", q: "What is this about, and what should the viewer feel at the end?" },
  { n: "02", name: "Rhythm", q: "How long do you hold shots, and when do you break your own pattern?" },
  { n: "03", name: "Color", q: "What temperature and contrast match the premise?" },
  { n: "04", name: "Sound", q: "What do we hear, and where is it silent?" },
  { n: "05", name: "Type & Motion", q: "How do words and graphics arrive and leave?" },
  { n: "06", name: "Signature", q: "What one move do you repeat so people recognize your work?" },
];

const editDecisions = [
  {
    number: "01",
    name: "Story",
    direction: "Give the moment a point.",
    result: "Choose the detail that changes what a scene means, not simply the prettiest shot.",
  },
  {
    number: "02",
    name: "Pacing",
    direction: "Let the feeling set the tempo.",
    result: "Hold on a reaction for tension; cut faster only when the story earns the speed.",
  },
  {
    number: "03",
    name: "Sound",
    direction: "Make silence a decision.",
    result: "Keep the room tone, let a breath land, and bring music in when the emotion turns.",
  },
  {
    number: "04",
    name: "Color",
    direction: "Build a look from the premise.",
    result: "Shape temperature and contrast to support the scene instead of reaching for a preset.",
  },
];

export default function Home() {
  const courses = courseCatalog.filter(isPublicCourse).map((item, index) => ({
    ...getPublicCourseData(item),
    slug: item.slug || item.id,
    tag: item.tag || `COURSE ${String(index + 1).padStart(2, "0")}`,
    desc: item.description || item.desc || "Build a style of your own with practical, project-based editing lessons.",
    visual: courseArtwork[item.id] || "OWN THE FRAME",
    lessonCount: item.modules.reduce((total, module) => total + module.lessons.length, 0),
    thumbnail: item.thumbnail,
  }));
  const siteSettings = readAdminData(adminStorageKeys.settings, {});
  const plans = getAdminPlans();
  const featuredOrder = siteSettings.featuredCourseIds || [];
  courses.sort((a, b) => {
    const aIndex = featuredOrder.indexOf(a.id);
    const bIndex = featuredOrder.indexOf(b.id);
    return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex);
  });
  const featuredBundle = plans.bundles.find((bundle) => isAvailableBundle(bundle, courses.map((course) => course.id)));
  const selectedShowcase = [
    ...readAdminData(adminStorageKeys.assignments, []).filter(
      (item) => item.showcasePublished && item.showcaseConsent && /^https?:\/\//i.test(item.url || ""),
    ),
    ...readAdminData(adminStorageKeys.showcaseProjects, [])
      .filter((item) => item.showcasePublished && item.showcaseConsent && /^https?:\/\//i.test(item.mediaUrl || item.url || ""))
      .map((item) => ({ ...item, url: item.mediaUrl || item.url, notes: item.description || "" })),
  ];
  const headline = siteSettings.homeHeadline || "You don't have to follow a theme. Build one.";
  const highlightedPhrase = "Build one.";
  const highlightIndex = headline.indexOf(highlightedPhrase);
  const membershipAvailable = plans.membershipStatus === "Available"
    && plans.membershipPublicationStatus === "Published"
    && Boolean(plans.membershipPrice?.trim())
    && Boolean(plans.membershipCurrency?.trim())
    && Boolean(plans.membershipBillingCycle?.trim())
    && Boolean(plans.membershipAccess?.trim())
    && Boolean(plans.membershipRenewalTerms?.trim());

  return (
    <>
      <div className="hero-wrap">
        <div className="container">
          <section className="hero">
            <div className="hero-copy">
              <span className="badge"><span className="badge-dot" />{courses.length} courses · 1 free mini-course</span>
              <h1>{highlightIndex >= 0
                ? <>{headline.slice(0, highlightIndex)}<span>{highlightedPhrase}</span>{headline.slice(highlightIndex + highlightedPhrase.length)}</>
                : headline}</h1>
              <p>{siteSettings.homeDescription || "Learn practical editing, visual storytelling, and a workflow for shaping polished films with a style of your own."}</p>
              <div className="hero-btns">
                <Link to="/courses" className="btn btn-primary">Explore Courses <span aria-hidden="true">↗</span></Link>
                <a href="#showreel" className="btn btn-outline">See how we teach <span aria-hidden="true">↓</span></a>
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

      <section id="showreel" className="container section brand-section">
        <Reveal>
          <div className="brand-grid">
            <div className="brand-copy">
              <span className="eyebrow">03 / A DIFFERENT KIND OF EDITING SCHOOL</span>
              <h2>Presets can change a picture. <span>They can't give it a point of view.</span></h2>
              <p>
                A familiar transition can make an edit look polished, but style
                comes from knowing why a shot stays, when a sound enters, and
                what feeling the cut should leave behind.
              </p>
              <p>
                Own Theme teaches the thinking behind the tools, so you can
                borrow techniques, break patterns, and make choices that feel
                like yours.
              </p>
              <Link to="/about" className="text-link">Our philosophy <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="brand-film">
              <div className="brand-film-frame">
                <span className="film-kicker">OWN THE FRAME / STUDY 001</span>
                <div className="film-title">A cut is<br /><em>a choice.</em></div>
                <div className="film-sun" />
                <div className="film-horizon" />
                <span className="film-timecode">00:01:24:08</span>
              </div>
              <div className="brand-film-caption">
                <span className="film-play-mark" aria-hidden="true">OT</span>
                <span>Showreel preview coming soon · A point of view in every frame.</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container section method-section">
        <Reveal>
          <div className="section-heading">
            <span className="eyebrow">04 / THE OWN THEME METHOD</span>
            <h2 className="section-title">A style is a system of choices.</h2>
            <p className="section-sub">The Theme Stack gives you six creative elements to question, test, and make your own in every edit.</p>
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

      <section id="courses" className="container section courses-section">
        <Reveal>
          <div className="section-heading">
            <span className="eyebrow">05 / THREE LEARNING TRACKS</span>
            <h2 className="section-title">Choose the stories you want to tell.</h2>
            <p className="section-sub">Focused courses for different formats, connected by one method: build a visual language that belongs to you.</p>
          </div>
          <div className="course-grid featured-course-grid">
            {courses.map((course, index) => (
              <article className={`card featured-course course-${course.slug}`} key={course.id}>
                <div className="course-card-top"><div className="tag">{course.tag}</div><span className="course-index">{String(index + 1).padStart(2, "0")}</span></div>
                <div
                  className="course-art"
                  data-swarm-media={course.thumbnail && index === 0 ? "course-preview" : undefined}
                  data-swarm-trigger={course.thumbnail && index === 0 ? "hover" : undefined}
                  tabIndex={course.thumbnail && index === 0 ? 0 : undefined}
                  style={course.thumbnail ? { backgroundImage: `linear-gradient(0deg,rgba(8,12,11,.35),rgba(8,12,11,.05)),url("${course.thumbnail}")` } : undefined}
                >
                  <span aria-hidden="true">{course.visual}</span><i aria-hidden="true" /><b aria-hidden="true" />
                </div>
                <div className="course-card-copy">
                  <h3>{course.title}</h3>
                  <p>{course.desc}</p>
                  <div className="meta">{course.lessonCount ? `${course.lessonCount} lessons` : "Curriculum coming soon"}</div>
                  <Link to={`/courses/${course.slug}`} className="course-card-link">Explore this track <span aria-hidden="true">↗</span></Link>
                </div>
              </article>
            ))}
          </div>
          <div className="course-section-link"><Link to="/courses" className="text-link">View all courses <span aria-hidden="true">↗</span></Link></div>
        </Reveal>
      </section>

      <section className="transformation-section">
        <Reveal>
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">06 / THE EDITING TRANSFORMATION</span>
              <h2 className="section-title">Same footage. More intentional choices.</h2>
              <p className="section-sub">Storytelling, pacing, sound, and color don't decorate an edit. They shape what the audience feels.</p>
            </div>
            <div className="transformation-grid">
              {editDecisions.map((item) => (
                <article className="transformation-card" key={item.number}>
                  <span className="transformation-number">{item.number}</span>
                  <span className="eyebrow">{item.name}</span>
                  <h3>{item.direction}</h3>
                  <p>{item.result}</p>
                  <span className="transformation-rule" />
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section id="showcase" className="container section home-showcase-section">
        <Reveal>
          <div className="section-heading">
            <span className="eyebrow">07 / STUDENT SHOWCASE</span>
            <h2 className="section-title">The thinking behind the finished frame.</h2>
            <p className="section-sub">Selected student projects are shared only with permission. Each feature includes the creative decision behind the edit.</p>
          </div>
          {selectedShowcase.length ? (
            <div className="student-showcase-grid">
              {selectedShowcase.slice(0, 3).map((item) => (
                <article className="student-project-card" key={item.id}>
                  <a className="student-project-link" href={item.url} target="_blank" rel="noreferrer">
                    <span className="student-project-icon">▶</span><span>VIEW PROJECT ↗</span>
                  </a>
                  <div className="student-project-copy">
                    <span className="eyebrow">{courses.find((course) => course.slug === item.courseId || course.id === item.courseId)?.title || "STUDENT PROJECT"}</span>
                    <h3>{item.title}</h3>
                    <p>{item.notes || "A student edit shaped by a deliberate creative point of view."}</p>
                    <span className="student-credit">Shared by the student · Own Theme</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="showcase-coming">
              <span className="showcase-coming-mark">OT / SHOWCASE</span>
              <h3>Student projects are on the way.</h3>
              <p>We'll feature selected edits here when students choose to share them and approve their showcase feature.</p>
              <Link to="/showcase" className="text-link">About the showcase <span aria-hidden="true">↗</span></Link>
            </div>
          )}
        </Reveal>
      </section>

      <section id="free-course" className="container section">
        <Reveal>
          <div className="free-course-banner">
            <div className="free-course-art" aria-hidden="true"><span>VOICE</span><i /><b>FREE<br />LESSONS</b></div>
            <div className="free-course-copy">
              <span className="eyebrow">08 / START FREE · 8 LESSONS</span>
              <h2>Find the voice in your edit.</h2>
              <p>Try the Own Theme teaching approach, explore how sound carries a story, and draft your first Theme Sheet—no course purchase required.</p>
              <Link to="/free-course" className="btn btn-primary">Explore the free mini-course <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="pricing" className="container section pricing-section">
        <Reveal>
          <div className="section-heading">
            <span className="eyebrow">09 / WAYS TO LEARN</span>
            <h2 className="section-title">One course or the whole collection.</h2>
            <p className="section-sub">Choose a focused track or get all three courses together. Membership details will appear when an ongoing plan is available.</p>
          </div>
          <div className="pricing-preview-grid">
            <article className="pricing-preview-card">
              <span className="eyebrow">INDIVIDUAL TRACKS</span>
              <h3>Start with one format.</h3>
              <p>Choose an individual course. Access duration and terms are listed with each course when confirmed.</p>
              <Link to="/courses" className="text-link">Browse individual courses <span aria-hidden="true">↗</span></Link>
            </article>
            {featuredBundle && <article className="pricing-preview-card bundle-preview">
              <span className="eyebrow">BEST VALUE · ONE-TIME</span>
              <h3>{featuredBundle.title}</h3>
              <p>{featuredBundle.description || "A one-time purchase of the courses included in this bundle."}</p>
              <div className="bundle-preview-bottom"><strong>{featuredBundle.currency || "USD"} {featuredBundle.price}<small> one-time</small></strong><Link to={`/checkout/bundle?bundle=${encodeURIComponent(featuredBundle.id)}`} className="btn btn-primary">Get the bundle <span aria-hidden="true">↗</span></Link></div>
            </article>}
            <article className="pricing-preview-card membership-preview">
              <span className="eyebrow">MEMBERSHIP</span>
              <h3>Keep learning, together.</h3>
              <p>{membershipAvailable
                ? `Membership offer: ${plans.membershipCurrency} ${plans.membershipPrice} ${plans.membershipBillingCycle}. Access: ${plans.membershipAccess}. Renewal: ${plans.membershipRenewalTerms}. Subscription checkout is not yet available.`
                : plans.membershipStatus === "Paused"
                  ? "Membership enrollment is paused while we shape the ongoing learning offer."
                  : "Membership is in development. We'll share the format and price when they're confirmed."}</p>
              <span className="coming-soon">{membershipAvailable ? "Offer preview" : plans.membershipStatus}</span>
            </article>
          </div>
          <div className="course-section-link"><Link to="/plans" className="text-link">Compare all learning options <span aria-hidden="true">↗</span></Link></div>
        </Reveal>
      </section>

      <section id="faq" className="container section home-faq-section">
        <Reveal>
          <div className="section-heading">
            <span className="eyebrow">10 / FAQ</span>
            <h2 className="section-title">Before you press play.</h2>
            <p className="section-sub">A few useful details about learning with Own Theme.</p>
          </div>
          <div className="home-faq-list">
            {faq.map((item) => (
              <details className="acc" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div className="course-section-link"><Link to="/faq" className="text-link">More questions? Visit FAQ & support <span aria-hidden="true">↗</span></Link></div>
        </Reveal>
      </section>

      <section className="container section final-home-section">
        <Reveal>
          <div className="final-home-cta">
            <span className="eyebrow">11 / YOUR NEXT CUT STARTS HERE</span>
            <h2>Make something that could only come from you.</h2>
            <p>Start with a free lesson or choose the track that fits the stories you want to tell.</p>
            <div className="hero-btns">
              <Link to="/courses" className="btn btn-primary">Explore courses <span aria-hidden="true">↗</span></Link>
              <Link to="/free-course" className="btn btn-outline">Try the free mini-course</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
