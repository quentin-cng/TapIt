import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow-label">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </header>
  );
}

export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div
      aria-label={label}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={Math.min(value, max)}
      className="progress-track"
      role="progressbar"
    >
      <span style={{ width: `${percentage}%` }} />
    </div>
  );
}
