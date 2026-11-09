import { useState } from "react";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault(); // stops the page from reloading
    alert("Login works in Phase 2, when we connect Supabase!");
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p className="sub">Log in to continue your course.</p>

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
        <p className="auth-switch">No account? <Link to="/signup">Sign up</Link></p>
      </form>
    </div>
  );
}