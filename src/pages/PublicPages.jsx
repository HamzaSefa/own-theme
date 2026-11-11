import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { courses, getPublicCourseData, isPublicCourse } from "../data/courses";
import { details, faq } from "../data/details";
import { prices } from "../data/admin";
import { adminStorageKeys, getAdminPlans, isAvailableBundle, readAdminData } from "../data/adminWorkspace";
import { enrollInFreeCourse, getCurrentUser, hasFreeCourseAccess } from "../data/studentPortal";

const showcase = [
  {
    slug: "short-form-pressure",
    category: "Short-Form & Social Media",
    title: "Pressure, then relief",
    format: "Short-form brand study",
    goal: "Make a small everyday action feel tense, then let the audience feel the release.",
    techniques: ["Premise-led shot selection", "Cut rhythm", "Sound contrast"],
    process: "This Own Theme concept study starts by deciding what the audience should feel. The edit holds on preparation, tightens the rhythm as pressure builds, then leaves space for the release. It is an illustrative brand example, not a student result.",
    before: "Make it look cool.",
    after: "Pressure. I want them tense, then relieved.",
  },
  {
    slug: "long-form-room-tone",
    category: "Long-Form & YouTube",
    title: "Let the room speak",
    format: "Long-form sound study",
    goal: "Keep an intimate conversation engaging without covering its natural pauses.",
    techniques: ["Room tone", "Dialogue pacing", "Delayed music"],
    process: "The study keeps breathing and room tone in the edit so the conversation feels present. Music enters only when the emotional turn earns it. It is an illustrative brand example, not a student result.",
    before: "Add whatever music is trending.",
    after: "Room tone and breathing. No music until the last ten seconds.",
  },
  {
    slug: "documentary-one-beat",
    category: "Film & Documentary",
    title: "One beat before",
    format: "Documentary editing study",
    goal: "Create a distinctive rhythm while keeping the moment honest.",
    techniques: ["Reaction timing", "Ethical cut", "Signature rhythm"],
    process: "Rather than relying on a conspicuous transition, this concept study cuts away one beat before the expected moment. The timing creates a repeatable signature without changing the meaning of what happened. It is an illustrative brand example, not a student result.",
    before: "Use the transition everyone uses.",
    after: "I always cut away one beat before they expect it.",
  },
];

