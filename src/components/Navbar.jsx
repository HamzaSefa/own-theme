import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

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
          <NavLink to="/" end onClick={close}>Home</NavLink>
          <NavLink to="/courses" onClick={close}>Courses</NavLink>
          <NavLink to="/showcase" onClick={close}>Showcase</NavLink>
          <NavLink to="/about" onClick={close}>About</NavLink>
          <NavLink to="/login" onClick={close}>Log In</NavLink>
          <Link to="/courses" className="btn btn-primary nav-cta" onClick={close}>Explore Courses</Link>
        </nav>
      </div>
    </header>
  );
}