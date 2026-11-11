import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-bottom">
        <Link to="/" className="logo">Own<span>Theme</span></Link>
        <span>© {new Date().getFullYear()} Own Theme</span>
      </div>
    </footer>
  );
}
