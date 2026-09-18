import { CircuitState } from '../utils/circuitBreaker';

interface CircuitStatusProps {
  state: CircuitState;
}

const CONFIG: Record<CircuitState, { label: string; dot: string; text: string; bg: string; border: string }> = {
  [CircuitState.CLOSED]: {
    label: 'API healthy',
    dot: 'bg-signal-green',
    text: 'text-signal-green',
    bg: 'bg-signal-green/10',
    border: 'border-signal-green/30',
  },
  [CircuitState.HALF_OPEN]: {
    label: 'API recovering — testing connection',
    dot: 'bg-signal-amber',
    text: 'text-signal-amber',
    bg: 'bg-signal-amber/10',
    border: 'border-signal-amber/30',
  },
  [CircuitState.OPEN]: {
    label: 'API failing — retrying automatically',
    dot: 'bg-signal-red',
    text: 'text-signal-red',
    bg: 'bg-signal-red/10',
    border: 'border-signal-red/30',
  },
};

export default function CircuitStatus({ state }: CircuitStatusProps) {
  const cfg = CONFIG[state];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full border ${cfg.border} ${cfg.bg} px-3 py-1.5`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${state === CircuitState.OPEN ? 'animate-pulse' : ''}`} />
      <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}
