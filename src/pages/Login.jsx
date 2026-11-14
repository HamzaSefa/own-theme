import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { enrollInFreeCourse, getInternalReturnPath, setCurrentUser } from "../data/studentPortal";

const ADMIN_PREVIEW_KEY = "ownTheme_admin_preview";
const demoAccounts = {
  student: {
    name: "Demo Student",
    email: "student@owntheme.demo",
    password: "student-demo",
  },
  admin: {
    name: "Demo Admin",
    email: "admin@owntheme.demo",
    password: "admin-demo",
  },
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function finishLogin(user, destination) {
    setCurrentUser(user);
    if (destination.startsWith("/free-course/lesson/")) enrollInFreeCourse(user.email);
    navigate(destination, { replace: true });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const normalizedEmail = email.trim();
    const isDemoStudent = normalizedEmail.toLowerCase() === demoAccounts.student.email;
    const name = isDemoStudent
      ? demoAccounts.student.name
      : normalizedEmail.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    const user = { name, email: normalizedEmail, role: "student" };
    const destination = getInternalReturnPath(location.state?.from);
    finishLogin(user, destination);
  }

  function fillStudentCredentials() {
    setEmail(demoAccounts.student.email);
    setPassword(demoAccounts.student.password);
  }

  function signInAsDemoAdmin() {
    const account = demoAccounts.admin;
    setEmail(account.email);
    setPassword(account.password);
    localStorage.setItem(ADMIN_PREVIEW_KEY, "true");
    finishLogin({ name: account.name, email: account.email, role: "admin" }, "/admin");
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p className="sub">This preview does not verify passwords. Use the demo student shortcut, or enter an email to create a temporary student session on this device.</p>
        {location.state?.from && (
          <p className="auth-preview-notice">Continue to the page you requested after signing in.</p>
        )}

        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input type="email" autoComplete="email" required value={email}
            id="login-email" onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password (demo only)</label>
          <input type="password" autoComplete="current-password" value={password}
            id="login-password" onChange={(e) => setPassword(e.target.value)} placeholder="Optional in this preview" />
        </div>

        <button type="submit" className="btn btn-primary btn-block">Continue to learning space</button>
        <div className="demo-login-options" aria-label="Quick demo sign-in">
          <span className="demo-login-label">QUICK DEMO ACCESS</span>
          <button type="button" className="btn btn-outline btn-block" onClick={fillStudentCredentials}>
            Fill student demo credentials
          </button>
          <button type="button" className="btn btn-outline btn-block" onClick={signInAsDemoAdmin}>
            Sign in to admin preview
          </button>
          <p>Demo shortcuts do not verify passwords. Profiles and learning data stay in this browser; do not use sensitive information.</p>
        </div>
        <p className="auth-switch"><Link to="/forgot-password">Forgot your password?</Link></p>
        <p className="auth-switch">No account? <Link to="/signup" state={location.state}>Sign up</Link></p>
      </form>
    </div>
  );
}