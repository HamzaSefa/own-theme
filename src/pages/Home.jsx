import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { adminStorageKeys, readAdminData } from "../data/adminWorkspace";

const themeStack = [
  { n: "01", name: "STORY", q: "Understand your idea and decide what you want your audience to feel." },
  { n: "02", name: "TIMING", q: "Learn when to cut, how to build rhythm, and how to keep viewers engaged." },
  { n: "03", name: "COLOR", q: "Use color and contrast to create the right mood." },
  { n: "04", name: "SOUND", q: "Combine music, sound effects, and silence to make every moment count." },
  { n: "05", name: "TEXT & EFFECTS", q: "Add titles, graphics, and motion that bring your video to life." },
  { n: "06", name: "YOUR SIGNATURE", q: "Develop a recognizable editing style that makes your work stand out." },
];

export default function Home() {
  const siteSettings = readAdminData(adminStorageKeys.settings, {});
  const headline = siteSettings.homeHeadline || "Don't Just Edit Videos. Create Your Style.";
  const highlightedPhrase = "Create Your Style.";
  const highlightIndex = headline.indexOf(highlightedPhrase);

  return (
    <>
      <div className="hero-wrap">
        <div className="container">
          <section className="hero">
            <div className="hero-copy">
              <span className="badge"><span className="badge-dot" />VIDEO EDITING COURSES</span>
              <h1>{highlightIndex >= 0
                ? <>{headline.slice(0, highlightIndex)}<span>{highlightedPhrase}</span>{headline.slice(highlightIndex + highlightedPhrase.length)}</>
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

      <section id="showreel" className="container section brand-section">
        <Reveal>
          <div className="brand-grid">
            <div className="brand-copy">
              <span className="eyebrow">01 / WHAT MAKES US DIFFERENT</span>
              <h2>Learn the Skills. Develop Your Style.</h2>
              <p>
                Anyone can use presets and effects. The real skill is knowing
                how to use them to make a video feel right.
              </p>
              <p>
                At Own Theme, you'll learn how to choose the right shots, sounds,
                and transitions to tell better stories and create edits that feel
                uniquely yours.
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
