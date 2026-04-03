import { CRStatus, STATUS_CONFIG } from '@/types/cr';

export default function StatusPill({ status }: { status: CRStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className="status-pill"
      style={{
        backgroundColor: `hsl(var(--${config.color}) / 0.12)`,
        color: `hsl(var(--${config.color}))`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: `hsl(var(--${config.color}))` }}
      />
      {config.label}
    </span>
  );
}
