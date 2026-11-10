import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminStorageKeys, readAdminData } from "../data/adminWorkspace";

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  function requestReset(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="container public-page account-support-page">
      <header className="public-page-intro">
        <span className="eyebrow">ACCOUNT SUPPORT</span>
        <h1>Forgot your password?</h1>
        <p>Password recovery email is not connected in this preview. No reset email will be sent.</p>
      </header>
      <form className="auth-card" onSubmit={requestReset}>
        <div className="field">
          <label htmlFor="recovery-email">Email address</label>
          <input id="recovery-email" type="email" required placeholder="you@email.com" />
        </div>
        <button className="btn btn-primary btn-block" type="submit">Request a reset link</button>
        {submitted && <p className="account-form-notice" role="status">Request recorded in this page only. Connect an email service to send password reset links.</p>}
        <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
      </form>
    </main>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  return (
    <main className="container public-page account-support-page">
      <header className="public-page-intro">
        <span className="eyebrow">ACCOUNT SUPPORT</span>
        <h1>Set a new password</h1>
        <p>{resetToken
          ? "A reset token was supplied, but token verification and password updates are not connected in this preview."
          : "Open a valid reset link to continue. Password reset links are not issued in this preview."}</p>
      </header>
      <section className="account-unavailable-panel">
        <h2>Password reset unavailable</h2>
        <p>No password has been changed. A secure reset requires a verified, time-limited token and a connected account service.</p>
        <Link to="/forgot-password" className="btn btn-outline">Request password help</Link>
      </section>
    </main>
  );
}

export function CheckoutStatusPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="container public-page account-support-page">
      <header className="public-page-intro">
        <span className="eyebrow">ORDER STATUS</span>
        <h1>Purchase status</h1>
        <p>Order status must be verified by the payment backend. This preview has no connected payment or order-status service.</p>
      </header>
      <section className="account-unavailable-panel" aria-live="polite">
        <span className="eyebrow">STATUS · NOT VERIFIED</span>
        <h2>{orderId ? "We couldn’t verify this order." : "No order reference provided."}</h2>
        {orderId && <p>Reference: {orderId}</p>}
        <p>No purchase success or failure is being reported. Contact support once a support address is configured, or return to course options.</p>
        <div className="hero-btns">
          <Link to="/plans" className="btn btn-primary">View plans</Link>
          <Link to="/support" className="btn btn-outline">Get support</Link>
        </div>
      </section>
    </main>
  );
}

const legalContent = {
  terms: {
    title: "Terms of service",
    description: "Terms of service have not yet been provided or approved.",
    note: "Before enrollment opens, publish reviewed terms covering account use, course access, acceptable use, intellectual property, cancellations, and contact details.",
  },
  privacy: {
    title: "Privacy policy",
    description: "A privacy policy has not yet been provided or approved.",
    note: "Before collecting real account or payment data, publish reviewed details about data collected, purpose, storage, processors, retention, user rights, and contact information.",
  },
  refund: {
    title: "Refund & cancellation policy",
    description: "Refund and cancellation terms have not yet been provided or approved.",
    note: "The preview does not take real payment. Publish reviewed refund terms for one-time course and bundle purchases, and separate cancellation and renewal terms before offering any subscription.",
  },
};

export function LegalInfoPage({ document }) {
  const defaultContent = legalContent[document];
  if (!defaultContent) return null;
  const siteSettings = readAdminData(adminStorageKeys.settings, {});
  const configuredText = siteSettings.legalContent?.[document]?.trim();
  const content = configuredText
    ? { ...defaultContent, description: "The current Own Theme policy is provided below." }
    : defaultContent;

  return (
    <main className="container public-page account-support-page">
      <header className="public-page-intro">
        <span className="eyebrow">OWN THEME · IMPORTANT INFORMATION</span>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
      </header>
      <section className="account-unavailable-panel">
        {configuredText ? (
          <div className="legal-document-copy"><h2>Information</h2>{configuredText.split(/\n{2,}/).map((paragraph, index) => <p key={`legal-${index}`}>{paragraph}</p>)}</div>
        ) : (
          <>
            <h2>Publication pending</h2>
            <p>{content.note}</p>
          </>
        )}
        <p>Legal copy should be reviewed and approved for your business before publication.</p>
        <Link to="/support" className="btn btn-outline">FAQ & support</Link>
      </section>
    </main>
  );
}
