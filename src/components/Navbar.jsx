import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="logo">Own<span>Theme</span></Link>
        <nav className="nav-links">
          <a href="/#courses">Courses</a>
          <Link to="/login">Login</Link>
          <Link to="/signup" className="btn btn-primary">Sign up</Link>
        </nav>
      </div>
    </header>
  );
}