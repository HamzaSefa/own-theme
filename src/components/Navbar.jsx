import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { adminStorageKeys, readAdminData } from "../data/adminWorkspace";
import { getCurrentUser } from "../data/studentPortal";

export default function Navbar() {
  const [open, setOpen] = useState(false); // is the mobile menu open?
  const logoUrl = readAdminData(adminStorageKeys.settings, {}).brandLogoUrl;
  const user = getCurrentUser();
  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="logo" onClick={close}>{/^https?:\/\//i.test(logoUrl || "") ? <img className="brand-logo-image" src={logoUrl} alt="Own Theme" /> : <>Own<span>Theme</span></>}</Link>

        <button className="menu-btn" type="button" aria-label="Toggle menu" aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>
          {open ? "✕" : "☰"}
        </button>

        <nav id="primary-navigation" className={open ? "nav-links open" : "nav-links"}>
          <NavLink to="/" end onClick={close}>Home</NavLink>
          <NavLink to="/courses" onClick={close}>Courses</NavLink>
          <NavLink to="/showcase" onClick={close}>Showcase</NavLink>
          <NavLink to="/about" onClick={close}>About</NavLink>
          {user
            ? <Link to={user.role === "admin" ? "/admin" : "/app"} className="nav-account-link" onClick={close}>
                {user.role === "admin" ? "Admin workspace" : "Learning space"}
              </Link>
            : <NavLink to="/login" onClick={close}>Log In</NavLink>}
          <Link to={user ? (user.role === "admin" ? "/admin" : "/app") : "/courses"} className="btn btn-primary nav-cta" onClick={close}>
            {user ? "Continue learning" : "Explore Courses"}
          </Link>
        </nav>
      </div>
    </header>
  );
}