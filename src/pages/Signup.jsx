import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ValidationError } from "../components/States";
import { enrollInFreeCourse, getInternalReturnPath, setCurrentUser } from "../data/studentPortal";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter your full name.");
      return;
    }
    const user = { name: trimmedName, email: email.trim(), role: "student" };
    setCurrentUser(user);
    const destination = getInternalReturnPath(location.state?.from);
    if (destination.startsWith("/free-course/lesson/")) enrollInFreeCourse(user.email);
    navigate(destination, { replace: true });
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        <p className="sub">Create a local preview profile to explore the learning space. This does not create a real account.</p>

        <div className="field">
          <label htmlFor="signup-name">Full name</label>
          <input id="signup-name" name="name" type="text" autoComplete="name" required value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Your name" />
        </div>
        <div className="field">
          <label htmlFor="signup-email">Email</label>
          <input id="signup-email" name="email" type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>

        <button type="submit" className="btn btn-primary btn-block">Create account</button>
        <ValidationError>{error}</ValidationError>
        <p className="auth-switch">Already have an account? <Link to="/login" state={location.state}>Log in</Link></p>
      </form>
    </div>
  );
}