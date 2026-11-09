import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false); // is the mobile menu open?
  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="logo" onClick={close}>Own<span>Theme</span></Link>

        <button className="menu-btn" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
          {open ? "✕" : "☰"}
        </button>

        <nav className={open ? "nav-links open" : "nav-links"}>
          <a href="/#courses" onClick={close}>Courses</a>
          <a href="/#pricing" onClick={close}>Pricing</a>
          <Link to="/login" onClick={close}>Login</Link>
          <Link to="/dashboard" onClick={close}>Dashboard</Link>
          <Link to="/admin" onClick={close}>Admin</Link>
          <Link to="/signup" className="btn btn-primary" onClick={close}>Sign up</Link>
        </nav>
      </div>
    </header>
  );
}