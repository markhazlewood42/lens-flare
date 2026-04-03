import { DesignStage, DESIGN_STAGES } from '@/types/cr';

export default function DesignStageBadge({ stage, size = 'sm' }: { stage: DesignStage; size?: 'sm' | 'md' }) {
  const config = DESIGN_STAGES.find(s => s.value === stage)!;
  const sizeClasses = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`stage-badge ${sizeClasses} font-semibold`}
      style={{
        backgroundColor: `hsl(var(--${config.color}) / 0.12)`,
        color: `hsl(var(--${config.color}))`,
      }}
    >
      {config.emoji} {config.label}
    </span>
  );
}
