import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { courses, enroll } from "../data/courses";
import { prices, bundlePrice } from "../data/admin";

const methods = [
  { id: "mobile", label: "📱 Mobile money (e.g. Telebirr)" },
  { id: "card", label: "💳 Card" },
  { id: "bank", label: "🏦 Bank transfer" },
];

export default function Checkout() {
  const { courseId } = useParams();
  const isBundle = courseId === "bundle";
  const course = isBundle
  ? { id: "bundle", title: "Complete Bundle (all 3 courses)" }
  : courses.find((c) => c.id === courseId);
  const [method, setMethod] = useState("mobile");
  const [step, setStep] = useState("form"); // "form" -> "processing" -> "done"

  if (!course) return <Navigate to="/" />;
  const price = isBundle ? bundlePrice : prices[courseId];

  function pay(e) {
    e.preventDefault();
    setStep("processing");
    // Pretend the bank takes 2 seconds, then unlock the course
    setTimeout(() => {
      if (isBundle) {
  courses.forEach((c) => enroll(c.id));
} else {
  enroll(courseId);
}
      setStep("done");
    }, 2000);
  }

  if (step === "processing") {
    return (
      <div className="center-box">
        <div className="spinner" />
        <h1>Processing payment...</h1>
        <p>Please don't close this page.</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="center-box">
        <div className="success-icon">✓</div>
        <h1>Payment successful!</h1>
        <p>You now have access to <strong>{course.title}</strong>. A receipt has been sent to your email.</p>
        <Link to="/dashboard" className="btn btn-primary">Go to my dashboard</Link>
      </div>
    );
  }

  return (
    <form className="checkout" onSubmit={pay}>
      <div className="panel">
        <h2>Payment details</h2>
        <div className="field">
          <label>Email for receipt</label>
          <input type="email" required defaultValue="abdulhafiz@email.com" />
        </div>
        <label style={{ display: "block", fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>
          Payment method
        </label>
        <div className="method-row">
          {methods.map((m) => (
            <button
              type="button"
              key={m.id}
              className={method === m.id ? "method on" : "method"}
              onClick={() => setMethod(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button type="submit" className="btn btn-primary btn-block">Pay ${price}</button>
        <p className="demo-note">🔒 Demo only. No real payment is taken.</p>
      </div>

      <div className="panel">
        <h2>Order summary</h2>
        <div className="sum-row"><span>{course.title}</span><span>${price}</span></div>
        <div className="sum-row"><span>Fees</span><span>$0</span></div>
        <div className="sum-row total"><span>Total</span><span>${price}</span></div>
        <p className="demo-note" style={{ textAlign: "left" }}>Instant access after payment.</p>
      </div>
    </form>
  );
}