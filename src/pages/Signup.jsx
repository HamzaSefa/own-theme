import { useState } from "react";
import { Link } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    alert("Signup works in Phase 2, when we connect Supabase!");
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        <p className="sub">Start with the free Voice mini-course.</p>

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
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}