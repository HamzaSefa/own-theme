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

        <button className="menu-btn" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
          {open ? "✕" : "☰"}
        </button>

        <nav className={open ? "nav-links open" : "nav-links"}>
          <NavLink to="/" end onClick={close}>Home</NavLink>
          {user
            ? <Link to={user.role === "admin" ? "/admin" : "/app"} className="nav-account-link" onClick={close}>
                {user.role === "admin" ? "Admin workspace" : "Learning space"}
              </Link>
            : <NavLink to="/login" onClick={close}>Sign in</NavLink>}
          <Link to={user ? (user.role === "admin" ? "/admin" : "/app") : "/signup"} className="btn btn-primary nav-cta" onClick={close}>
            {user ? (user.role === "admin" ? "Open workspace" : "Continue learning") : "Create account"}
          </Link>
        </nav>
      </div>
    </header>
  );
}