function PageIntro({ eyebrow, title, description }) {
  return (
    <header className="public-page-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

function getProjectMedia(url) {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return null;

    if (/\.(mp4|webm|ogg)$/i.test(parsedUrl.pathname)) {
      return { type: "video", src: parsedUrl.href };
    }

    const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") {
      const videoId = host === "youtu.be"
        ? parsedUrl.pathname.split("/").filter(Boolean)[0]
        : parsedUrl.searchParams.get("v") || parsedUrl.pathname.match(/^\/embed\/([^/]+)/)?.[1];
      if (videoId && /^[\w-]{11}$/.test(videoId)) {
        return {
          type: "embed",
          src: `https://www.youtube-nocookie.com/embed/${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        };
      }
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const videoId = parsedUrl.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      if (videoId) return { type: "embed", src: `https://player.vimeo.com/video/${videoId}` };
    }

    return { type: "external", src: parsedUrl.href };
  } catch {
    return null;
  }
}

function ProjectPlayer({ project, compact = false }) {
  const media = getProjectMedia(project.url || project.mediaUrl);
  const poster = project.thumbnailUrl || project.thumbnail;

  if (!media || media.type === "external") {
    return compact
      ? <div className="showcase-project-placeholder"><span aria-hidden="true">↗</span><small>PROJECT PREVIEW</small></div>
      : <a href={media?.src || project.url} target="_blank" rel="noreferrer" className="showcase-detail-external">
        <span className="showcase-detail-play" aria-hidden="true">↗</span>
        <span>Open the project on its original platform ↗</span>
      </a>;
  }

  if (media.type === "video") {
    return <video
      className={compact ? "showcase-project-video" : "showcase-detail-video"}
      src={media.src}
      poster={poster}
      controls={!compact}
      muted={compact}
      playsInline
      preload="metadata"
      aria-label={compact ? `${project.title} video thumbnail` : `${project.title} project video`}
      tabIndex={compact ? -1 : undefined}
    />;
  }

  return compact
    ? poster || media.thumbnail
      ? <img className="showcase-project-thumbnail" src={poster || media.thumbnail} alt="" loading="lazy" />
      : <div className="showcase-project-placeholder"><span aria-hidden="true">▶</span><small>VIDEO PROJECT</small></div>
    : <iframe
      className="showcase-detail-embed"
      src={media.src}
      title={`${project.title} video`}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />;
}

function SupportContactForm({ supportEmail }) {
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactNotice, setContactNotice] = useState("");

  function sendSupportEmail(event) {
    event.preventDefault();
    if (!supportEmail) {
      setContactNotice("Support email is not configured. This form has not sent or stored your message.");
      return;
    }

    const subject = encodeURIComponent(contactSubject.trim() || "Own Theme support request");
    const body = encodeURIComponent(`From: ${contactEmail.trim()}\n\n${contactMessage.trim()}`);
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    setContactNotice("Your email app should open with this message. The website does not submit or store the request.");
  }

  return (
    <form className="support-contact-form" onSubmit={sendSupportEmail}>
      <label htmlFor="support-contact-email">Your email</label>
      <input id="support-contact-email" type="email" required value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="you@email.com" />
      <label htmlFor="support-contact-subject">Subject</label>
      <input id="support-contact-subject" required value={contactSubject} onChange={(event) => setContactSubject(event.target.value)} placeholder="How can we help?" />
      <label htmlFor="support-contact-message">Message</label>
      <textarea id="support-contact-message" required rows="4" value={contactMessage} onChange={(event) => setContactMessage(event.target.value)} placeholder="Include course or order details, but never send passwords or payment card details." />
      <button type="submit" className="btn btn-primary" disabled={!supportEmail}>Open email app</button>
      {!supportEmail && <p className="support-form-notice">Business support email is not configured. The form will not send or store a message.</p>}
      {contactNotice && <p className="support-form-notice" role="status">{contactNotice}</p>}
    </form>
  );
}

function hasConfirmedMembershipTerms(plans) {
  return plans.membershipStatus === "Available"
    && plans.membershipPublicationStatus === "Published"
    && Boolean(plans.membershipPrice?.trim())
    && Boolean(plans.membershipCurrency?.trim())
    && Boolean(plans.membershipBillingCycle?.trim())
    && Boolean(plans.membershipAccess?.trim())
    && Boolean(plans.membershipRenewalTerms?.trim());
}

export function CoursesPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All courses");
  const catalogEntries = useMemo(() => [
    ...courses.filter(isPublicCourse).map((item) => ({
      ...getPublicCourseData(item),
      category: item.category || (item.id === "short-form"
        ? "Short-Form & Social Media"
        : item.id === "long-form"
          ? "Long-Form & YouTube"
          : "Film & Documentary"),
    })),
    {
      id: "free-mini-course",
      tag: "FREE · 8 LESSONS",
      title: "Voice Mini-Course",
      category: "Free Mini-Course",
      free: true,
      description: "Explore how sound shapes an edit and draft your first Theme Sheet.",
    },
  ], []);
  const categories = ["All courses", ...new Set(catalogEntries.map((course) => course.category).filter(Boolean))];
  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return catalogEntries.filter((course) => {
      const categoryMatches = activeCategory === "All courses" || course.category === activeCategory;
      if (!categoryMatches) return false;
      if (!normalizedQuery) return true;

      const info = details[course.id];
      const searchableContent = [
        course.title,
        course.tag,
        course.category,
        course.description,
        info?.promise,
        info?.software,
        ...(info?.forWho || []),
        ...(info?.modules || []).flatMap((module) => [module.title, module.outcome]),
      ].join(" ").toLowerCase();
      return searchableContent.includes(normalizedQuery);
    });
  }, [activeCategory, catalogEntries, query]);
  const publicCourses = courses.filter(isPublicCourse);
  const plans = getAdminPlans();
  const publicCourseIds = publicCourses.map((course) => course.id);
  const featuredBundle = plans.bundles.find((bundle) => isAvailableBundle(bundle, publicCourseIds));
  const membershipAvailable = hasConfirmedMembershipTerms(plans);

  return (
    <main className="container public-page courses-page">
      <PageIntro
        eyebrow="THE COURSE CATALOG"
        title="Find the track for your next edit."
        description="Compare focused courses for social video, YouTube, and documentary filmmaking. Each one teaches the craft behind a style you can call your own."
      />
      <section className="catalog-controls" aria-label="Find a course">
        <label className="catalog-search">
          <span className="sr-only">Search courses and topics</span>
          <span className="catalog-search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses or topics"
          />
          {query && <button type="button" onClick={() => setQuery("")}>Clear</button>}
        </label>
        <div className="catalog-filters" role="group" aria-label="Filter by course category">
          {categories.map((category) => (
            <button
              type="button"
              className={`catalog-filter${activeCategory === category ? " active" : ""}`}
              aria-pressed={activeCategory === category}
              key={category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="recommended-path" aria-labelledby="recommended-title">
        <div className="recommended-mark" aria-hidden="true"><span>OT</span><i /></div>
        <div className="recommended-copy">
          <span className="eyebrow">A RECOMMENDED LEARNING PATH</span>
          <h2 id="recommended-title">New to editing? Start with the free Voice mini-course.</h2>
          <p>Then choose a course by the format you want to make. Every course starts with the fundamentals, so you can begin without prior editing experience.</p>
        </div>
        <Link to="/free-course" className="btn btn-primary">Start free <span aria-hidden="true">↗</span></Link>
      </section>

      <section className="catalog-results" aria-live="polite">
        <div className="catalog-results-heading">
          <h2>{activeCategory === "All courses" ? "Explore the courses" : activeCategory}</h2>
          <span>{filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"}</span>
        </div>
        {filteredCourses.length ? (
          <div className="catalog-grid">
            {filteredCourses.map((course, index) => {
              const info = details[course.id];
              if (course.free) {
                return (
                  <article className="card catalog-card catalog-course-free" key={course.id}>
                    <div className="catalog-card-art catalog-card-art-free" role="img" aria-label="Voice mini-course artwork">
                      <span>FREE / VOICE</span><i />
                    </div>
                    <div className="catalog-card-content">
                      <span className="catalog-card-category">{course.category}</span>
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                      <div className="catalog-card-metadata">
                        <span>Beginner-friendly</span>
                        <span>8 lessons</span>
                      </div>
                      <div className="catalog-bottom">
                        <span className="catalog-free-label">Free</span>
                        <Link className="btn btn-primary" to="/free-course">Start learning <span aria-hidden="true">↗</span></Link>
                      </div>
                    </div>
                  </article>
                );
              }
              const lessonCount = course.modules.reduce((total, module) => total + module.lessons.length, 0);
              const duration = course.estimatedDuration || info?.hours;
              const subscriptionOnly = course.purchaseOption === "Subscription included";
              const coursePrice = course.price !== "" && course.price != null ? course.price : prices[course.id];
              const featuredPreview = course.id === publicCourses[0]?.id && Boolean(course.thumbnail);
              return (
                <article className={`card catalog-card catalog-course-${course.id}`} key={course.id}>
                  <Link to={`/courses/${course.slug || course.id}`} className="catalog-card-art" aria-label={`View ${course.title} course`}>
                    {course.thumbnail
                      ? <img className="catalog-card-thumbnail" data-swarm-media={featuredPreview ? "course-preview" : undefined} data-swarm-trigger={featuredPreview ? "hover" : undefined} src={course.thumbnail} alt="" aria-hidden="true" />
                      : <span className="catalog-card-art-placeholder" aria-hidden="true">{course.tag || `COURSE 0${index + 1}`}</span>}
                    <span className="catalog-card-art-label" aria-hidden="true">{course.category || course.tag}</span>
                    <span className="catalog-card-preview-action" aria-hidden="true">View course <b>↗</b></span>
                    <i aria-hidden="true" />
                  </Link>
                  <div className="catalog-card-content">
                    <div className="catalog-card-heading">
                      <span className="catalog-card-category">{course.category || course.tag}</span>
                      {course.level && <span className="catalog-card-level">{course.level}</span>}
                    </div>
                    <h3>{course.title}</h3>
                    <p>{course.description || info?.promise || "Build a style of your own with practical, project-based editing lessons."}</p>
                    <div className="catalog-card-metadata" aria-label="Course details">
                      {lessonCount > 0 && <span>{lessonCount} lessons</span>}
                      {duration && <span>{duration}</span>}
                    </div>
                    {course.instructor && <p className="catalog-card-instructor"><span>Instructor</span>{course.instructor}</p>}
                    {info?.software && <p className="catalog-card-software"><span>TOOLS</span>{info.software}</p>}
                    <div className="catalog-bottom">
                      <span className="price">{subscriptionOnly ? "Membership" : coursePrice != null ? `USD ${coursePrice}` : "Price not set"}<small>{subscriptionOnly ? " access" : coursePrice != null ? " · one-time" : ""}</small></span>
                      <Link className="btn btn-primary" to={subscriptionOnly ? "/plans" : `/courses/${course.slug || course.id}`}>{subscriptionOnly ? "View plans" : "View course"} <span aria-hidden="true">↗</span></Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="catalog-empty">
            <h3>No courses match that search.</h3>
            <p>Try a different title, topic, or course category.</p>
            <button type="button" className="btn btn-outline" onClick={() => { setQuery(""); setActiveCategory("All courses"); }}>Reset search and filters</button>
          </div>
        )}
      </section>

      <section className="catalog-free-promo">
        <div className="catalog-free-art" aria-hidden="true"><span>VOICE</span><i>FREE / 08 LESSONS</i></div>
        <div>
          <span className="eyebrow">TRY THE METHOD</span>
          <h2>Start with sound. Find your editing voice.</h2>
          <p>Eight free lessons introduce the Own Theme approach through the choices that shape voice and sound in an edit.</p>
          <Link to="/free-course" className="text-link">Explore the free mini-course <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      {featuredBundle && <section className="catalog-offer-promo">
        <div>
          <span className="eyebrow">ONE COURSE OR A ONE-TIME BUNDLE</span>
          <h2>{featuredBundle.title}</h2>
          <p>{featuredBundle.description || "A one-time purchase of the courses included in this bundle."} Membership details are shared only when a plan is confirmed.</p>
        </div>
        <div className="catalog-offer-action">
          <strong>{featuredBundle.currency || "USD"} {featuredBundle.price}<small> one-time</small></strong>
          <Link to={`/checkout/bundle?bundle=${encodeURIComponent(featuredBundle.id)}`} className="btn btn-primary">Explore the bundle <span aria-hidden="true">↗</span></Link>
          <span className="coming-soon">{membershipAvailable ? `Membership preview · ${plans.membershipCurrency} ${plans.membershipPrice}` : plans.membershipStatus === "Paused" ? "Membership paused" : "Membership coming soon"}</span>
        </div>
      </section>}

      <section className="catalog-faq" aria-labelledby="catalog-faq-title">
        <div className="section-heading">
          <span className="eyebrow">COMMON QUESTIONS</span>
          <h2 id="catalog-faq-title" className="section-title">Choosing a course</h2>
        </div>
        {faq.slice(0, 5).map((item) => (
          <details className="acc" key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
        <div className="public-page-cta">
          <p>Still deciding?</p>
          <Link to="/faq" className="text-link">Visit FAQ & support <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </main>
  );
}

export function BundlesMembershipPage() {
  const publicCourses = courses.filter(isPublicCourse);
  const individualCourses = publicCourses.filter((course) => course.purchaseOption !== "Subscription included");
  const plans = getAdminPlans();
  const publicCourseIds = publicCourses.map((course) => course.id);
  const visibleBundles = plans.bundles.filter((bundle) => isAvailableBundle(bundle, publicCourseIds));
  const membershipDetailsConfirmed = hasConfirmedMembershipTerms(plans);
  const planFaq = [
    {
      q: "Is the complete bundle a subscription?",
      a: "No. The bundle is a one-time purchase of the included courses. It does not renew or create a recurring payment.",
    },
    {
      q: "How long do I have access to individual courses or the bundle?",
      a: "Access duration and any limits are shown with a course when confirmed. The current preview does not verify purchased access.",
    },
    {
      q: "How does membership billing and access work?",
      a: membershipDetailsConfirmed
        ? `Membership is a recurring subscription. The currently published plan is ${plans.membershipPrice} ${plans.membershipBillingCycle}; access includes: ${plans.membershipAccess}. Renewal terms: ${plans.membershipRenewalTerms}. Subscription checkout is not connected in this preview.`
        : "Membership enrollment is not open. Recurring price, included access, and renewal terms have not all been confirmed, so no subscription checkout is offered.",
    },
    {
      q: "Can I buy the bundle and subscribe at the same time?",
      a: "Bundles and membership are separate offers with separate terms. Any published bundle is a one-time demo checkout; recurring subscription checkout is not available in this preview.",
    },
    {
      q: "Does the current checkout take a real payment?",
      a: "No. Checkout is a local demo and does not process a real payment or create a real receipt.",
    },
  ];

  return (
    <main className="container public-page plans-page">
      <PageIntro
        eyebrow="PLANS & PRICING"
        title="Choose how you want to learn."
        description="Buy one course, get the complete collection in a one-time bundle, or review the membership details when recurring billing and access terms are confirmed."
      />
      <section className="plans-individual-section" aria-labelledby="individual-plans-title">
        <div className="plans-section-heading">
          <span className="eyebrow">01 / INDIVIDUAL COURSES</span>
          <h2 id="individual-plans-title">Choose one course. Pay once.</h2>
          <p>Each individual course is a separate one-time purchase. Access terms are stated with the course when confirmed.</p>
        </div>
        <div className="plans-individual-grid">
          {individualCourses.map((course) => {
            const info = details[course.id];
            return (
              <article className="plans-course-card" key={course.id}>
                <span className="eyebrow">{course.tag}</span>
                <h3>{course.title}</h3>
                <p>{course.description || info?.promise || "Course details will be added soon."}</p>
                <div className="plans-course-price">{course.price !== "" && course.price != null ? `$${course.price}` : prices[course.id] != null ? `$${prices[course.id]}` : "Price not set"}<small> one-time</small></div>
                <Link to={`/courses/${course.slug || course.id}`} className="text-link">View course <span aria-hidden="true">↗</span></Link>
              </article>
            );
          })}
        </div>
      </section>

      {visibleBundles.map((bundle, index) => {
        const includedCourses = publicCourses.filter((course) => bundle.includedCourses.includes(course.id));
        const allPricesSet = includedCourses.every((course) =>
          (course.price !== "" && course.price != null) || prices[course.id] != null
        );
        const separateTotal = includedCourses.reduce((sum, course) => sum + Number(
          course.price !== "" && course.price != null ? course.price : prices[course.id] ?? 0
        ), 0);
        const saving = allPricesSet ? separateTotal - Number(bundle.price) : 0;
        return (
          <section className="plans-bundle-section" aria-labelledby={`bundle-plan-title-${bundle.id}`} key={bundle.id}>
            <div className="plans-bundle-copy">
              <span className="eyebrow">0{index + 2} / ONE-TIME BUNDLE</span>
              <h2 id={`bundle-plan-title-${bundle.id}`}>{bundle.title}</h2>
              <p>{bundle.description || "A one-time purchase of the courses listed below. No recurring charge or renewal."}</p>
              <div className="plans-bundle-prices">
                <strong>{bundle.currency || "USD"} {bundle.price}<small> one-time</small></strong>
                <span>{allPricesSet ? saving > 0 ? `Purchased separately: ${bundle.currency || "USD"} ${separateTotal} · Save ${bundle.currency || "USD"} ${saving}` : `Purchased separately: ${bundle.currency || "USD"} ${separateTotal}` : "Individual course prices are not fully set."}</span>
              </div>
              <p><strong>Access:</strong> {bundle.accessDuration || "Access terms to be confirmed."}</p>
              <Link to={`/checkout/bundle?bundle=${encodeURIComponent(bundle.id)}`} className="btn btn-primary">Review one-time bundle <span aria-hidden="true">↗</span></Link>
              <p className="plans-demo-note">Demo checkout only. No real payment is processed.</p>
            </div>
            <div className="plans-included">
              <h3>Included courses & benefits</h3>
              <ul className="check-list">
                {includedCourses.map((course) => <li key={course.id}>{course.title}</li>)}
                <li>Project-based lessons and a course capstone</li>
                <li>Keep a Theme Sheet as your personal style guide</li>
              </ul>
            </div>
          </section>
        );
      })}

      <section className="plans-membership-section" aria-labelledby="membership-title">
        <div>
          <span className="eyebrow">03 / MEMBERSHIP · RECURRING SUBSCRIPTION</span>
          <h2 id="membership-title">Membership is a separate offer.</h2>
          <p>A subscription requires recurring payments and clearly defined membership access, billing frequency, and renewal terms. It is not the one-time course bundle.</p>
        </div>
        {membershipDetailsConfirmed ? (
          <div className="plans-membership-details">
            <span className="coming-soon">Terms announced · preview only</span>
            <strong>{plans.membershipCurrency} {plans.membershipPrice}<small> {plans.membershipBillingCycle}</small></strong>
            <p><b>Included access:</b> {plans.membershipAccess}</p>
            <p><b>Renewal terms:</b> {plans.membershipRenewalTerms}</p>
            <p className="plans-demo-note">Subscription checkout is not connected, so enrollment is not available in this preview.</p>
          </div>
        ) : (
          <div className="plans-membership-details">
            <span className="coming-soon">{plans.membershipStatus === "Paused" ? "Membership paused" : "Coming soon"}</span>
            <p>Enrollment is not open. Recurring price, membership access, and renewal terms must all be confirmed before a subscription can be offered.</p>
          </div>
        )}
      </section>

      <section className="plans-access-section" aria-labelledby="plans-access-title">
        <span className="eyebrow">04 / ACCESS & RENEWAL</span>
        <h2 id="plans-access-title">Know what your purchase includes.</h2>
        <div className="plans-access-grid">
          <article><h3>Individual course</h3><p>One-time payment. Course access duration and terms are shown when confirmed.</p></article>
          <article><h3>Complete bundle</h3><p>One-time payment for the included courses. Bundle access terms must be published before enrollment.</p></article>
          <article><h3>Membership</h3><p>Recurring subscription with its own defined access and renewal terms. Enrollment remains unavailable until those terms are confirmed and subscription checkout is implemented.</p></article>
        </div>
      </section>

      <section className="plans-faq-section" aria-labelledby="plans-faq-title">
        <div className="plans-section-heading">
          <span className="eyebrow">05 / FAQ</span>
          <h2 id="plans-faq-title">Questions about plans and payments</h2>
        </div>
        {planFaq.map((item) => (
          <details className="acc" key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <section className="plans-purchase-cta" aria-labelledby="plans-cta-title">
        <span className="eyebrow">06 / NEXT STEP</span>
        <h2 id="plans-cta-title">Ready to choose your course?</h2>
        <p>Compare individual courses{visibleBundles.length ? " or select a published one-time bundle" : ""}.</p>
        <div className="plans-cta-actions">
          <Link to="/courses" className="btn btn-outline">Browse individual courses</Link>
          {visibleBundles[0] && <Link to={`/checkout/bundle?bundle=${encodeURIComponent(visibleBundles[0].id)}`} className="btn btn-primary">Review {visibleBundles[0].title}</Link>}
        </div>
      </section>
    </main>
  );
}

export function ShowcasePage() {
  const assignmentProjects = readAdminData(adminStorageKeys.assignments, []).filter(
    (item) => item.showcasePublished && item.showcaseConsent && /^https?:\/\//i.test(item.url || ""),
  );
  const managedProjects = readAdminData(adminStorageKeys.showcaseProjects, []).filter(
    (item) => item.showcasePublished && item.showcaseConsent && /^https?:\/\//i.test(item.mediaUrl || item.url || ""),
  ).map((item) => ({ ...item, url: item.mediaUrl || item.url, notes: item.description || "" }));
  const published = [...assignmentProjects, ...managedProjects].map((item) => ({
    ...item,
    slug: `${String(item.title || "student-project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${String(item.id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    category: item.courseId === "short-form"
      ? "Short-Form & Social Media"
      : item.courseId === "long-form"
        ? "Long-Form & YouTube"
        : item.courseId === "film-doc"
          ? "Film & Documentary"
          : "Student projects",
    format: "Student project",
    goal: item.notes || "Creative goal not provided.",
    techniques: [],
    process: item.notes || "Process explanation not provided.",
    student: true,
  }));
  const [activeCategory, setActiveCategory] = useState("All projects");
  const brandProjects = showcase.map((project) => ({ ...project, student: false }));
  const allProjects = [...brandProjects, ...published];
  const categories = ["All projects", ...new Set(allProjects.map((project) => project.category).filter(Boolean))];
  const filteredProjects = activeCategory === "All projects"
    ? allProjects
    : allProjects.filter((project) => project.category === activeCategory);
  const featuredProject = published[0] || showcase[0];

  return (
    <main className="container public-page showcase-page">
      <PageIntro
        eyebrow="OWN THE FRAME / SHOWCASE"
        title="Selected work that tells a story."
        description="Explore projects shaped by editing, pacing, color, sound, and storytelling. Student work appears only with creator consent and instructor approval."
      />
      <section className="showcase-featured" aria-labelledby="featured-project-title">
        <div className={`showcase-featured-media${featuredProject.student ? " has-video" : ""}`}>
          {featuredProject.student ? (
            <ProjectPlayer project={featuredProject} />
          ) : (
            <div className="showcase-featured-art" data-swarm-media="portfolio-feature" data-swarm-trigger="viewport" data-swarm-replay>
              <span>OWN THE FRAME / CONCEPT STUDY</span><i /><b>01 — PRESSURE<br />02 — RELEASE</b>
              <button className="swarm-replay-control" type="button" data-swarm-replay-control aria-label="Replay the featured project visual rebuild">Replay</button>
            </div>
          )}
        </div>
        <div className="showcase-featured-copy">
          <span className="eyebrow">{featuredProject.student ? "FEATURED STUDENT PROJECT · SHARED WITH PERMISSION" : "FEATURED OWN THEME CONCEPT STUDY"}</span>
          <h2 id="featured-project-title">{featuredProject.title}</h2>
          <p>{featuredProject.goal}</p>
          <Link to={`/showcase/${featuredProject.slug}`} className="text-link">Explore the creative process <span aria-hidden="true">↗</span></Link>
          <small>{featuredProject.student ? "Student work · creator consent recorded" : "Concept study · not a student result"}</small>
        </div>
      </section>

      <section className="showcase-gallery-section" aria-labelledby="showcase-gallery-title">
        <div className="showcase-gallery-heading">
          <div><span className="eyebrow">PROJECT GALLERY</span><h2 id="showcase-gallery-title">Browse by format</h2></div>
          <span className="showcase-project-count">{filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}</span>
        </div>
        <div className="showcase-filters" role="group" aria-label="Filter projects by category">
          {categories.map((category) => (
            <button type="button" className={`catalog-filter${activeCategory === category ? " active" : ""}`} aria-pressed={activeCategory === category} key={category} onClick={() => setActiveCategory(category)}>{category}</button>
          ))}
        </div>
        {filteredProjects.length ? (
          <div className="showcase-project-grid">
            {filteredProjects.map((project, index) => {
              const swarmEligible = (!project.student && index < 2)
                || (project.student && project.slug === published[0]?.slug);
              return (
                <article className={`showcase-project-card${project.student ? " student-project" : ""}`} key={project.slug}>
                  <Link to={`/showcase/${project.slug}`} className="showcase-project-art" data-swarm-media={swarmEligible ? "portfolio-project" : undefined} data-swarm-trigger={swarmEligible ? "viewport" : undefined} data-swarm-replay={swarmEligible ? "" : undefined} aria-label={`View project ${project.title}`}>
                    <ProjectPlayer project={project} compact />
                    <span>{project.student ? "STUDENT PROJECT · SHARED WITH PERMISSION" : `OWN THE FRAME / STUDY 0${index + 1}`}</span><i /><b className="showcase-project-play" aria-hidden="true">▶</b>
                  </Link>
                  {swarmEligible && <button className="swarm-replay-control" type="button" data-swarm-replay-control aria-label={`Replay ${project.title} visual rebuild`}>Replay</button>}
                  <div className="showcase-project-copy">
                    <span className="eyebrow">{project.student ? `${project.category} · ${project.format}` : project.format}</span>
                    <h3><Link to={`/showcase/${project.slug}`}>{project.title}</Link></h3>
                    <p>{project.goal}</p>
                    {project.techniques?.length > 0 && <ul className="showcase-technique-list">{project.techniques.map((technique) => <li key={technique}>{technique}</li>)}</ul>}
                    {(project.duration || project.software) && <div className="showcase-project-meta">{[project.duration, project.software].filter(Boolean).join(" · ")}</div>}
                    <div className="showcase-project-meta">{project.student ? "Student contributor · shared with permission" : "Own Theme concept study"}</div>
                    <Link to={`/showcase/${project.slug}`} className="text-link">Project details <span aria-hidden="true">↗</span></Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="showcase-empty">
            <span className="eyebrow">STUDENT WORK</span>
            <h3>No student projects are published yet.</h3>
            <p>Student projects appear here only after the student gives permission and an instructor approves publication. Explore our labeled Own Theme concept studies in the meantime.</p>
            <button type="button" className="btn btn-outline" onClick={() => setActiveCategory("All projects")}>View all projects</button>
          </div>
        )}
      </section>

      <section className="showcase-before-after">
        <div><span className="eyebrow">OPTIONAL STUDY / BEFORE & AFTER</span><h2>One thought can change the cut.</h2><p>These are illustrative Own Theme brand studies, not student submissions.</p></div>
        <div className="showcase-ba-grid">
          {showcase.map((item) => (
            <article className="showcase-ba-card" key={item.slug}>
              <span className="eyebrow">{item.category}</span>
              <div className="ba before"><small>STARTING THOUGHT</small>{item.before}</div>
              <div className="ba after"><small>CREATIVE DIRECTION</small>{item.after}</div>
              <Link to={`/showcase/${item.slug}`} className="text-link">See the process <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
      </section>

      <div className="public-page-cta">
        <div><h2>Ready to make your own?</h2><p>Learn the decisions behind a distinctive edit.</p></div>
        <Link to="/courses" className="btn btn-primary">Explore courses <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
  );
}

export function ShowcaseProjectPage() {
  const { projectSlug } = useParams();
  const assignmentProjects = readAdminData(adminStorageKeys.assignments, [])
    .filter((item) => item.showcasePublished && item.showcaseConsent && /^https?:\/\//i.test(item.url || ""))
    .map((item) => ({
      ...item,
      slug: `${String(item.title || "student-project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${String(item.id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      category: item.courseId === "short-form"
        ? "Short-Form & Social Media"
        : item.courseId === "long-form"
          ? "Long-Form & YouTube"
          : item.courseId === "film-doc"
            ? "Film & Documentary"
            : "Student projects",
      student: true,
    }));
  const managedProjects = readAdminData(adminStorageKeys.showcaseProjects, [])
    .filter((item) => item.showcasePublished && item.showcaseConsent && /^https?:\/\//i.test(item.mediaUrl || item.url || ""))
    .map((item) => ({
      ...item,
      url: item.mediaUrl || item.url,
      notes: item.description || "",
      slug: `${String(item.title || "student-project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${String(item.id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      category: item.courseId === "short-form"
        ? "Short-Form & Social Media"
        : item.courseId === "long-form"
          ? "Long-Form & YouTube"
          : item.courseId === "film-doc"
            ? "Film & Documentary"
            : "Student projects",
      student: true,
    }));
  const studentProjects = [...assignmentProjects, ...managedProjects];
  const project = showcase.find((item) => item.slug === projectSlug)
    || studentProjects.find((item) => item.slug === projectSlug);

  if (!project) return <Navigate to="/showcase" replace />;
  const courseTitle = project.courseId
    ? courses.find((course) => course.id === project.courseId)?.title
    : project.category;

  return (
    <main className="container public-page showcase-detail-page">
      <Link to="/showcase" className="course-back-link">← Back to showcase</Link>
      <header className="showcase-detail-header">
        <span className="eyebrow">{project.student ? "STUDENT PROJECT · SHARED WITH PERMISSION" : "OWN THE FRAME · BRAND EXAMPLE"}</span>
        <h1>{project.title}</h1>
        <p>{project.goal || project.notes || "Creative goal not provided."}</p>
        <span className="showcase-detail-category">{courseTitle || "Own Theme project"}</span>
      </header>
      <section className="showcase-detail-media">
        {project.student ? (
          <ProjectPlayer project={project} />
        ) : (
          <div className="showcase-detail-brand-art" data-swarm-media="portfolio-project" data-swarm-trigger="viewport" data-swarm-replay><span>OWN THE FRAME / CREATIVE STUDY</span><i /><b>{project.title}</b><small>Illustrative brand example · final edit preview unavailable</small><button className="swarm-replay-control" type="button" data-swarm-replay-control aria-label={`Replay ${project.title} visual rebuild`}>Replay</button></div>
        )}
      </section>
      <div className="showcase-detail-columns">
        <section>
          <span className="eyebrow">CREATIVE GOAL</span>
          <h2>What the edit is trying to do</h2>
          <p>{project.goal || project.notes || "The creator has not supplied a goal statement."}</p>
          {project.before && project.after && (
            <div className="showcase-detail-comparison">
              <div className="ba before"><small>STARTING THOUGHT</small>{project.before}</div>
              <div className="ba after"><small>CREATIVE DIRECTION</small>{project.after}</div>
            </div>
          )}
        </section>
        <section>
          <span className="eyebrow">PROCESS & TECHNIQUES</span>
          <h2>How the choices shape it</h2>
          <p>{project.process || project.notes || "A process explanation has not been supplied."}</p>
          {project.techniques?.length > 0 && <ul className="showcase-technique-list">{project.techniques.map((technique) => <li key={technique}>{technique}</li>)}</ul>}
        </section>
      </div>
      <section className="showcase-creator-note">
        <span className="eyebrow">CREATOR</span>
        <p>{project.student ? "Student contributor · profile details are not published." : "Own Theme brand example · not a student result."}</p>
      </section>
      <div className="public-page-cta">
        <Link to="/courses" className="btn btn-primary">Explore courses</Link>
        <Link to="/showcase" className="btn btn-outline">Back to showcase</Link>
      </div>
    </main>
  );
}

export function AboutPage() {
  return (
    <main className="container public-page about-page">
      <PageIntro
        eyebrow="ABOUT OWN THEME"
        title="Learn the craft. Find your point of view."
        description="Own Theme is a video-editing education platform built around one idea: your style should come from your decisions, not somebody else’s preset."
      />
      <section className="about-story-section">
        <span className="eyebrow">WHY OWN THEME</span>
        <h2>Templates are useful tools. They are not a point of view.</h2>
        <p>A preset or transition can solve a small part of an edit, but relying on templates alone can leave the story, pacing, sound, and color making no deliberate argument. Own Theme teaches the decisions behind the tools, so editors can choose when a template helps—and when to make another choice.</p>
      </section>
      <section className="about-method">
        <span className="eyebrow">THE TEACHING PHILOSOPHY</span>
        <h2>A method for making your own theme</h2>
        <p>
          The Theme Stack brings premise, rhythm, color, sound, type and motion,
          and signature into every course. Use it to make your choices
          intentional—and your next edit unmistakably yours.
        </p>
      </section>
      <section className="about-stack-section">
        <span className="eyebrow">THE THEME STACK</span>
        <h2>Six creative elements. One connected edit.</h2>
        <div className="about-stack-grid">
          {[
            ["01", "Premise", "What is this about, and what should the viewer feel?"],
            ["02", "Rhythm", "How long do you hold a shot, and when do you cut?"],
            ["03", "Color", "What visual temperature supports the story?"],
            ["04", "Sound", "What do you hear—and where does silence belong?"],
            ["05", "Type & Motion", "How do words and graphics move through the frame?"],
            ["06", "Signature", "What choices make the work recognizable as yours?"],
          ].map(([number, title, description]) => (
            <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>
          ))}
        </div>
      </section>
      <section className="about-team-section" aria-labelledby="about-team-title">
        <div className="about-team-heading">
          <span className="eyebrow">THE PEOPLE BEHIND OWN THEME</span>
          <h2 id="about-team-title">Meet the people shaping the studio.</h2>
        </div>
        <div className="about-team-grid">
          <article className="about-panel">
            <div className="avatar" aria-hidden="true">A</div>
            <div>
              <span className="eyebrow">FOUNDED BY</span>
              <h3>Abdulhafiz Zekeriya</h3>
              <p>Video editor and course creator. The Own Theme lessons focus on the creative decision first and the software steps second. Additional biography and credentials will be added when provided.</p>
              <div className="pills">
                <span className="pill">Premiere Pro</span>
                <span className="pill">After Effects</span>
                <span className="pill">DaVinci Resolve</span>
                <span className="pill">CapCut</span>
              </div>
            </div>
          </article>
          <article className="about-team-coming">
            <span className="about-team-coming-mark" aria-hidden="true">OT</span>
            <span className="eyebrow">MORE TEAM PROFILES</span>
            <h3>Coming soon</h3>
            <p>We’ll introduce additional team members here once their names and roles are ready.</p>
          </article>
        </div>
      </section>
      <section className="about-process-section">
        <div className="plans-section-heading">
          <span className="eyebrow">THE LEARNING PROCESS</span>
          <h2>Learn. Practice. Get feedback. Revise.</h2>
          <p>Build a skill through making, reflection, and another pass.</p>
        </div>
        <ol className="about-process-steps">
          {[
            ["01", "Learn", "Study a creative principle and see how it changes an edit."],
            ["02", "Practice", "Apply the idea to a guided exercise or your own project."],
            ["03", "Submit", "Share an assignment for instructor review when that course activity is available."],
            ["04", "Receive feedback", "Use specific feedback to understand what is working and what can be clearer."],
            ["05", "Revise", "Make another pass and keep developing your own visual language."],
          ].map(([number, title, description]) => (
            <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></li>
          ))}
        </ol>
      </section>
      <section className="about-final-cta">
        <h2>Ready to make more intentional edits?</h2>
        <p>Find the course that matches the stories you want to tell.</p>
        <Link to="/courses" className="btn btn-primary">Explore courses <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}

export function FreeMiniCoursePage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const enrolled = hasFreeCourseAccess(currentUser?.email);
  const outcomes = [
    "Practice the Own Theme approach to making editing decisions.",
    "Notice how voice and sound shape an edit.",
    "Draft a first Theme Sheet for your creative direction.",
  ];

  function beginFreeCourse() {
    if (currentUser?.email) {
      enrollInFreeCourse(currentUser.email);
      navigate("/free-course/lesson/1");
      return;
    }
    navigate("/signup", { state: { from: "/free-course/lesson/1" } });
  }

  return (
    <main className="container public-page free-course-page">
      <PageIntro
        eyebrow="FREE MINI-COURSE · VOICE"
        title="Start with Voice."
        description="Try the Own Theme approach before choosing a full course. Lesson titles, final learning outcomes, and the enrollment/access rules are awaiting confirmation."
      />
      <section className="free-course-intro-panel">
        <div className="free-course-intro-art" aria-hidden="true"><span>VOICE</span><i /><b>FREE<br />PREVIEW</b></div>
        <div className="free-course-intro-copy">
          <span className="eyebrow">A FIRST TASTE OF THE METHOD</span>
          <h2>Make creative choices with intention.</h2>
          <p>Explore an introduction to the Own Theme approach, with a focus on voice, sound, and starting a Theme Sheet. The final course content and access conditions still need customer confirmation.</p>
          <div className="free-course-enroll-actions">
            <button type="button" className="btn btn-primary" onClick={beginFreeCourse}>{enrolled ? "Continue free preview" : currentUser ? "Enroll in free preview" : "Create account & enroll"} <span aria-hidden="true">↗</span></button>
            {!currentUser && <Link to="/login" state={{ from: "/free-course/lesson/1" }} className="text-link">Already have an account? Sign in <span aria-hidden="true">↗</span></Link>}
            {currentUser && <span className="free-course-account">Signed in as {currentUser.email}</span>}
          </div>
        </div>
      </section>

      <section className="free-course-outcomes">
        <div className="plans-section-heading">
          <span className="eyebrow">LEARNING OUTCOMES · PROPOSED</span>
          <h2>What this introduction is intended to explore</h2>
          <p>These are based on the current course description and should be confirmed before launch.</p>
        </div>
        <div className="free-course-outcome-grid">
          {outcomes.map((outcome, index) => <article key={outcome}><span>0{index + 1}</span><p>{outcome}</p></article>)}
        </div>
      </section>

      <section className="free-course-lessons" aria-labelledby="free-course-lessons-title">
        <div className="plans-section-heading">
          <span className="eyebrow">LESSON LIST · PENDING CONFIRMATION</span>
          <h2 id="free-course-lessons-title">Eight lesson slots</h2>
          <p>Lesson titles and media are not yet confirmed. These numbered entries are placeholders, not published lesson descriptions.</p>
        </div>
        <ol>
          {Array.from({ length: 8 }, (_, index) => (
            <li key={index}><span className="free-lesson-number">{String(index + 1).padStart(2, "0")}</span><span>Lesson {index + 1} · title and content to be confirmed</span><span className="free-lesson-status">Coming soon</span></li>
          ))}
        </ol>
      </section>

      <section className="free-course-access-note">
        <span className="eyebrow">ACCESS & ENROLLMENT</span>
        <p>For this browser-only demo, creating an account or signing in records a local free-course enrollment and opens a placeholder lesson player. Production access requirements and course media are not configured.</p>
      </section>
    </main>
  );
}

export function FreeCourseLessonPage() {
  const { lessonNumber } = useParams();
  const lessonIndex = Number(lessonNumber);
  const currentUser = getCurrentUser();

  if (!Number.isInteger(lessonIndex) || lessonIndex < 1 || lessonIndex > 8) {
    return <Navigate to="/free-course" replace />;
  }
  if (!currentUser?.email || !hasFreeCourseAccess(currentUser.email)) {
    return <Navigate to="/free-course" replace />;
  }

  return (
    <main className="container free-course-player-page">
      <Link to="/free-course" className="course-back-link">← Free mini-course overview</Link>
      <header className="free-course-player-heading">
        <span className="eyebrow">FREE VOICE MINI-COURSE · LESSON {String(lessonIndex).padStart(2, "0")} OF 08</span>
        <h1>Lesson content pending confirmation</h1>
        <p>This placeholder player is shown after demo enrollment. The lesson title, video, and access conditions need confirmation before the course is ready for learners.</p>
      </header>
      <section className="free-course-player-placeholder" aria-label="Lesson video placeholder">
        <span className="free-player-icon" aria-hidden="true">▶</span>
        <h2>Lesson player</h2>
        <p>Video lesson not provided yet</p>
      </section>
      <nav className="free-course-player-nav" aria-label="Mini-course lessons">
        {lessonIndex > 1 && <Link to={`/free-course/lesson/${lessonIndex - 1}`} className="btn btn-outline">Previous lesson</Link>}
        <span>Lesson {lessonIndex} of 8 · outline pending confirmation</span>
        {lessonIndex < 8 && <Link to={`/free-course/lesson/${lessonIndex + 1}`} className="btn btn-primary">Next lesson</Link>}
      </nav>
    </main>
  );
}

export function FaqPage() {
  const settings = readAdminData(adminStorageKeys.settings, {});
  const supportEmail = settings.supportEmail?.trim();
  const supportPhone = settings.supportPhone?.trim();
  const supportQuestions = [
    { q: "How do I enroll in a course?", a: "Choose a course or one-time bundle and follow its course page. Checkout in this preview does not take payment or verify enrollment." },
    { q: "My video will not play. What should I do?", a: "There are no hosted course videos connected in this preview. When lessons are available, check your connection and supported browser first; contact support with the lesson title and browser if playback still fails." },
    { q: "How long do I have access to a course?", a: "Published individual course purchases include lifetime access. The current demo does not connect real accounts or verify purchased access." },
    { q: "I have a payment issue. Was I charged?", a: "No payment provider is connected to this preview. It cannot charge you or verify a transaction. If a real charge occurs after launch, use the transaction reference and contact the configured support address." },
    { q: "How do I cancel a subscription?", a: "Subscription enrollment and billing are not available in this preview. Cancellation and renewal instructions will be published before any recurring plan opens." },
    { q: "How do I submit an assignment?", a: "Assignment submission is available only in the signed-in student preview for eligible course lessons. Access and submission availability depend on course enrollment." },
    { q: "When will I receive instructor feedback?", a: "Feedback timing has not been specified. Submitted work and feedback tools are demo data and do not send real instructor notifications." },
    ...faq,
  ];
  return (
    <main className="container public-page faq-page">
      <PageIntro
        eyebrow="FAQ & SUPPORT"
        title="Help for your learning journey."
        description="Find answers about enrollment, course access, playback, payments, assignments, and feedback. Support email is configured by the site administrator."
      />
      <div className="faq-list">
        {supportQuestions.map((item) => (
          <details className="acc" key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
      <section className="support-panel">
        <div>
          <span className="eyebrow">CONTACT SUPPORT</span>
          <h2>Still need a hand?</h2>
          <p>{supportEmail ? <>Email: <a className="footer-link" href={`mailto:${supportEmail}`}>{supportEmail}</a></> : "Business contact details have not been configured yet. Add a support email in Admin → Site content & settings to enable email contact."}</p>
          {supportPhone && <p>Phone: <a className="footer-link" href={`tel:${supportPhone}`}>{supportPhone}</a></p>}
        </div>
        <SupportContactForm supportEmail={supportEmail} />
      </section>
    </main>
  );
}

export function ContactPage() {
  const settings = readAdminData(adminStorageKeys.settings, {});
  const supportEmail = settings.supportEmail?.trim();
  const supportPhone = settings.supportPhone?.trim();

  return (
    <main className="container public-page">
      <PageIntro
        eyebrow="CONTACT"
        title="Let’s talk about your next edit."
        description="Send a question about a course, enrollment, or the learning experience. The configured support email is the business contact method for this preview."
      />
      <div className="contact-business-panel">
        <span className="contact-mark" aria-hidden="true">OT</span>
        <div><h2>Own Theme support</h2><p>{supportEmail ? <>Email <a className="footer-link" href={`mailto:${supportEmail}`}>{supportEmail}</a></> : "Business email and contact details are not configured. Add the support email in Admin → Site content & settings."}</p>{supportPhone && <p>Phone: <a className="footer-link" href={`tel:${supportPhone}`}>{supportPhone}</a></p>}</div>
      </div>
      <section className="contact-panel">
        <h2>Contact form</h2>
        <p>The form opens your email app when a support address is configured. It does not send or store messages on this website.</p>
        <SupportContactForm supportEmail={supportEmail} />
        <Link to="/support" className="btn btn-outline">Browse support topics</Link>
      </section>
    </main>
  );
}
