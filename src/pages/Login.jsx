import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { student } from "../data/courses";
import { enrollInFreeCourse, setCurrentUser } from "../data/studentPortal";

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
    const user = { name: student.name, email: email.trim() };
    const destination = location.state?.from || "/app";
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
        <p className="sub">Log in to continue your course. Demo sign-in accepts any email and password.</p>

        <div className="field">
          <label>Email</label>
          <input type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </div>

        <button type="submit" className="btn btn-primary btn-block">Log in</button>
        <div className="demo-login-options" aria-label="Quick demo sign-in">
          <span className="demo-login-label">QUICK DEMO ACCESS</span>
          <button type="button" className="btn btn-outline btn-block" onClick={fillStudentCredentials}>
            Fill student demo credentials
          </button>
          <button type="button" className="btn btn-outline btn-block" onClick={signInAsDemoAdmin}>
            Sign in to admin preview
          </button>
          <p>These shortcuts use local demo profiles; passwords are not verified. Do not use real or sensitive data.</p>
        </div>
        <p className="auth-switch"><Link to="/forgot-password">Forgot your password?</Link></p>
        <p className="auth-switch">No account? <Link to="/signup" state={location.state}>Sign up</Link></p>
      </form>
    </div>
  );
}