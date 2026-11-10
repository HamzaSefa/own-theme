import { useId } from "react";
import { Link } from "react-router-dom";

function StateAction({ to, onClick, children, className = "btn btn-outline" }) {
  if (!children) return null;
  return to
    ? <Link className={className} to={to}>{children}</Link>
    : onClick
      ? <button className={className} type="button" onClick={onClick}>{children}</button>
      : null;
}

export function LoadingState({ label = "Loading", variant = "page", count = 3 }) {
  return (
    <div className={`ui-state ui-state-loading ui-skeleton-${variant}`} role="status" aria-label={label} aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="ui-skeleton-card" key={`skeleton-${index}`}>
          <span className="ui-skeleton-line ui-skeleton-line-short" />
          <span className="ui-skeleton-line ui-skeleton-line-heading" />
          <span className="ui-skeleton-line" />
          <span className="ui-skeleton-line ui-skeleton-line-medium" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, actionTo, onAction, icon = "OT" }) {
  const titleId = useId();
  return (
    <section className="ui-state ui-state-empty" aria-labelledby={titleId}>
      <span className="ui-state-icon" aria-hidden="true">{icon}</span>
      <h2 id={titleId}>{title}</h2>
      {description && <p>{description}</p>}
      <StateAction to={actionTo} onClick={onAction}>{actionLabel}</StateAction>
    </section>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't complete this request. Try again.",
  onRetry,
  retryLabel = "Try again",
  network = false,
}) {
  return (
    <section className="ui-state ui-state-error" role="alert">
      <span className="ui-state-icon" aria-hidden="true">{network ? "↻" : "!"}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {onRetry && <StateAction onClick={onRetry} className="btn btn-outline">{retryLabel}</StateAction>}
    </section>
  );
}

export function NetworkErrorState({ onRetry, description = "Check your connection and try again." }) {
  return (
    <ErrorState
      title="Connection problem"
      description={description}
      network
      onRetry={onRetry}
      retryLabel="Retry"
    />
  );
}

export function AccessDeniedState({
  title = "Access denied",
  description = "You don't have permission to view this content.",
  actionLabel = "Go back",
  actionTo,
  onAction,
}) {
  return (
    <section className="ui-state ui-state-denied" role="alert">
      <span className="ui-state-icon" aria-hidden="true">×</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <StateAction to={actionTo} onClick={onAction}>{actionLabel}</StateAction>
    </section>
  );
}

export function ValidationError({ children, id }) {
  if (!children) return null;
  return <p className="ui-validation-error" role="alert" id={id}>{children}</p>;
}

export function SuccessMessage({ children }) {
  if (!children) return null;
  return <p className="ui-success-message" role="status">{children}</p>;
}
