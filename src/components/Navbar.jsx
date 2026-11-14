import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { adminStorageKeys, readAdminData } from "../data/adminWorkspace";
import { getCurrentUser } from "../data/studentPortal";
import { getCurrentEnrollments } from "../data/courses";

export default function Navbar() {
  const [open, setOpen] = useState(false); // is the mobile menu open?
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const accountTriggerRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const logoUrl = readAdminData(adminStorageKeys.settings, {}).brandLogoUrl;
  const user = getCurrentUser();
  const hasEnrollment = user?.role === "student" && getCurrentEnrollments().length > 0;
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

        <nav id="primary-navigation" className={open ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
          <div className="nav-link-capsule">
            <NavLink to="/" end onClick={close}>Home</NavLink>
            <NavLink to="/courses" onClick={close}>Courses</NavLink>
            <NavLink to="/showcase" onClick={close}>Showcase</NavLink>
            <NavLink to="/about" onClick={close}>Our Method</NavLink>
          </div>
          {user
            ? <div className="nav-account-menu" ref={accountMenuRef}>
                <button
                  ref={accountTriggerRef}
                  type="button"
                  className="nav-account-trigger"
                  aria-expanded={accountOpen}
                  aria-controls="nav-account-menu"
                  onClick={() => setAccountOpen((current) => !current)}
                >
                  Account <span className="nav-account-caret" aria-hidden="true">⌄</span>
                </button>
                <div className="nav-account-menu-items" id="nav-account-menu" hidden={!accountOpen}>
                  <Link to={user.role === "admin" ? "/admin" : "/app"} onClick={close}>
                    {user.role === "admin" ? "Admin workspace" : "Learning space"}
                  </Link>
                </div>
              </div>
            : <NavLink to="/login" onClick={close}>Log In</NavLink>}
          <Link to={hasEnrollment ? "/app" : "/courses"} className="btn btn-primary nav-cta" onClick={close}>
            {hasEnrollment ? "Continue learning" : "Explore Courses"}
            <span className="nav-cta-arrow" aria-hidden="true">↗</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}