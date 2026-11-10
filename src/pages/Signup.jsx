import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { enrollInFreeCourse, setCurrentUser } from "../data/studentPortal";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const user = { name: name.trim(), email: email.trim() };
    setCurrentUser(user);
    const destination = location.state?.from || "/app";
    if (destination.startsWith("/free-course/lesson/")) enrollInFreeCourse(user.email);
    navigate(destination, { replace: true });
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        <p className="sub">Start with the free Voice mini-course. This preview stores your profile in this browser.</p>

        <div className="field">
          <label>Full name</label>
          <input type="text" required value={name}
            onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required minLength={6} value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        </div>

        <button type="submit" className="btn btn-primary btn-block">Create account</button>
        <p className="auth-switch">Already have an account? <Link to="/login" state={location.state}>Log in</Link></p>
      </form>
    </div>
  );
}