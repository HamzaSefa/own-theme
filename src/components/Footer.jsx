import { Link } from "react-router-dom";

const linkGroups = [
  {
    title: "Explore",
    links: [
      { label: "Courses", to: "/courses" },
      { label: "Bundles & membership", to: "/plans" },
      { label: "Showcase", to: "/showcase" },
      { label: "About Own Theme", to: "/about" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Free mini-course", to: "/free-course" },
      { label: "Student dashboard", to: "/app" },
      { label: "Sign in", to: "/login" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ & support", to: "/support" },
      { label: "Contact Own Theme", to: "/contact" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Instagram · coming soon" },
      { label: "YouTube · coming soon" },
      { label: "Privacy policy · pending review", to: "/privacy" },
      { label: "Terms · pending review", to: "/terms" },
      { label: "Refund policy · pending review", to: "/refund-policy" },
    ],
  },
];

function FooterLink({ href, to, children }) {
  const className = "footer-link";

  return to ? (
    <Link className={className} to={to}>
      {children}
    </Link>
  ) : href ? (
    <a className={className} href={href}>
      {children}
    </a>
  ) : (
    <span>{children}</span>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="logo">
              Own<span>Theme</span>
            </Link>
            <p>
              Learn the craft. Find your point of view. Make work that feels
              unmistakably yours.
            </p>
            <Link to="/#courses" className="footer-cta">
              Find your course <span aria-hidden="true">↗</span>
            </Link>
          </div>

          {linkGroups.map((group) => (
            <nav
              className="footer-nav"
              aria-label={group.title}
              key={group.title}
            >
              <h2>{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href} to={link.to}>
                      {link.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Own Theme. All rights reserved.</span>
          <span>Made for editors with a point of view.</span>
        </div>
      </div>
    </footer>
  );
}
