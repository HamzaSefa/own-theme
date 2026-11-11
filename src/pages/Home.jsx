import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { adminStorageKeys, readAdminData } from "../data/adminWorkspace";

const themeStack = [
  { n: "01", name: "Premise", q: "What is this about, and what should the viewer feel at the end?" },
  { n: "02", name: "Rhythm", q: "How long do you hold shots, and when do you break your own pattern?" },
  { n: "03", name: "Color", q: "What temperature and contrast match the premise?" },
  { n: "04", name: "Sound", q: "What do we hear, and where is it silent?" },
  { n: "05", name: "Type & Motion", q: "How do words and graphics arrive and leave?" },
  { n: "06", name: "Signature", q: "What one move do you repeat so people recognize your work?" },
];

export default function Home() {
  const siteSettings = readAdminData(adminStorageKeys.settings, {});
  const headline = siteSettings.homeHeadline || "You don't have to follow a theme. Build one.";
  const highlightedPhrase = "Build one.";
  const highlightIndex = headline.indexOf(highlightedPhrase);

  return (
    <>
      <div className="hero-wrap">
        <div className="container">
          <section className="hero">
            <div className="hero-copy">
              <span className="badge"><span className="badge-dot" />A VIDEO EDITING LEARNING STUDIO</span>
              <h1>{highlightIndex >= 0
                ? <>{headline.slice(0, highlightIndex)}<span>{highlightedPhrase}</span>{headline.slice(highlightIndex + highlightedPhrase.length)}</>
                : headline}</h1>
              <p>{siteSettings.homeDescription || "Learn practical editing, visual storytelling, and a workflow for shaping polished films with a style of your own."}</p>
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
