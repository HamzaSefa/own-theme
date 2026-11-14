import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { adminStorageKeys, readAdminData } from "../data/adminWorkspace";
import { getCurrentUser } from "../data/studentPortal";
import { getCurrentEnrollments } from "../data/courses";

export default function Navbar() {
  const [open, setOpen] = useState(false); // is the mobile menu open?
  const [accountOpen, setAccountOpen] = useState(false);
  const [indicator, setIndicator] = useState({ x: 0, y: 0, width: 0, visible: false });
  const [indicatorReady, setIndicatorReady] = useState(false);
  const location = useLocation();
  const navRef = useRef(null);
  const indicatorReadyRef = useRef(false);
  const accountMenuRef = useRef(null);
  const accountTriggerRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const logoUrl = readAdminData(adminStorageKeys.settings, {}).brandLogoUrl;
  const user = getCurrentUser();
  const hasEnrollment = user?.role === "student" && getCurrentEnrollments().length > 0;
  const isAccountRoute = /^\/(login|signup|register|forgot-password|reset-password)(\/|$)/.test(location.pathname);
  const close = () => {
    setOpen(false);
    setAccountOpen(false);
  };

  useEffect(() => {
    if (!open && !accountOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key !== "Escape") return;
      if (accountOpen) {
        setAccountOpen(false);
        accountTriggerRef.current?.focus();
      } else {
        setOpen(false);
        menuTriggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, accountOpen]);

  useEffect(() => {
    if (!accountOpen) return undefined;
    function handleOutsideClick(event) {
      if (!accountMenuRef.current?.contains(event.target)) setAccountOpen(false);
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [accountOpen]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;

    function measureIndicator() {
      const activeLink = nav.querySelector(".nav-link-capsule a.active");
      if (!activeLink || activeLink.getClientRects().length === 0) {
        setIndicator((current) => current.visible ? { ...current, visible: false } : current);
        return;
      }

      const label = activeLink.querySelector(".nav-item-label") || activeLink;
      const navBounds = nav.getBoundingClientRect();
      const linkBounds = activeLink.getBoundingClientRect();
      const labelBounds = label.getBoundingClientRect();
      const inset = Number.parseFloat(getComputedStyle(nav).getPropertyValue("--nav-indicator-bottom")) || 5;
      const next = {
        x: labelBounds.left - navBounds.left,
        y: linkBounds.bottom - navBounds.top - 2 - inset,
        width: labelBounds.width,
        visible: true,
      };

      setIndicator((current) => (
        current.visible
        && Math.abs(current.x - next.x) < 0.5
        && Math.abs(current.y - next.y) < 0.5
        && Math.abs(current.width - next.width) < 0.5
          ? current
          : next
      ));
      if (!indicatorReadyRef.current && document.fonts.status === "loaded") {
        indicatorReadyRef.current = true;
        requestAnimationFrame(() => setIndicatorReady(true));
      }
    }

    measureIndicator();
    document.fonts.ready.then(measureIndicator);
    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(measureIndicator);
    if (observer) {
      observer.observe(nav);
      nav.querySelectorAll(".nav-link-capsule").forEach((item) => observer.observe(item));
    }
    window.addEventListener("resize", measureIndicator);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measureIndicator);
    };
  }, [location.pathname, location.search, open]);

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="logo" aria-label="Own Theme home" onClick={close}>
          {/^https?:\/\//i.test(logoUrl || "")
            ? <img className="brand-logo-image" src={logoUrl} alt="Own Theme" />
            : <span className="nav-logo-lockup">
                <span className="logo-word">Own<span>Theme</span></span>
                <span className="logo-tagline">THE ART OF THE CUT</span>
              </span>}
        </Link>

        <button ref={menuTriggerRef} className="menu-btn" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>
          {open ? "✕" : "☰"}
        </button>

        <nav ref={navRef} id="primary-navigation" className={open ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
          <div className="nav-link-capsule">
            <NavLink to="/" end onClick={close}><span className="nav-item-label">Home</span></NavLink>
            <NavLink to="/courses" onClick={close}><span className="nav-item-label">Courses</span></NavLink>
            <NavLink to="/showcase" onClick={close}><span className="nav-item-label">Showcase</span></NavLink>
            <NavLink to="/about" onClick={close}><span className="nav-item-label">Our Method</span></NavLink>
          </div>
          {user
            ? <div className="nav-account-menu" ref={accountMenuRef}>
                <button
                  ref={accountTriggerRef}
                  type="button"
                  className={accountOpen ? "nav-account-trigger active" : "nav-account-trigger"}
                  aria-expanded={accountOpen}
                  aria-controls="nav-account-menu"
                  onClick={() => setAccountOpen((current) => !current)}
                >
                  <span className="nav-item-label">Account</span>
                  <span className="nav-account-caret" aria-hidden="true">⌄</span>
                </button>
                <div className="nav-account-menu-items" id="nav-account-menu" hidden={!accountOpen}>
                  <Link to={user.role === "admin" ? "/admin" : "/app"} onClick={close}>
                    {user.role === "admin" ? "Admin workspace" : "Learning space"}
                  </Link>
                </div>
              </div>
            : <NavLink
                to="/login"
                className={({ isActive }) => isActive || isAccountRoute ? "active" : ""}
                onClick={close}
              >
                <span className="nav-item-label">Log In</span>
              </NavLink>}
          <span
            className={indicatorReady ? "nav-active-indicator is-ready" : "nav-active-indicator"}
            aria-hidden="true"
            style={{
              width: `${indicator.width}px`,
              transform: `translate3d(${indicator.x}px, ${indicator.y}px, 0)`,
              visibility: indicator.visible ? "visible" : "hidden",
            }}
          />
          <Link to={hasEnrollment ? "/app" : "/courses"} className="btn btn-primary nav-cta" onClick={close}>
            {hasEnrollment ? "Continue learning" : "Explore Courses"}
            <span className="nav-cta-arrow" aria-hidden="true">↗</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}