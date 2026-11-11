import { Link } from "react-router-dom";
import { adminStorageKeys, readAdminData } from "../data/adminWorkspace";
import { getCurrentUser } from "../data/studentPortal";

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
    links: [],
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
    links: [],
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
  const user = getCurrentUser();
  const settings = readAdminData(adminStorageKeys.settings, {});
  const socialLinks = [
    { label: "Instagram", href: settings.socialLinks?.instagram },
    { label: "YouTube", href: settings.socialLinks?.youtube },
  ].filter((item) => /^https?:\/\//i.test(item.href || ""));
  const legalLinks = [
    { label: settings.legalContent?.privacy?.trim() ? "Privacy policy" : "Privacy policy · pending review", to: "/privacy" },
    { label: settings.legalContent?.terms?.trim() ? "Terms" : "Terms · pending review", to: "/terms" },
    { label: settings.legalContent?.refund?.trim() ? "Refund policy" : "Refund policy · pending review", to: "/refund-policy" },
  ];
  const logoUrl = /^https?:\/\//i.test(settings.brandLogoUrl || "") ? settings.brandLogoUrl : "";

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="logo">
              {logoUrl ? <img className="brand-logo-image" src={logoUrl} alt="Own Theme" /> : <>Own<span>Theme</span></>}
            </Link>
            <p>
              Learn the craft. Find your point of view. Make work that feels
              unmistakably yours.
            </p>
            <Link to="/courses" className="footer-cta">
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
                {(group.title === "Connect"
                  ? [...socialLinks, ...legalLinks]
                  : group.title === "Learn"
                    ? [
                        { label: "Free mini-course", to: "/free-course" },
                        {
                          label: user?.role === "admin" ? "Admin workspace" : "Learning space",
                          to: user?.role === "admin" ? "/admin" : user ? "/app" : "/login",
                        },
                        ...(!user ? [{ label: "Create an account", to: "/register" }] : []),
                      ]
                    : group.links).map((link) => (
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
